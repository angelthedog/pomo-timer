/**
 * Utility functions for API calls
 */

/**
 * Log a completed work session to the API
 * @param {string} event - The event type (should be 'completed')
 * @param {string} mode - The timer mode (should be 'work')
 * @param {number} duration - The duration in seconds
 * @param {number} feedback - Optional feedback score (1-5)
 * @returns {Promise<Object>} - The API response
 */
export const logTimerEvent = async (event, mode, duration = null, feedback = null) => {
  // Only log completed work sessions
  if (event !== 'completed' || mode !== 'work' || !duration) {
    console.log('Skipping logging - only completed work sessions are logged');
    return;
  }

  try {
    console.log(`Logging completed work session: ${duration} seconds${feedback ? `, feedback: ${feedback}` : ''}`);
    
    const response = await fetch('/api/timer/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration,
        feedback
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error response from timer log API:', data);
      throw new Error(data.message || 'Failed to log work session');
    }
    
    return data;
  } catch (error) {
    console.error('Error logging work session:', error);
    throw error;
  }
};

/**
 * Fetch default timer settings from the API
 * @returns {Promise<Object>} - The default settings
 */
export const fetchDefaultSettings = async () => {
  try {
    const response = await fetch('/api/settings/default', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching default settings:', errorData);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching default settings:', error);
    return null;
  }
};

/**
 * Save timer settings to the API
 * @param {Object} settings - The settings to save
 * @param {number} settings.workMinutes - Work duration in minutes
 * @param {number} settings.breakMinutes - Break duration in minutes
 * @param {boolean} settings.noiseCancellation - Whether noise cancellation is enabled
 * @param {boolean} settings.pinkNoiseEnabled - Whether pink noise is enabled
 * @param {string} settings.pinkNoiseType - The type of pink noise
 * @returns {Promise<Object>} - The API response
 */
export const saveSettings = async (settings) => {
  try {
    const response = await fetch('/api/settings/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      return {
        success: false,
        data: null,
        error: errorData
      };
    }
    
    return {
      success: true,
      data: await response.json(),
      error: null
    };
  } catch (error) {
    console.error('Error saving settings:', error);
    return {
      success: false,
      data: null,
      error: { message: 'Error connecting to server' }
    };
  }
};

/**
 * Fetch timer statistics from the API
 * @returns {Promise<Object>} - The timer statistics
 */
export const fetchTimerStats = async () => {
  try {
    const response = await fetch('/api/timer/stats', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching timer stats:', errorData);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching timer stats:', error);
    return null;
  }
}; 