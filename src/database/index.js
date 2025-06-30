/**
 * Database Schema Index
 * 
 * This file serves as the main entry point for all database schemas.
 * It imports and re-exports all table definitions from individual schema modules.
 */

// Device-related schemas
export { devices } from './schemas/devices.js';
export { disabledDevices, rejectedDevices } from './schemas/deviceActions.js';
export { deviceHistory } from './schemas/deviceHistory.js';

// You can add more schema modules here as your application grows
// For example:
// export { users, userProfiles } from './schemas/users.js';
// export { sessions, refreshTokens } from './schemas/auth.js';
// export { logs, auditTrail } from './schemas/logging.js';
