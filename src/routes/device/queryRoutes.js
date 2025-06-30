import express from 'express';
import { DeviceQueryController } from '../../controllers/device/queryController.js';
import { validate, validationSchemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();
const queryController = new DeviceQueryController();

/**
 * Device Query Routes
 * Handles device information retrieval operations
 */

// Check device approval status
router.get(
  '/:androidId/status',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(queryController.checkApprovalStatus)
);

// Simple check if device is approved (returns only boolean)
router.get(
  '/:androidId/approved',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(queryController.isDeviceApproved)
);

// Get device history
router.get(
  '/:androidId/history',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(queryController.getDeviceHistory)
);

// Get all devices (admin endpoint)
router.get(
  '/',
  asyncHandler(queryController.getAllDevices)
);

// Get all disabled devices (admin endpoint)
router.get(
  '/disabled',
  asyncHandler(queryController.getDisabledDevices)
);

// Get all rejected devices (admin endpoint)
router.get(
  '/rejected',
  asyncHandler(queryController.getRejectedDevices)
);

export default router;
