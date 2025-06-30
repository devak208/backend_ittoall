import { db } from '../../database/connection.js';
import { devices, deviceHistory, disabledDevices, rejectedDevices } from '../../database/index.js';
import { eq } from 'drizzle-orm';

/**
 * Service for handling device registration operations
 */
export class DeviceRegistrationService {
  /**
   * Register a new device
   */
  async registerDevice(email, androidId, notes = null) {
    try {
      // Check if device already exists in active devices
      const existingDevice = await this.getDeviceByAndroidId(androidId);
      if (existingDevice) {
        throw new Error('Device with this Android ID already exists and is active');
      }

      // Check if device exists in disabled devices
      const disabledDevice = await db
        .select()
        .from(disabledDevices)
        .where(eq(disabledDevices.androidId, androidId))
        .limit(1);

      if (disabledDevice.length > 0) {
        throw new Error('Device with this Android ID was previously disabled and cannot be re-registered');
      }

      // Check if device exists in rejected devices
      const rejectedDevice = await db
        .select()
        .from(rejectedDevices)
        .where(eq(rejectedDevices.androidId, androidId))
        .limit(1);

      if (rejectedDevice.length > 0) {
        throw new Error('Device with this Android ID was previously rejected and cannot be re-registered');
      }

      /* // Check if email already has a device
      const existingEmailDevice = await db
        .select()
        .from(devices)
        .where(eq(devices.email, email))
        .limit(1);

      if (existingEmailDevice.length > 0) {
        throw new Error('Email already has a registered device');
      }
 */
      // Create new device
      const newDevice = await db
        .insert(devices)
        .values({
          email,
          androidId,
          notes,
          isApproved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Log the registration in history
      await this.logDeviceHistory(
        newDevice[0].id,
        'registered',
        false,
        false,
        'system',
        notes || 'Device registered and pending approval'
      );

      return newDevice[0];
    } catch (error) {
      throw new Error(`Failed to register device: ${error.message}`);
    }
  }

  /**
   * Get device by Android ID
   */
  async getDeviceByAndroidId(androidId) {
    try {
      const result = await db
        .select()
        .from(devices)
        .where(eq(devices.androidId, androidId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get device: ${error.message}`);
    }
  }

  /**
   * Log device history
   */
  async logDeviceHistory(deviceId, action, previousStatus, newStatus, actionBy, notes = null) {
    try {
      await db.insert(deviceHistory).values({
        deviceId,
        action,
        previousStatus,
        newStatus,
        actionBy,
        notes,
      });
    } catch (error) {
      console.error('Failed to log device history:', error);
    }
  }
}
