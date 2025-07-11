import express from 'express';
import { DeviceApprovalController } from '../../controllers/device/approvalController.js';
import { validate, validationSchemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
const approvalController = new DeviceApprovalController();

/**
 * Device Approval Routes
 * Handles device approval and extension operations
 */

// Approve device
router.patch(
  '/:androidId/approve',
  //requireAdmin, // Add admin authentication
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.approveDevice),
  asyncHandler(approvalController.approveDevice)
);

// Extend device approval
router.patch(
  '/:androidId/extend',
  //requireAdmin, // Add admin authentication
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.extendApproval),
  asyncHandler(approvalController.extendApproval)
);

// Approve a disabled device (move back to active devices)
router.patch(
  '/disabled/:androidId/approve',
  //requireAdmin, // Add admin authentication
  validate(validationSchemas.androidIdParam, 'params'),
  validate(validationSchemas.approveDevice),
  asyncHandler(approvalController.approveDisabledDevice)
);

export default router;
