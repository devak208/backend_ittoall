import express from 'express';
import { DeviceRegistrationController } from '../../controllers/device/registrationController.js';
import { validate, validationSchemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();
const registrationController = new DeviceRegistrationController();

/**
 * Device Registration Routes
 * Handles device registration operations
 */

// Device registration
router.post(
  '/register',
  validate(validationSchemas.registerDevice),
  asyncHandler(registrationController.registerDevice)
);

export default router;
