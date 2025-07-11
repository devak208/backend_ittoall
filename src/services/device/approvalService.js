import { db } from '../../database/connection.js';
import { devices, deviceHistory, disabledDevices } from '../../database/index.js';
import { eq } from 'drizzle-orm';

/**
 * Service for handling device approval operations
 */
export class DeviceApprovalService {
  /**
   * Approve a device (sets approval for 3 days)
   */
  async approveDevice(androidId, actionBy = 'admin', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      const approvedAt = new Date();
      /* const expiresAt = new Date(approvedAt.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days */
      const expiresAt = new Date(approvedAt.getTime() + (3 * 60 * 1000)); // 3 minutes


      // Update the device without returning
      // Use a transaction for update and fetch
      let updatedDevice;
      await db.transaction(async (tx) => {
        await tx
          .update(devices)
          .set({
            isApproved: true,
            approvedAt,
            expiresAt,
            updatedAt: new Date(),
            notes: notes || device.notes,
          })
          .where(eq(devices.androidId, androidId));
          
        // Fetch the updated device within the transaction
        const result = await tx
          .select()
          .from(devices)
          .where(eq(devices.androidId, androidId))
          .limit(1);
          
        updatedDevice = result[0];
        
        // Log the approval in history within the transaction
        await tx.insert(deviceHistory).values({
          deviceId: device.id,
          action: 'approved',
          previousStatus: device.isApproved,
          newStatus: true,
          actionBy,
          notes: notes || 'Device approved for 3 days',
        });
      });

      return updatedDevice;
    } catch (error) {
      throw new Error(`Failed to approve device: ${error.message}`);
    }
  }

  /**
   * Extend device approval by additional days
   */
  // Fix for extendDeviceApproval method
  async extendDeviceApproval(androidId, additionalDays = 3, actionBy = 'admin', notes = null) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device) {
        throw new Error('Device not found');
      }
  
      if (!device.isApproved) {
        throw new Error('Cannot extend approval for non-approved device');
      }
  
      const currentExpiresAt = device.expiresAt || new Date();
      const newExpiresAt = new Date(currentExpiresAt.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
  
      // Use transaction for update and fetch
      let updatedDevice;
      await db.transaction(async (tx) => {
        await tx
          .update(devices)
          .set({
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
            notes: notes || device.notes,
          })
          .where(eq(devices.androidId, androidId));
          
        // Fetch the updated device within the transaction
        const result = await tx
          .select()
          .from(devices)
          .where(eq(devices.androidId, androidId))
          .limit(1);
          
        updatedDevice = result[0];
        
        // Log the extension in history within the transaction
        await tx.insert(deviceHistory).values({
          deviceId: device.id,
          action: 'extended',
          previousStatus: true,
          newStatus: true,
          actionBy,
          notes: notes || `Approval extended by ${additionalDays} days`,
        });
      });
  
      return updatedDevice;
    } catch (error) {
      throw new Error(`Failed to extend device approval: ${error.message}`);
    }
  }

  /**
   * Approve a disabled device (move it back to active devices)
   */
  // Fix for approveDisabledDevice method
  async approveDisabledDevice(androidId, actionBy = 'admin', notes = null) {
    try {
      // Find the disabled device
      const disabledDevice = await db
        .select()
        .from(disabledDevices)
        .where(eq(disabledDevices.androidId, androidId))
        .limit(1);
  
      if (disabledDevice.length === 0) {
        throw new Error('Disabled device not found');
      }
  
      const device = disabledDevice[0];
  
      // Check if device already exists in active devices
      const existingActiveDevice = await this.getDeviceByAndroidId(androidId);
      if (existingActiveDevice) {
        throw new Error('Device is already active');
      }
  
      const approvedAt = new Date();
      const expiresAt = new Date(approvedAt.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
  
      // Use transaction for insert, delete, and fetch
      let newActiveDevice;
      await db.transaction(async (tx) => {
        // Insert into devices table
        await tx
          .insert(devices)
          .values({
            email: device.email,
            androidId: device.androidId,
            isApproved: true,
            approvedAt,
            expiresAt,
            createdAt: device.originalCreatedAt,
            updatedAt: new Date(),
            notes: notes || device.originalNotes || 'Re-approved from disabled devices',
          });
          
        // Fetch the newly inserted device
        const result = await tx
          .select()
          .from(devices)
          .where(eq(devices.androidId, androidId))
          .limit(1);
          
        newActiveDevice = result[0];
        
        // Remove from disabled devices table
        await tx.delete(disabledDevices).where(eq(disabledDevices.androidId, androidId));
        
        // Log the approval in history
        await tx.insert(deviceHistory).values({
          deviceId: newActiveDevice.id,
          action: 'reapproved',
          previousStatus: false,
          newStatus: true,
          actionBy,
          notes: notes || 'Device re-approved from disabled devices',
        });
      });
  
      return {
        success: true,
        message: 'Disabled device successfully re-approved and moved back to active devices',
        device: newActiveDevice
      };
    } catch (error) {
      throw new Error(`Failed to approve disabled device: ${error.message}`);
    }
  }

  /**
   * Check if device is currently approved and not expired
   */
  async isDeviceApproved(androidId) {
    try {
      const device = await this.getDeviceByAndroidId(androidId);
      
      if (!device || !device.isApproved) {
        return false;
      }

      // Check if expired
      if (device.expiresAt && new Date() > device.expiresAt) {
        // Auto-disable expired device
        const { DeviceActionService } = await import('./actionService.js');
        const actionService = new DeviceActionService();
        await actionService.disableDevice(androidId, 'system', 'Automatically disabled due to expiration');
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to check device approval: ${error.message}`);
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
