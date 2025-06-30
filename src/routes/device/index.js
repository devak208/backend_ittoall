import express from 'express';
import registrationRoutes from './registrationRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import actionRoutes from './actionRoutes.js';
import queryRoutes from './queryRoutes.js';

const router = express.Router();

/**
 * Main Device Routes
 * Combines all device-related route modules
 */

// Registration routes
router.use(registrationRoutes);

// Approval routes  
router.use(approvalRoutes);

// Action routes
router.use(actionRoutes);

// Query routes
router.use(queryRoutes);

export default router;
