import express from 'express';
import deviceRoutes from './device/index.js';

const router = express.Router();

/**
 * Main Device Routes Entry Point
 * All device routes are now organized in modular files
 */
router.use(deviceRoutes);

export default router;
