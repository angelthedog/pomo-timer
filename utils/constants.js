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
  DEFAULT_BREAK_MINUTES: 15
};

// UI settings
export const UI = {
  AUTO_CLOSE_DELAY: 1500, // ms
  TICK_INTERVAL: 1000 // ms
}; 