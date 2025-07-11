/** * Database Schema Index *  * This file serves as the main entry point for all database schemas. * It imports and re-exports all table definitions from individual schema modules. */

// Authentication schemas
export { users, accounts, sessions, verifications } from "./schemas/auth.js"

// Device-related schemas
export { devices } from "./schemas/devices.js"
export { disabledDevices, rejectedDevices } from "./schemas/deviceActions.js"
export { deviceHistory } from "./schemas/deviceHistory.js"

// Product schemas
export { products } from "./schemas/products.js"
