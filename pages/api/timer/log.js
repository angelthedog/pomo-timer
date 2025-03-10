import { TIMER_EVENTS, TIMER_MODES } from '../../../utils/constants';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import Session from '../../../models/Session';
import User from '../../../models/User';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for logging timer events
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
    
    console.log('Session in timer/log:', session);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    const { event, timestamp, mode, duration } = req.body;
    
    // Validate input
    if (!event || !timestamp || !mode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate event type
    const validEvents = Object.values(TIMER_EVENTS);
    if (!validEvents.includes(event)) {
      return res.status(400).json({ 
        message: `Invalid event type. Must be one of: ${validEvents.join(', ')}` 
      });
    }
    
    // Validate mode
    const validModes = Object.values(TIMER_MODES);
    if (!validModes.includes(mode)) {
      return res.status(400).json({ 
        message: `Invalid mode. Must be one of: ${validModes.join(', ')}` 
      });
    }

    // Get user from database
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle different event types
    if (event === TIMER_EVENTS.STARTED) {
      // Create a new session
      const newSession = await Session.create({
        userId: user._id,
        startTime: new Date(timestamp),
        mode,
        events: [
          {
            type: event,
            timestamp: new Date(timestamp)
          }
        ]
      });

      console.log(`New ${mode} session started for user ${user.username}`);

      return res.status(200).json({ 
        message: 'Timer session started',
        sessionId: newSession._id
      });
    } else {
      // Find the most recent session for this user and mode
      const latestSession = await Session.findOne({
        userId: user._id,
        mode,
        completed: event === TIMER_EVENTS.COMPLETED ? false : undefined
      }).sort({ startTime: -1 });

      if (!latestSession) {
        return res.status(404).json({ message: 'No active session found' });
      }

      // Add event to the session
      latestSession.events.push({
        type: event,
        timestamp: new Date(timestamp)
      });

      // Update session based on event type
      if (event === TIMER_EVENTS.COMPLETED) {
        latestSession.completed = true;
        latestSession.endTime = new Date(timestamp);
        
        // Calculate duration in seconds if not provided
        let durationInSeconds = duration;
        if (!durationInSeconds && latestSession.startTime) {
          durationInSeconds = Math.floor((new Date(timestamp) - latestSession.startTime) / 1000);
        }
        
        // Round to nearest minute (minimum 1 minute)
        const durationInMinutes = Math.max(1, Math.round(durationInSeconds / 60));
        latestSession.duration = durationInSeconds;
        
        console.log(`${mode} session completed for user ${user.username}: ${durationInMinutes} minutes`);
      }

      await latestSession.save();

      return res.status(200).json({ 
        message: `Timer event ${event} logged successfully`,
        sessionId: latestSession._id,
        duration: latestSession.duration
      });
    }
  } catch (error) {
    console.error('Error logging timer event:', error);
    res.status(500).json({ message: 'Error logging timer event', error: error.message });
  }
} 