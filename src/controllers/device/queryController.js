import { DeviceService } from '../../services/device/index.js';

const deviceService = new DeviceService();

/**
 * Controller for device query operations
 */
export class DeviceQueryController {
  /**
   * Check device approval status
   */
  async checkApprovalStatus(req, res) {
    try {
      const { androidId } = req.params;

      const isApproved = await deviceService.isDeviceApproved(androidId);
      const device = await deviceService.getDeviceByAndroidId(androidId);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }

      res.json({
        success: true,
        data: {
          androidId: device.androidId,
          email: device.email,
          isApproved,
          approvedAt: device.approvedAt,
          expiresAt: device.expiresAt,
          createdAt: device.createdAt,
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
   * Simple check if device is approved (returns only boolean)
   */
  async isDeviceApproved(req, res) {
    try {
      const { androidId } = req.params;

      const device = await deviceService.getDeviceByAndroidId(androidId);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          isApproved: false,
        });
      }

      res.json({
        success: true,
        androidId: androidId,
        isApproved: device.isApproved || false,
        message: device.isApproved ? 'Device is approved' : 'Device is not approved',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        isApproved: false,
      });
    }
  }

  /**
   * Get all devices
   */
  async getAllDevices(req, res) {
    try {
      const devices = await deviceService.getAllDevices();

      res.json({
        success: true,
        data: devices.map(device => ({
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          isApproved: device.isApproved,
          approvedAt: device.approvedAt,
          expiresAt: device.expiresAt,
          createdAt: device.createdAt,
          updatedAt: device.updatedAt,
          notes: device.notes,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all disabled devices (admin endpoint)
   */
  async getDisabledDevices(req, res) {
    try {
      const disabledDevices = await deviceService.getDisabledDevices();

      res.json({
        success: true,
        data: disabledDevices.map(device => ({
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          originalCreatedAt: device.originalCreatedAt,
          wasApproved: device.wasApproved,
          approvedAt: device.approvedAt,
          expiresAt: device.expiresAt,
          disabledAt: device.disabledAt,
          disabledBy: device.disabledBy,
          disableReason: device.disableReason,
          originalNotes: device.originalNotes,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all rejected devices (admin endpoint)
   */
  async getRejectedDevices(req, res) {
    try {
      const rejectedDevices = await deviceService.getRejectedDevices();

      res.json({
        success: true,
        data: rejectedDevices.map(device => ({
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          originalCreatedAt: device.originalCreatedAt,
          rejectedAt: device.rejectedAt,
          rejectedBy: device.rejectedBy,
          rejectionReason: device.rejectionReason,
          originalNotes: device.originalNotes,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get device history
   */
  async getDeviceHistory(req, res) {
    try {
      const { androidId } = req.params;

      const history = await deviceService.getDeviceHistory(androidId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
