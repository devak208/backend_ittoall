import { DeviceRegistrationService } from './registrationService.js';
import { DeviceApprovalService } from './approvalService.js';
import { DeviceActionService } from './actionService.js';
import { DeviceQueryService } from './queryService.js';

/**
 * Main Device Service that coordinates all device-related operations
 * This class acts as a facade for all device services
 */
export class DeviceService {
  constructor() {
    this.registrationService = new DeviceRegistrationService();
    this.approvalService = new DeviceApprovalService();
    this.actionService = new DeviceActionService();
    this.queryService = new DeviceQueryService();
  }

  // Registration operations
  async registerDevice(email, androidId, notes = null) {
    return this.registrationService.registerDevice(email, androidId, notes);
  }

  // Approval operations
  async approveDevice(androidId, actionBy = 'admin', notes = null) {
    return this.approvalService.approveDevice(androidId, actionBy, notes);
  }

  async extendDeviceApproval(androidId, additionalDays = 3, actionBy = 'admin', notes = null) {
    return this.approvalService.extendDeviceApproval(androidId, additionalDays, actionBy, notes);
  }

  async approveDisabledDevice(androidId, actionBy = 'admin', notes = null) {
    return this.approvalService.approveDisabledDevice(androidId, actionBy, notes);
  }

  async isDeviceApproved(androidId) {
    return this.approvalService.isDeviceApproved(androidId);
  }

  // Action operations
  async disableDevice(androidId, actionBy = 'system', notes = null) {
    return this.actionService.disableDevice(androidId, actionBy, notes);
  }

  async rejectDevice(androidId, actionBy = 'admin', notes = null) {
    return this.actionService.rejectDevice(androidId, actionBy, notes);
  }

  async processExpiredDevices() {
    return this.actionService.processExpiredDevices();
  }

  // Query operations
  async getDeviceByAndroidId(androidId) {
    return this.queryService.getDeviceByAndroidId(androidId);
  }

  async getAllDevices() {
    return this.queryService.getAllDevices();
  }

  async getDisabledDevices() {
    return this.queryService.getDisabledDevices();
  }

  async getRejectedDevices() {
    return this.queryService.getRejectedDevices();
  }

  async getDeviceHistory(androidId) {
    return this.queryService.getDeviceHistory(androidId);
  }
}
