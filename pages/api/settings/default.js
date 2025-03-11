import { TIMER_SETTINGS, PINK_NOISE_TYPES } from '../../../utils/constants';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for fetching default timer settings
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export default async function handler(req, res) {
  try {
    // Check if user is authenticated using getServerSession
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session in settings/default:', session);
    
    // If not authenticated, return default settings
    if (!session) {
      return res.status(200).json({
        workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES,
        breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
        noiseCancellation: false,
        pinkNoiseEnabled: false,
        pinkNoiseType: PINK_NOISE_TYPES[0]
      });
    }
    
    await dbConnect();
    
    // Find user by username
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
      return res.status(200).json({
        workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES,
        breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
        noiseCancellation: false,
        pinkNoiseEnabled: false,
        pinkNoiseType: PINK_NOISE_TYPES[0]
      });
    }
    
    // Return user's saved settings or defaults if not set
    const settings = {
      workMinutes: user.timerSettings?.workMinutes || TIMER_SETTINGS.DEFAULT_WORK_MINUTES,
      breakMinutes: user.timerSettings?.breakMinutes || TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
      noiseCancellation: user.timerSettings?.noiseCancellation || false,
      pinkNoiseEnabled: user.timerSettings?.pinkNoiseEnabled || false,
      pinkNoiseType: user.timerSettings?.pinkNoiseType || PINK_NOISE_TYPES[0]
    };
    
    console.log(`Loaded settings for user ${user.username}: Work=${settings.workMinutes}, Break=${settings.breakMinutes}, NoiseCancellation=${settings.noiseCancellation}, PinkNoiseEnabled=${settings.pinkNoiseEnabled}, PinkNoiseType=${settings.pinkNoiseType}`);
    
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return default settings in case of error
    res.status(200).json({
      workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES,
      breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
      noiseCancellation: false,
      pinkNoiseEnabled: false,
      pinkNoiseType: PINK_NOISE_TYPES[0]
    });
  }
} 