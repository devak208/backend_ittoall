import { DeviceService } from '../../services/device/index.js';

const deviceService = new DeviceService();

/**
 * Controller for device registration operations
 */
export class DeviceRegistrationController {
  /**
   * Register a new device
   */
  async registerDevice(req, res) {
    try {
      const { email, androidId, notes } = req.body;

      if (!email || !androidId) {
        return res.status(400).json({
          success: false,
          message: 'Email and Android ID are required',
        });
      }

      const device = await deviceService.registerDevice(email, androidId, notes);

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          id: device.id,
          email: device.email,
          androidId: device.androidId,
          isApproved: device.isApproved,
          createdAt: device.createdAt,
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
