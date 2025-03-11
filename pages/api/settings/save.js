import { TIMER_SETTINGS, PINK_NOISE_TYPES } from '../../../utils/constants';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for saving timer settings
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated using getServerSession
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session in settings/save:', session);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    const { 
      workMinutes, 
      breakMinutes, 
      noiseCancellation, 
      pinkNoiseEnabled, 
      pinkNoiseType 
    } = req.body;
    
    // Validate input
    if (typeof workMinutes !== 'number' || typeof breakMinutes !== 'number') {
      return res.status(400).json({ message: 'Invalid settings format' });
    }
    
    // Validate work minutes
    if (
      workMinutes < TIMER_SETTINGS.WORK_MIN_MINUTES || 
      workMinutes > TIMER_SETTINGS.WORK_MAX_MINUTES
    ) {
      return res.status(400).json({ 
        message: `Work time must be between ${TIMER_SETTINGS.WORK_MIN_MINUTES} and ${TIMER_SETTINGS.WORK_MAX_MINUTES} minutes` 
      });
    }
    
    // Validate break minutes
    if (
      breakMinutes < TIMER_SETTINGS.BREAK_MIN_MINUTES || 
      breakMinutes > TIMER_SETTINGS.BREAK_MAX_MINUTES
    ) {
      return res.status(400).json({ 
        message: `Break time must be between ${TIMER_SETTINGS.BREAK_MIN_MINUTES} and ${TIMER_SETTINGS.BREAK_MAX_MINUTES} minutes` 
      });
    }
    
    // Validate noise cancellation
    if (typeof noiseCancellation !== 'boolean') {
      return res.status(400).json({ message: 'Noise cancellation must be a boolean' });
    }
    
    // Validate pink noise enabled
    if (typeof pinkNoiseEnabled !== 'boolean') {
      return res.status(400).json({ message: 'Pink noise enabled must be a boolean' });
    }
    
    // Validate pink noise type
    if (pinkNoiseEnabled && !PINK_NOISE_TYPES.includes(pinkNoiseType)) {
      return res.status(400).json({ 
        message: `Pink noise type must be one of: ${PINK_NOISE_TYPES.join(', ')}` 
      });
    }
    
    // Find user by username
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user settings
    user.timerSettings = {
      workMinutes,
      breakMinutes,
      noiseCancellation,
      pinkNoiseEnabled,
      pinkNoiseType
    };
    
    // Save updated user
    await user.save();
    
    console.log(`Settings saved for user ${user.username}: Work=${workMinutes}, Break=${breakMinutes}, NoiseCancellation=${noiseCancellation}, PinkNoiseEnabled=${pinkNoiseEnabled}, PinkNoiseType=${pinkNoiseType}`);
    
    res.status(200).json({ 
      success: true,
      message: 'Settings saved successfully',
      settings: { 
        workMinutes, 
        breakMinutes, 
        noiseCancellation, 
        pinkNoiseEnabled, 
        pinkNoiseType 
      }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error saving settings', error: error.message });
  }
} 