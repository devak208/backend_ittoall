import express from 'express';
import { DeviceController } from '../controllers/deviceController.js';
import { validate, validationSchemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const deviceController = new DeviceController();

// Device registration
router.post(
  '/register',
  validate(validationSchemas.registerDevice),
  asyncHandler(deviceController.registerDevice)
);

// Approve device
router.patch(
  '/:androidId/approve',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.approveDevice),
  asyncHandler(deviceController.approveDevice)
);

// Extend device approval
router.patch(
  '/:androidId/extend',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.extendApproval),
  asyncHandler(deviceController.extendApproval)
);

// Reject device
router.patch(
  '/:androidId/reject',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.rejectDevice),
  asyncHandler(deviceController.rejectDevice)
);

// Disable device
router.patch(
  '/:androidId/disable',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.disableDevice),
  asyncHandler(deviceController.disableDevice)
);

// Check device approval status
router.get(
  '/:androidId/status',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(deviceController.checkApprovalStatus)
);

// Simple check if device is approved (returns only boolean)
router.get(
  '/:androidId/approved',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(deviceController.isDeviceApproved)
);

// Get device history
router.get(
  '/:androidId/history',
  validate(validationSchemas.androidIdParam, 'params'),
  asyncHandler(deviceController.getDeviceHistory)
);

// Get all devices (admin endpoint)
router.get(
  '/',
  asyncHandler(deviceController.getAllDevices)
);

// Get all disabled devices (admin endpoint)
router.get(
  '/disabled',
  asyncHandler(deviceController.getDisabledDevices)
);

// Approve a disabled device (move back to active devices)
router.patch(
  '/disabled/:androidId/approve',
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.approveDevice),
  asyncHandler(deviceController.approveDisabledDevice)
);

// Get all rejected devices (admin endpoint)
router.get(
  '/rejected',
  asyncHandler(deviceController.getRejectedDevices)
);

// Process expired devices manually (admin endpoint)
router.post(
  '/process-expired',
  asyncHandler(deviceController.processExpiredDevices)
);

export default router;
