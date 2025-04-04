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

    const { duration, feedback } = req.body;
    
    // Log the request body for debugging
    console.log('Request body:', req.body);
    
    // Validate input
    if (!duration || typeof duration !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid duration field' });
    }

    // Validate feedback if provided (should be a number between 1-5)
    if (feedback !== null && (typeof feedback !== 'number' || feedback < 1 || feedback > 5)) {
      return res.status(400).json({ message: 'Invalid feedback value. Must be a number between 1-5 or null' });
    }

    // Get user from database
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create session data object
    const sessionData = {
      userId: user._id,
      duration,
      endTime: new Date(),
      feedback: feedback // Store the star rating (1-5) or null if skipped
    };
    
    // Log the session data before creation
    console.log('Creating session with data:', sessionData);

    // Create a new work session record
    const newSession = await Session.create(sessionData);
    
    // Log the created session
    console.log('Created session:', newSession);

    // Fetch the session again to verify the fields
    const fetchedSession = await Session.findById(newSession._id);
    console.log('Fetched session after creation:', fetchedSession);

    // If the feedback field is missing, try to update it directly
    if (feedback !== null && (!fetchedSession.feedback || fetchedSession.feedback === undefined)) {
      console.log('Feedback field is missing, updating directly...');
      
      // Update the session directly in the database
      const updatedSession = await Session.findByIdAndUpdate(
        newSession._id,
        { $set: { feedback: feedback } },
        { new: true }
      );
      
      console.log('Updated session with feedback:', updatedSession);
    }

    return res.status(200).json({ 
      message: 'Work session logged successfully',
      sessionId: newSession._id
    });
  } catch (error) {
    console.error('Error logging work session:', error);
    res.status(500).json({ message: 'Error logging work session', error: error.message });
  }
} 