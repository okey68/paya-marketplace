const cron = require('node-cron');
const hrVerificationService = require('./hrVerificationService');

let timeoutCheckJob = null;
let reminderJob = null;
let isInitialized = false;

/**
 * Initialize HR verification scheduled jobs
 */
const initializeScheduler = () => {
  if (isInitialized) {
    console.log('HR Verification Scheduler already initialized');
    return;
  }

  console.log('Initializing HR Verification Scheduler...');

  // Check for timeouts every hour
  // Runs at minute 0 of every hour
  timeoutCheckJob = cron.schedule('0 * * * *', async () => {
    console.log('[HR Scheduler] Running timeout check...');
    try {
      const escalatedCount = await hrVerificationService.checkTimeouts();
      console.log(`[HR Scheduler] Timeout check complete. Escalated: ${escalatedCount}`);
    } catch (error) {
      console.error('[HR Scheduler] Error during timeout check:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Nairobi'
  });

  // Send reminders twice daily (9 AM and 3 PM Nairobi time)
  reminderJob = cron.schedule('0 9,15 * * *', async () => {
    console.log('[HR Scheduler] Running reminder job...');
    try {
      const reminderCount = await hrVerificationService.sendReminders();
      console.log(`[HR Scheduler] Reminder job complete. Sent: ${reminderCount}`);
    } catch (error) {
      console.error('[HR Scheduler] Error during reminder job:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Nairobi'
  });

  isInitialized = true;
  console.log('HR Verification Scheduler initialized successfully');
  console.log('  - Timeout check: Every hour');
  console.log('  - Reminders: Daily at 9 AM and 3 PM (Africa/Nairobi)');
};

/**
 * Stop all scheduled jobs
 */
const stopScheduler = () => {
  if (timeoutCheckJob) {
    timeoutCheckJob.stop();
    timeoutCheckJob = null;
  }

  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
  }

  isInitialized = false;
  console.log('HR Verification Scheduler stopped');
};

/**
 * Manually trigger timeout check (for testing/admin)
 */
const triggerTimeoutCheck = async () => {
  console.log('[HR Scheduler] Manual timeout check triggered');
  return hrVerificationService.checkTimeouts();
};

/**
 * Manually trigger reminder sending (for testing/admin)
 */
const triggerReminders = async () => {
  console.log('[HR Scheduler] Manual reminder trigger');
  return hrVerificationService.sendReminders();
};

/**
 * Get scheduler status
 */
const getStatus = () => {
  return {
    isInitialized,
    timeoutCheckRunning: timeoutCheckJob !== null,
    reminderJobRunning: reminderJob !== null
  };
};

module.exports = {
  initializeScheduler,
  stopScheduler,
  triggerTimeoutCheck,
  triggerReminders,
  getStatus
};
