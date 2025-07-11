import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth, requireAdmin, requireRole } from '../middleware/auth.js';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/logout', requireAuth, authController.logout);

// Admin routes
router.get('/users', requireAdmin, authController.getAllUsers);
router.put('/users/role', requireAdmin, authController.updateUserRole);

// Role-based routes (example)
router.get('/admin-or-moderator', requireRole(['admin', 'moderator']), (req, res) => {
  res.json({ message: 'This is for admin or moderator only' });
});

export default router;
