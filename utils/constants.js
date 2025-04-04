/**
 * Application constants
 */

// Timer modes
export const TIMER_MODES = {
  WORK: 'work',
  BREAK: 'break'
};

// Timer events
export const TIMER_EVENTS = {
  STARTED: 'started',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  COMPLETED: 'completed'
};

// Colors
export const COLORS = {
  RED: '#f54e4e',
  GREEN: '#4aec8c',
  WHITE: '#fff',
  TRANSPARENT_WHITE: 'rgba(255, 255, 255, 0.2)',
  SUCCESS_BG: 'rgba(74, 236, 140, 0.2)',
  ERROR_BG: 'rgba(245, 78, 78, 0.2)'
};

// Timer settings
export const TIMER_SETTINGS = {
  WORK_MIN_MINUTES: 1,
  WORK_MAX_MINUTES: 120,
  BREAK_MIN_MINUTES: 1,
  BREAK_MAX_MINUTES: 90,
  DEFAULT_WORK_MINUTES: 45,
  DEFAULT_BREAK_MINUTES: 10
};

// UI settings
export const UI = {
  AUTO_CLOSE_DELAY: 5000, // 5 seconds for auto-dismissing modals
  TICK_INTERVAL: 1000 // ms
};

// Pink noise types and their corresponding S3 URLs
export const PINK_NOISE_TYPES = [
  'Rainfall',
  'Ocean waves',
  'Wind',
  'Rustling leaves',
  'Heartbeat',
  'Fire crackling'
];

export const PINK_NOISE_URLS = {
  'Rainfall': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/relaxing-rain-sound-195625.mp3',
  'Ocean waves': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/ocean-lake-sea-shore-waves-18921.mp3',
  'Wind': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/wind-18030.mp3',
  'Rustling leaves': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/leaves-rustling-14633.mp3',
  'Heartbeat': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/heartbeat.mp3',
  'Fire crackling': 'https://focusmindpinknoise.s3.us-east-2.amazonaws.com/fierce-crackling-fire-5-minutes-looped-135533.mp3'
};