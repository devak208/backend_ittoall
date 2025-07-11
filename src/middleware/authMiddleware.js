// src/middleware/auth.js
import { jwtService } from '../lib/jwt.js';
import { db } from '../database/connection.js';
import { users } from '../database/schemas/auth.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware to check if user is authenticated
 * Supports both mobile (Authorization header) and web (JWT token in various formats)
 * Also supports automatic token refresh using refresh tokens
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    let refreshToken = null;
    let isRefreshFlow = false;

    // Method 1: Check Authorization header (for mobile apps)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('📱 Mobile token received (Bearer format)');
      } else {
        token = authHeader;
        console.log('📱 Mobile token received (direct format)');
      }
    }

    // Method 2: Check cookies (for web browsers)
    if (!token && req.cookies) {
      // First try to get access token
      if (req.cookies.access_token) {
        token = req.cookies.access_token;
        console.log('🌐 Web access token received from cookies');
      } else if (req.cookies.token) {
        token = req.cookies.token;
        console.log('🌐 Web token received from cookies (legacy format)');
      }
      
      // Store refresh token for later use if needed
      if (req.cookies.refresh_token) {
        refreshToken = req.cookies.refresh_token;
        console.log('🔄 Refresh token found in cookies');
      }
    }

    // Method 3: Check for token in request body (optional)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
      console.log('📝 Token received from request body');
    }

    // Try to verify the access token if we have one
    let decoded;
    if (token) {
      try {
        decoded = jwtService.verifyToken(token);
        console.log('✅ Access token verified for user:', decoded.email);
      } catch (error) {
        console.log('⚠️ Access token verification failed:', error.message);
        // Token is invalid, but we might have a refresh token to try
        token = null;
      }
    }

    // If access token is invalid or missing, try refresh token flow
    if (!token && refreshToken) {
      console.log('🔄 Attempting to refresh access token...');
      try {
        // Verify refresh token
        const refreshDecoded = jwtService.verifyRefreshToken(refreshToken);
        
        // Get user and check token version
        const userResult = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            emailVerified: users.emailVerified,
            image: users.image,
            tokenVersion: users.tokenVersion,
          })
          .from(users)
          .where(eq(users.id, refreshDecoded.id))
          .limit(1);
        
        if (userResult.length === 0) {
          console.log('❌ User not found during refresh flow');
          return res.status(401).json({
            success: false,
            message: 'Authentication failed',
          });
        }
        
        const user = userResult[0];
        
        // Validate token version (prevents use of revoked refresh tokens)
        if (user.tokenVersion !== refreshDecoded.tokenVersion) {
          console.log('❌ Token version mismatch during refresh');
          return res.status(401).json({
            success: false,
            message: 'Token has been revoked',
          });
        }
        
        // Generate new access token
        const accessToken = jwtService.generateToken(user);
        
        // Set new access token cookie
        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });
        
        // Use the new token for this request
        token = accessToken;
        decoded = jwtService.verifyToken(token);
        isRefreshFlow = true;
        console.log('✅ Access token refreshed successfully for user:', user.email);
        
        // Add this line to set the user object in the request
        req.user = user;
      } catch (error) {
        console.log('❌ Refresh token flow failed:', error.message);
        // Both access and refresh tokens are invalid
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          hint: 'Please log in again to obtain new tokens'
        });
      }
    }

    // If we still don't have a valid token after trying refresh
    if (!token) {
      console.log('❌ No valid token found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        hint: 'Please include valid token in Authorization header or cookies'
      });
    }

    // If we didn't go through the refresh flow, we need to get the user from DB
    if (!isRefreshFlow) {
      // Get user from database to ensure they still exist
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (user.length === 0) {
        console.log('❌ User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      console.log('✅ User authenticated:', user[0].email);

      // Add user info to request object
      req.user = user[0];
    }

    // Set token info in request object
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      console.log('❌ Admin access denied for user:', req.user.email, 'Role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    console.log('✅ Admin access granted for user:', req.user.email);
    req.userRole = req.user.role;
    
    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

/**
 * Middleware factory to check if user has specific role(s)
 */
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // First authenticate the user
      await new Promise((resolve, reject) => {
        requireAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        console.log('❌ Role access denied for user:', req.user.email, 'Role:', req.user.role, 'Required:', allowedRoles);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
      }

      console.log('✅ Role access granted for user:', req.user.email, 'Role:', req.user.role);
      req.userRole = req.user.role;
      
      next();
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};

