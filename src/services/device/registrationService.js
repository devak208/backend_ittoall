import { db } from '../../database/connection.js';
import { devices, deviceHistory, disabledDevices, rejectedDevices } from '../../database/index.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
/**
 * Service for handling device registration operations
 */
export class DeviceRegistrationService {
  /**
   * Register a new device
   */
  async registerDevice(email, androidId, notes = null) {
    try {
      const existingDevice = await this.getDeviceByAndroidId(androidId);
      if (existingDevice) {
        throw new Error('Device with this Android ID already exists and is active');
      }

      const disabledDevice = await db.select().from(disabledDevices)
        .where(eq(disabledDevices.androidId, androidId)).limit(1);
      if (disabledDevice.length > 0) {
        throw new Error('Device with this Android ID was previously disabled and cannot be re-registered');
      }

      const rejectedDevice = await db.select().from(rejectedDevices)
        .where(eq(rejectedDevices.androidId, androidId)).limit(1);
      if (rejectedDevice.length > 0) {
        throw new Error('Device with this Android ID was previously rejected and cannot be re-registered');
      }


      await db.insert(devices).values({
        email,
        androidId,
       notes: typeof notes === 'string' ? notes : null,
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });



      const newDevice = await this.getDeviceByAndroidId(androidId);

      await this.logDeviceHistory(
        newDevice.id,
        'registered',
        false,
        false,
        'system',
        notes || 'Device registered and pending approval'
      );

      return newDevice;
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
