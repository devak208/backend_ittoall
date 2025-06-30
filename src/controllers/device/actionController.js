import { DeviceService } from '../../services/device/index.js';

const deviceService = new DeviceService();

/**
 * Controller for device action operations (disable, reject)
 */
export class DeviceActionController {
  /**
   * Reject a device registration request
   */
  async rejectDevice(req, res) {
    try {
      const { androidId } = req.params;
      const { actionBy, notes } = req.body;

      const result = await deviceService.rejectDevice(androidId, actionBy, notes);

      res.json({
        success: true,
        message: result.message,
        data: result.rejectedDevice,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Disable a device
   */
  async disableDevice(req, res) {
    try {
      console.log('DisableDevice - req.params:', req.params);
      console.log('DisableDevice - req.body:', req.body);
      
      const { androidId } = req.params;
      const { actionBy, notes } = req.body;

      if (!androidId) {
        return res.status(400).json({
          success: false,
          message: 'Android ID parameter is missing',
        });
      }

      const result = await deviceService.disableDevice(androidId, actionBy, notes);

      res.json({
        success: true,
        message: result.message,
        data: result.disabledDevice,
      });
    } catch (error) {
      console.error('DisableDevice error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Process expired devices manually
   */
  async processExpiredDevices(req, res) {
    try {
      const results = await deviceService.processExpiredDevices();

      res.json({
        success: true,
        message: 'Expired devices processed',
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
