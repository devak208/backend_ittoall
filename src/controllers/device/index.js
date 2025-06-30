import { DeviceRegistrationController } from './registrationController.js';
import { DeviceApprovalController } from './approvalController.js';
import { DeviceActionController } from './actionController.js';
import { DeviceQueryController } from './queryController.js';

/**
 * Main Device Controller that coordinates all device-related operations
 * This class acts as a facade for all device controllers
 */
export class DeviceController {
  constructor() {
    this.registrationController = new DeviceRegistrationController();
    this.approvalController = new DeviceApprovalController();
    this.actionController = new DeviceActionController();
    this.queryController = new DeviceQueryController();
  }

  // Registration operations
  async registerDevice(req, res) {
    return this.registrationController.registerDevice(req, res);
  }

  // Approval operations
  async approveDevice(req, res) {
    return this.approvalController.approveDevice(req, res);
  }

  async extendApproval(req, res) {
    return this.approvalController.extendApproval(req, res);
  }

  async approveDisabledDevice(req, res) {
    return this.approvalController.approveDisabledDevice(req, res);
  }

  // Action operations
  async rejectDevice(req, res) {
    return this.actionController.rejectDevice(req, res);
  }

  async disableDevice(req, res) {
    return this.actionController.disableDevice(req, res);
  }

  async processExpiredDevices(req, res) {
    return this.actionController.processExpiredDevices(req, res);
  }

  // Query operations
  async checkApprovalStatus(req, res) {
    return this.queryController.checkApprovalStatus(req, res);
  }

  async isDeviceApproved(req, res) {
    return this.queryController.isDeviceApproved(req, res);
  }

  async getAllDevices(req, res) {
    return this.queryController.getAllDevices(req, res);
  }

  async getDisabledDevices(req, res) {
    return this.queryController.getDisabledDevices(req, res);
  }

  async getRejectedDevices(req, res) {
    return this.queryController.getRejectedDevices(req, res);
  }

  async getDeviceHistory(req, res) {
    return this.queryController.getDeviceHistory(req, res);
  }
}
