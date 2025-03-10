import { TIMER_SETTINGS } from '../../../utils/constants';
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

    const { workMinutes, breakMinutes } = req.body;
    
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
    
    // Find user by username
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user settings
    user.timerSettings = {
      workMinutes,
      breakMinutes
    };
    
    // Save updated user
    await user.save();
    
    console.log(`Settings saved for user ${user.username}: Work=${workMinutes}, Break=${breakMinutes}`);
    
    res.status(200).json({ 
      success: true,
      message: 'Settings saved successfully',
      settings: { workMinutes, breakMinutes }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error saving settings', error: error.message });
  }
} 