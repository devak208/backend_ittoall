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
  // Fix for disableDevice method
  async disableDevice(androidId, actionBy = 'system', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Use transaction for insert, delete, and logging
      let disabledDevice;
      await db.transaction(async (tx) => {
        // Insert into disabled_devices table
        await tx
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
          });
        
        // Fetch the newly inserted disabled device
        const result = await tx
          .select()
          .from(disabledDevices)
          .where(eq(disabledDevices.androidId, androidId))
          .limit(1);
          
        disabledDevice = result[0];
  
        // Log the disable action in history (before deleting)
        await tx.insert(deviceHistory).values({
          deviceId: device.id,
          action: 'disabled',
          previousStatus: device.isApproved,
          newStatus: false,
          actionBy,
          notes: notes || 'Device disabled and moved to disabled_devices table'
        });
  
        // Remove device from main devices table
        await tx.delete(devices).where(eq(devices.androidId, androidId));
      });
  
      return { 
        success: true, 
        message: 'Device disabled and moved to disabled devices table',
        disabledDevice: disabledDevice
      };
    } catch (error) {
      throw new Error(`Failed to disable device: ${error.message}`);
    }
  }

  // Fix for rejectDevice method
  async rejectDevice(androidId, actionBy = 'admin', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }
  
      if (device.isApproved) {
        throw new Error('Cannot reject an already approved device. Please disable it instead.');
      }
  
      // Use transaction for insert, delete, and logging
      let rejectedDevice;
      await db.transaction(async (tx) => {
        // Insert into rejected_devices table
        await tx
          .insert(rejectedDevices)
          .values({
            email: device.email,
            androidId: device.androidId,
            originalCreatedAt: device.createdAt,
            rejectedBy: actionBy,
            rejectionReason: notes || 'Device registration rejected',
            originalNotes: device.notes,
          });
        
        // Fetch the newly inserted rejected device
        const result = await tx
          .select()
          .from(rejectedDevices)
          .where(eq(rejectedDevices.androidId, androidId))
          .limit(1);
          
        rejectedDevice = result[0];
  
        // Log the rejection in history (before deleting)
        await tx.insert(deviceHistory).values({
          deviceId: device.id,
          action: 'rejected',
          previousStatus: device.isApproved, // will be false
          newStatus: false, // new approval state
          actionBy,
          notes: notes || 'Device registration rejected and moved to rejected_devices table'
        });
  
        // Remove device from main devices table
        await tx.delete(devices).where(eq(devices.androidId, androidId));
      });
  
      return { 
        success: true, 
        message: 'Device registration rejected and moved to rejected devices table',
        rejectedDevice: rejectedDevice
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
