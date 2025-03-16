import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import Session from '../../../models/Session';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for submitting session feedback
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
    
    console.log('Session in timer/feedback:', session);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    const { sessionId, feedback } = req.body;
    
    console.log('Feedback request:', { sessionId, feedback });
    
    // Validate input
    if (!sessionId || !feedback || feedback < 1 || feedback > 5) {
      return res.status(400).json({ message: 'Invalid feedback data' });
    }

    // Get user from database
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the session
    const timerSession = await Session.findOne({
      _id: sessionId,
      userId: user._id
    });

    if (!timerSession) {
      return res.status(404).json({ message: 'Session not found' });
    }

    console.log('Before saving feedback:', timerSession);
    
    // Update the feedback
    timerSession.feedback = feedback;
    await timerSession.save();
    
    console.log('After saving feedback:', timerSession);
    console.log(`Feedback (${feedback} stars) saved for session ${sessionId}`);

    return res.status(200).json({ 
      message: 'Feedback saved successfully',
      sessionId: timerSession._id,
      feedback
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return res.status(500).json({ message: 'Error saving feedback', error: error.message });
  }
} 