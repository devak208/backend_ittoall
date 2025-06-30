import cron from 'node-cron';
import { DeviceService } from '../services/deviceService.js';

const deviceService = new DeviceService();

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Start all cron jobs
   */
  startAll() {
    this.startExpiredDevicesJob();
    console.log('All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Start job to process expired devices
   * Runs every hour to check for expired devices
   */
  startExpiredDevicesJob() {
    const jobName = 'expired-devices';
    
    // Run every hour at minute 0
    const job = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Starting expired devices processing...');
        const results = await deviceService.processExpiredDevices();
        
        if (results.length > 0) {
          console.log(`Processed ${results.length} expired devices:`, results);
        } else {
          console.log('No expired devices found');
        }
      } catch (error) {
        console.error('Error processing expired devices:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set(jobName, job);
    console.log(`Started cron job: ${jobName} - runs every hour`);
  }

  /**
   * Start a custom job for testing (runs every minute)
   */
  startTestJob() {
    const jobName = 'test-expired-devices';
    
    // Run every minute for testing
    const job = cron.schedule('* * * * *', async () => {
      try {
        console.log('Testing expired devices processing...');
        const results = await deviceService.processExpiredDevices();
        
        if (results.length > 0) {
          console.log(`Test: Processed ${results.length} expired devices:`, results);
        } else {
          console.log('Test: No expired devices found');
        }
      } catch (error) {
        console.error('Test: Error processing expired devices:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set(jobName, job);
    console.log(`Started test cron job: ${jobName} - runs every minute`);
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`Stopped cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        destroyed: job.destroyed,
      };
    });
    return status;
  }
}

export const cronService = new CronService();
