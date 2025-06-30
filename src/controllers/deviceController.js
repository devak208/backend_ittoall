import { DeviceService } from '../services/deviceService.js';

const deviceService = new DeviceService();

export class DeviceController {
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
