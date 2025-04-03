import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import Session from '../../../models/Session';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for logging completed work sessions
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
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    const { duration } = req.body;
    
    // Validate input
    if (!duration) {
      return res.status(400).json({ message: 'Missing duration field' });
    }

    // Get user from database
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new work session record
    const newSession = await Session.create({
      userId: user._id,
      duration
    });

    console.log(`Work session logged for user ${user.username}: ${duration} seconds`);

    return res.status(200).json({ 
      message: 'Work session logged successfully',
      sessionId: newSession._id
    });
  } catch (error) {
    console.error('Error logging work session:', error);
    res.status(500).json({ message: 'Error logging work session', error: error.message });
  }
} 