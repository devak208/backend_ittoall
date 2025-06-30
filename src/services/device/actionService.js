import { db } from '../../database/connection.js';
import { devices, deviceHistory, disabledDevices, rejectedDevices } from '../../database/index.js';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Service for handling device actions (disable, reject)
 */
export class DeviceActionService {
  /**
   * Disable a device (move to disabled_devices table)
   */
  async disableDevice(androidId, actionBy = 'system', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Move device to disabled_devices table
      const disabledDevice = await db
        .insert(disabledDevices)
        .values({
          email: device.email,
          androidId: device.androidId,
          originalCreatedAt: device.createdAt,
          wasApproved: device.isApproved,
          approvedAt: device.approvedAt,
          expiresAt: device.expiresAt,
          disabledBy: actionBy,
          disableReason: notes || 'Device disabled',
          originalNotes: device.notes,
        })
        .returning();

      // Log the disable action in history (before deleting)
      await this.logDeviceHistory(
        device.id,
        'disabled',
        device.isApproved,
        false,
        actionBy,
        notes || 'Device disabled and moved to disabled_devices table'
      );

      // Remove device from main devices table
      await db.delete(devices).where(eq(devices.androidId, androidId));

      return { 
        success: true, 
        message: 'Device disabled and moved to disabled devices table',
        disabledDevice: disabledDevice[0]
      };
    } catch (error) {
      throw new Error(`Failed to disable device: ${error.message}`);
    }
  }

  /**
   * Reject a device registration request (move to rejected_devices table)
   */
  async rejectDevice(androidId, actionBy = 'admin', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      if (device.isApproved) {
        throw new Error('Cannot reject an already approved device. Please disable it instead.');
      }

      // Move device to rejected_devices table
      const rejectedDevice = await db
        .insert(rejectedDevices)
        .values({
          email: device.email,
          androidId: device.androidId,
          originalCreatedAt: device.createdAt,
          rejectedBy: actionBy,
          rejectionReason: notes || 'Device registration rejected',
          originalNotes: device.notes,
        })
        .returning();

      // Log the rejection in history (before deleting)
      await this.logDeviceHistory(
        device.id,
        'rejected',
        device.isApproved, // will be false
        false, // new approval state
        actionBy,
        notes || 'Device registration rejected and moved to rejected_devices table'
      );

      // Remove device from main devices table
      await db.delete(devices).where(eq(devices.androidId, androidId));

      return { 
        success: true, 
        message: 'Device registration rejected and moved to rejected devices table',
        rejectedDevice: rejectedDevice[0]
      };
    } catch (error) {
      throw new Error(`Failed to reject device: ${error.message}`);
    }
  }

  /**
   * Process expired devices (to be called by cron job)
   */
  async processExpiredDevices() {
    try {
      const now = new Date();
      
      // Find all approved devices that have expired
      const expiredDevices = await db
        .select()
        .from(devices)
        .where(
          and(
            eq(devices.isApproved, true),
            lt(devices.expiresAt, now)
          )
        );

      const results = [];
      for (const device of expiredDevices) {
        try {
          await this.disableDevice(
            device.androidId,
            'system',
            'Automatically disabled due to expiration'
          );
          results.push({ androidId: device.androidId, status: 'disabled' });
        } catch (error) {
          results.push({ 
            androidId: device.androidId, 
            status: 'error', 
            error: error.message 
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to process expired devices: ${error.message}`);
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
