import { db } from '../database/connection.js';
import { users, accounts } from '../database/schemas/auth.js';
import { eq } from 'drizzle-orm';
import { jwtService } from '../lib/jwt.js';

export class AuthController {
  /**
   * Get current user profile
   */
  getCurrentUser = async (req, res, next) => {
    try {
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
          image: users.image,
          createdAt: users.createdAt,
          tokenVersion: users.tokenVersion,
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Create session-like object for compatibility
      const session = jwtService.generateSession(user[0], req.token);

      res.json({
        success: true,
        data: {
          user: user[0],
          session: {
            id: session.session.id,
            expiresAt: session.session.expiresAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user role (admin only)
   */
  updateUserRole = async (req, res, next) => {
    try {
      const { userId, role } = req.body;
      const validRoles = ['admin', 'user', 'moderator'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Valid roles are: admin, user, moderator',
        });
      }

      // Check if current user is admin (handled by middleware)
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      // Use transaction for update and fetch
      let updatedUser;
      await db.transaction(async (tx) => {
        // Update the user role
        await tx
          .update(users)
          .set({ 
            role,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
          
        // Fetch the updated user
        const result = await tx
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
          
        updatedUser = result[0];
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all users (admin only)
   */
  getAllUsers = async (req, res, next) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users);

      res.json({
        success: true,
        data: allUsers,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login with JWT
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user by email with error handling for missing columns
      let user;
      try {
        user = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            emailVerified: users.emailVerified,
            image: users.image,
            tokenVersion: users.tokenVersion,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      } catch (error) {
        // If the error is about missing token_version column
        if (error.cause && error.cause.code === 'ER_BAD_FIELD_ERROR' && 
            error.cause.sqlMessage.includes('token_version')) {
          // Try again without the tokenVersion field
          user = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
              emailVerified: users.emailVerified,
              image: users.image,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
            
          // Add a default tokenVersion if the user exists
          if (user.length > 0) {
            user[0].tokenVersion = 0;
          }
        } else {
          // If it's a different error, rethrow it
          throw error;
        }
      }

      if (user.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const account = await db
        .select({ password: accounts.password })
        .from(accounts)
        .where(eq(accounts.userId, user[0].id))
        .limit(1);

      if (account.length === 0 || !account[0].password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = await jwtService.comparePassword(password, account[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Set cookies and generate tokens
      const { accessToken, refreshToken } = jwtService.setAuthCookies(res, user[0]);

      // Create session-like object for compatibility
      const session = jwtService.generateSession(user[0], accessToken);

      // Response format to match original
      const authData = {
        user: {
          id: user[0].id,
          name: user[0].name,
          email: user[0].email,
          role: user[0].role,
          emailVerified: user[0].emailVerified,
          image: user[0].image,
          createdAt: user[0].createdAt,
          updatedAt: user[0].updatedAt,
        },
        session: session.session,
        token: accessToken // For mobile clients
      };

      res.json(authData);
    } catch (error) {
      console.error('Error in login:', error);
      next(error);
    }
  };

  /**
   * Register with JWT
   */
  register = async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Hash password
      const hashedPassword = await jwtService.hashPassword(password);

      // Create user and account in transaction
      let newUser;
      await db.transaction(async (tx) => {
        // Create user
        const userResult = await tx
          .insert(users)
          .values({
            name,
            email,
            emailVerified: false,
            role: 'user',
            tokenVersion: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        // Get the inserted user
        const insertedUser = await tx
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            emailVerified: users.emailVerified,
            image: users.image,
            tokenVersion: users.tokenVersion,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        newUser = insertedUser[0];

        // Create account
        await tx
          .insert(accounts)
          .values({
            userId: newUser.id,
            accountId: email,
            providerId: 'email',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      });

      // Set cookies and generate tokens
      const { accessToken, refreshToken } = jwtService.setAuthCookies(res, newUser);

      // Create session-like object for compatibility
      const session = jwtService.generateSession(newUser, accessToken);

      // Response format to match original
      const authData = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          emailVerified: newUser.emailVerified,
          image: newUser.image,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        session: session.session,
        token: accessToken // For mobile clients
      };

      res.status(201).json(authData);
    } catch (error) {
      console.error('Error in register:', error);
      next(error);
    }
  };

  /**
   * Logout - clear cookies and tokens
   */
  logout = async (req, res, next) => {
    try {
      console.log('🚪 Processing logout request');
      
      // Clear auth cookies
      jwtService.clearAuthCookies(res);
      console.log('🍪 Auth cookies cleared');
      
      // Optionally: Increment token version to invalidate refresh tokens
      // This is useful if you want to invalidate all existing refresh tokens for this user
      // Uncomment if you want this behavior
      /*
      if (req.user && req.user.id) {
        await db
          .update(users)
          .set({ 
            tokenVersion: sql`${users.tokenVersion} + 1`,
            updatedAt: new Date() 
          })
          .where(eq(users.id, req.user.id));
        console.log('🔄 Token version incremented for user ID:', req.user.id);
      }
      */
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('❌ Error in logout:', error);
      next(error);
    }
  };

  /**
   * Refresh access token using refresh token
   */
  refreshToken = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refresh_token;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found',
        });
      }
      
      // Verify refresh token
      let decoded;
      try {
        decoded = jwtService.verifyRefreshToken(refreshToken);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }
      
      // Get user and check token version
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
          image: users.image,
          tokenVersion: users.tokenVersion,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);
      
      if (user.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }
      
      // Validate token version (prevents use of revoked refresh tokens)
      if (user[0].tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked',
        });
      }
      
      // Generate new access token
      const accessToken = jwtService.generateToken(user[0]);
      
      // Set new access token cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      // Create session-like object for compatibility
      const session = jwtService.generateSession(user[0], accessToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user[0],
          session: session.session,
          token: accessToken, // For mobile clients
        },
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      next(error);
    }
  };
}
