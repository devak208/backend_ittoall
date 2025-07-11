import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Shorter expiry for access tokens
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class JWTService {
  /**
   * Generate access token for user
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'your-app-name',
        audience: 'your-app-users'
      }
    );
  }

  /**
   * Generate refresh token for user
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { 
        id: user.id,
        tokenVersion: user.tokenVersion || 0 // For token invalidation
      },
      JWT_REFRESH_SECRET,
      { 
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'your-app-name',
        audience: 'your-app-users'
      }
    );
  }

  /**
   * Verify access token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Set authentication cookies
   */
  setAuthCookies(res, user) {
    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Set cookies
    // Access token - short lived, httpOnly for security
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    
    // Refresh token - longer lived, httpOnly for security
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    
    return { accessToken, refreshToken };
  }

  /**
   * Clear authentication cookies
   */
  /**
   * Clear authentication cookies
   */
  clearAuthCookies(res) {
    // Clear options for secure environments
    const secureOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    };
    
    // Clear options for less secure environments (fallback)
    const fallbackOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    };
    
    // Clear access token cookie (both secure and fallback)
    res.cookie('access_token', '', secureOptions);
    res.cookie('access_token', '', fallbackOptions);
    
    // Clear refresh token cookie (both secure and fallback)
    res.cookie('refresh_token', '', secureOptions);
    res.cookie('refresh_token', '', fallbackOptions);
    
    // Clear any legacy token formats
    res.cookie('token', '', secureOptions);
    res.cookie('token', '', fallbackOptions);
    
    // Clear any session cookies
    res.cookie('session', '', secureOptions);
    res.cookie('session', '', fallbackOptions);
  }

  /**
   * Generate session-like object for compatibility
   */
  generateSession(user, token) {
    const decoded = this.verifyToken(token);
    return {
      session: {
        id: `session_${Date.now()}_${user.id}`,
        userId: user.id,
        token,
        expiresAt: new Date(decoded.exp * 1000),
        createdAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
      }
    };
  }
}

export const jwtService = new JWTService();
