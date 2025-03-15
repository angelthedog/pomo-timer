/**
 * Helper functions for the application
 */

/**
 * Format seconds as MM:SS
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} - Formatted time string (MM:SS)
 */
export const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Format minutes as hours and minutes
 * @param {number} minutes - Total minutes to format
 * @returns {string} - Formatted time string (Xh Ym or Ym)
 */
export const formatTimeHM = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Calculate percentage for timer display
 * @param {number} current - Current value (seconds left)
 * @param {number} total - Total value (total seconds)
 * @returns {number} - Percentage (0-100)
 */
export const calculatePercentage = (current, total) => {
  // For a timer, we want to show how much time is remaining as a percentage
  // If current > total, something is wrong, so we cap at 100%
  if (current > total) {
    console.warn(`Invalid percentage calculation: current (${current}) > total (${total})`);
    return 100;
  }
  
  // Calculate percentage of time remaining
  return Math.round((current / total) * 100);
};

/**
 * Convert minutes to seconds
 * @param {number} minutes - Minutes to convert
 * @returns {number} - Seconds
 */
export const minutesToSeconds = (minutes) => {
  return minutes * 60;
};

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}; 