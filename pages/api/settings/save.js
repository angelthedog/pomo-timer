import { TIMER_SETTINGS, PINK_NOISE_TYPES } from '../../../utils/constants';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

// Validation functions
const validateWorkMinutes = (minutes) => {
  if (!Number.isInteger(minutes)) return false;
  return minutes >= TIMER_SETTINGS.WORK_MIN_MINUTES && minutes <= TIMER_SETTINGS.WORK_MAX_MINUTES;
};

const validateBreakMinutes = (minutes) => {
  if (!Number.isInteger(minutes)) return false;
  return minutes >= TIMER_SETTINGS.BREAK_MIN_MINUTES && minutes <= TIMER_SETTINGS.BREAK_MAX_MINUTES;
};

const validateSettings = (settings) => {
  const errors = [];
  
  if (!validateWorkMinutes(settings.workMinutes)) {
    errors.push(`Work time must be between ${TIMER_SETTINGS.WORK_MIN_MINUTES} and ${TIMER_SETTINGS.WORK_MAX_MINUTES} minutes`);
  }
  
  if (!validateBreakMinutes(settings.breakMinutes)) {
    errors.push(`Break time must be between ${TIMER_SETTINGS.BREAK_MIN_MINUTES} and ${TIMER_SETTINGS.BREAK_MAX_MINUTES} minutes`);
  }
  
  if (typeof settings.noiseCancellation !== 'boolean') {
    errors.push('Noise cancellation must be a boolean');
  }
  
  if (typeof settings.pinkNoiseEnabled !== 'boolean') {
    errors.push('Pink noise enabled must be a boolean');
  }
  
  if (settings.pinkNoiseEnabled && !PINK_NOISE_TYPES.includes(settings.pinkNoiseType)) {
    errors.push(`Pink noise type must be one of: ${PINK_NOISE_TYPES.join(', ')}`);
  }
  
  return errors;
};

// Sanitize settings before saving
const sanitizeSettings = (settings) => ({
  workMinutes: Math.min(Math.max(settings.workMinutes, TIMER_SETTINGS.WORK_MIN_MINUTES), TIMER_SETTINGS.WORK_MAX_MINUTES),
  breakMinutes: Math.min(Math.max(settings.breakMinutes, TIMER_SETTINGS.BREAK_MIN_MINUTES), TIMER_SETTINGS.BREAK_MAX_MINUTES),
  noiseCancellation: Boolean(settings.noiseCancellation),
  pinkNoiseEnabled: Boolean(settings.pinkNoiseEnabled),
  pinkNoiseType: PINK_NOISE_TYPES.includes(settings.pinkNoiseType) ? settings.pinkNoiseType : PINK_NOISE_TYPES[0]
});

/**
 * API route for saving timer settings
 * Validates input, sanitizes data, and saves to database
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Validate settings
    const errors = validateSettings(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Invalid settings', errors });
    }

    await dbConnect();
    
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sanitize and save settings
    const sanitizedSettings = sanitizeSettings(req.body);
    user.timerSettings = sanitizedSettings;
    await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log('Settings saved:', { username: user.username, settings: sanitizedSettings });
    }

    res.status(200).json({ 
      success: true,
      message: 'Settings saved successfully',
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ 
      message: 'Error saving settings', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 