import { db } from '../database/connection.js';
import { devices, deviceHistory, disabledDevices, rejectedDevices } from '../database/index.js';
import { eq, and, lt } from 'drizzle-orm';

export class DeviceService {


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
      const expiresAt = new Date(approvedAt.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days

      const updatedDevice = await db
        .update(devices)
        .set({
          isApproved: true,
          approvedAt,
          expiresAt,
          updatedAt: new Date(),
          notes: notes || device.notes,
        })
        .where(eq(devices.androidId, androidId))
        .returning();

      // Log the approval in history
      await this.logDeviceHistory(
        device.id,
        'approved',
        device.isApproved,
        true,
        actionBy,
        notes || 'Device approved for 3 days'
      );

      return updatedDevice[0];
    } catch (error) {
      throw new Error(`Failed to approve device: ${error.message}`);
    }
  }

  /**
   * Extend device approval by additional days
   */
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

      const updatedDevice = await db
        .update(devices)
        .set({
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
          notes: notes || device.notes,
        })
        .where(eq(devices.androidId, androidId))
        .returning();

      // Log the extension in history
      await this.logDeviceHistory(
        device.id,
        'extended',
        true,
        true,
        actionBy,
        notes || `Approval extended by ${additionalDays} days`
      );

      return updatedDevice[0];
    } catch (error) {
      throw new Error(`Failed to extend device approval: ${error.message}`);
    }
  }

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
   * Approve a disabled device (move it back to active devices)
   */
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

      // Move device back to active devices table with approval
      const newActiveDevice = await db
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
        })
        .returning();

      // Remove from disabled devices table
      await db.delete(disabledDevices).where(eq(disabledDevices.androidId, androidId));

      // Log the approval in history
      await this.logDeviceHistory(
        newActiveDevice[0].id,
        'reapproved',
        false,
        true,
        actionBy,
        notes || 'Device re-approved from disabled devices'
      );

      return {
        success: true,
        message: 'Disabled device successfully re-approved and moved back to active devices',
        device: newActiveDevice[0]
      };
    } catch (error) {
      throw new Error(`Failed to approve disabled device: ${error.message}`);
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
        await this.disableDevice(androidId, 'system', 'Automatically disabled due to expiration');
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to check device approval: ${error.message}`);
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
