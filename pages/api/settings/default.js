import { TIMER_SETTINGS, PINK_NOISE_TYPES } from '../../../utils/constants';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

// Default settings object to avoid duplication
const getDefaultSettings = () => ({
  workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES,
  breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
  noiseCancellation: false,
  pinkNoiseEnabled: false,
  pinkNoiseType: PINK_NOISE_TYPES[0]
});

/**
 * API route for fetching timer settings
 * Returns user's saved settings if authenticated, default settings otherwise
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Return default settings for unauthenticated users
    if (!session) {
      return res.status(200).json(getDefaultSettings());
    }
    
    await dbConnect();
    
    const user = await User.findOne({ username: session.user.name });
    if (!user?.timerSettings) {
      return res.status(200).json(getDefaultSettings());
    }
    
    // Validate and merge user settings with defaults
    const defaultSettings = getDefaultSettings();
    const settings = {
      workMinutes: Number.isInteger(user.timerSettings.workMinutes) ? 
        Math.min(Math.max(user.timerSettings.workMinutes, TIMER_SETTINGS.WORK_MIN_MINUTES), TIMER_SETTINGS.WORK_MAX_MINUTES) : 
        defaultSettings.workMinutes,
      breakMinutes: Number.isInteger(user.timerSettings.breakMinutes) ? 
        Math.min(Math.max(user.timerSettings.breakMinutes, TIMER_SETTINGS.BREAK_MIN_MINUTES), TIMER_SETTINGS.BREAK_MAX_MINUTES) : 
        defaultSettings.breakMinutes,
      noiseCancellation: typeof user.timerSettings.noiseCancellation === 'boolean' ? 
        user.timerSettings.noiseCancellation : 
        defaultSettings.noiseCancellation,
      pinkNoiseEnabled: typeof user.timerSettings.pinkNoiseEnabled === 'boolean' ? 
        user.timerSettings.pinkNoiseEnabled : 
        defaultSettings.pinkNoiseEnabled,
      pinkNoiseType: PINK_NOISE_TYPES.includes(user.timerSettings.pinkNoiseType) ? 
        user.timerSettings.pinkNoiseType : 
        defaultSettings.pinkNoiseType
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Loaded settings:', { username: user.username, settings });
    }
    
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(200).json(getDefaultSettings());
  }
} 