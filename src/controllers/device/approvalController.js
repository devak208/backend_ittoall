import { DeviceService } from '../../services/device/index.js';

const deviceService = new DeviceService();

/**
 * Controller for device approval operations
 */
export class DeviceApprovalController {
  /**
   * Approve a device
   */
  async approveDevice(req, res) {
    try {
      const { androidId } = req.params;
      const { actionBy, notes } = req.body;

      const device = await deviceService.approveDevice(androidId, actionBy, notes);

      res.json({
        success: true,
        message: 'Device approved successfully',
        data: {
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          isApproved: device.isApproved,
          approvedAt: device.approvedAt,
          expiresAt: device.expiresAt,
          updatedAt: device.updatedAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Extend device approval
   */
  async extendApproval(req, res) {
    try {
      const { androidId } = req.params;
      const { additionalDays = 3, actionBy, notes } = req.body;

      const device = await deviceService.extendDeviceApproval(
        androidId,
        additionalDays,
        actionBy,
        notes
      );

      res.json({
        success: true,
        message: `Device approval extended by ${additionalDays} days`,
        data: {
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          isApproved: device.isApproved,
          expiresAt: device.expiresAt,
          updatedAt: device.updatedAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Approve a disabled device (move it back to active devices)
   */
  async approveDisabledDevice(req, res) {
    try {
      const { androidId } = req.params;
      const { actionBy, notes } = req.body;

      const result = await deviceService.approveDisabledDevice(androidId, actionBy, notes);

      res.json({
        success: true,
        message: result.message,
        data: {
          id: result.device.id,
          email: result.device.email,
          androidId: result.device.androidId,
          isApproved: result.device.isApproved,
          approvedAt: result.device.approvedAt,
          expiresAt: result.device.expiresAt,
          updatedAt: result.device.updatedAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
