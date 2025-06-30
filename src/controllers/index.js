/**
 * Controllers Index
 * 
 * This file serves as the main entry point for all controller modules.
 * It imports and re-exports all controller classes from individual controller modules.
 */

// Device-related controllers
export { DeviceController } from './device/index.js';
export { DeviceRegistrationController } from './device/registrationController.js';
export { DeviceApprovalController } from './device/approvalController.js';
export { DeviceActionController } from './device/actionController.js';
export { DeviceQueryController } from './device/queryController.js';

// You can add more controller modules here as your application grows
// For example:
// export { UserController } from './user/index.js';
// export { AuthController } from './auth/index.js';
// export { AdminController } from './admin/index.js';
