import { db } from '../../database/connection.js';
import { devices, deviceHistory, disabledDevices, rejectedDevices } from '../../database/index.js';
import { eq } from 'drizzle-orm';

/**
 * Service for handling device query operations
 */
export class DeviceQueryService {
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
   * Get all devices
   */
  async getAllDevices() {
    try {
      return await db.select().from(devices);
    } catch (error) {
      throw new Error(`Failed to get devices: ${error.message}`);
    }
  }

  /**
   * Get all disabled devices
   */
  async getDisabledDevices() {
    try {
      return await db.select().from(disabledDevices);
    } catch (error) {
      throw new Error(`Failed to get disabled devices: ${error.message}`);
    }
  }

  /**
   * Get all rejected devices
   */
  async getRejectedDevices() {
    try {
      return await db.select().from(rejectedDevices);
    } catch (error) {
      throw new Error(`Failed to get rejected devices: ${error.message}`);
    }
  }

  /**
   * Get device history
   */
  async getDeviceHistory(androidId) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      return await db
        .select()
        .from(deviceHistory)
        .where(eq(deviceHistory.deviceId, device.id))
        .orderBy(deviceHistory.createdAt);
    } catch (error) {
      throw new Error(`Failed to get device history: ${error.message}`);
    }
  }
}
