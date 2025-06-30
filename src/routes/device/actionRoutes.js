import express from 'express';
import { DeviceActionController } from '../../controllers/device/actionController.js';
import { validate, validationSchemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();
const actionController = new DeviceActionController();

/**
 * Device Action Routes
 * Handles device disable, reject, and administrative actions
 */

// Reject device
router.patch(
  '/:androidId/reject',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.rejectDevice),
  asyncHandler(actionController.rejectDevice)
);

// Disable device
router.patch(
  '/:androidId/disable',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.disableDevice),
  asyncHandler(actionController.disableDevice)
);

// Process expired devices manually (admin endpoint)
router.post(
  '/process-expired',
  asyncHandler(actionController.processExpiredDevices)
);

export default router;
