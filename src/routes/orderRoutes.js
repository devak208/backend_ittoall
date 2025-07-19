import express from 'express';
import { OrderController } from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const orderController = new OrderController();

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private (authenticated users) with fallback for guest checkout
 */
router.post('/', requireAuth, orderController.createOrder);

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders with pagination (admin only)
 * @access  Private (Admin only)
 */
router.get('/', requireAdmin, orderController.getAllOrders);

/**
 * @route   GET /api/v1/orders/my-orders
 * @desc    Get orders for the currently authenticated user
 * @access  Private
 */
router.get('/my-orders', requireAuth, orderController.getMyOrders);

/**
 * @route   GET /api/v1/orders/user/:userId
 * @desc    Get orders by user ID
 * @access  Private
 */
router.get('/user/:userId', requireAuth, orderController.getOrdersByUser);

/**
 * @route   GET /api/v1/orders/phone/:phoneNumber
 * @desc    Get orders by phone number
 * @access  Private
 */
router.get('/phone/:phoneNumber', requireAuth, orderController.getOrdersByPhone);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', requireAuth, orderController.getOrderById);

export default router;