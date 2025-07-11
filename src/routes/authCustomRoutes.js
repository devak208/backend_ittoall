import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Custom login with role included in response
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Custom register with role included in response
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', requireAuth, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and clear cookies
 * @access  Public (no auth required for logout)
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/users
 * @desc    Get all users (admin only)
 * @access  Private (admin only)
 */
router.get('/users', requireAdmin, authController.getAllUsers);

/**
 * @route   PUT /api/v1/auth/users/role
 * @desc    Update user role (admin only)
 * @access  Private (admin only)
 */
router.put('/users/role', requireAdmin, authController.updateUserRole);

export default router;
