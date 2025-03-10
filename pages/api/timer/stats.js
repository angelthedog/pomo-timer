import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/mongoose';
import Session from '../../../models/Session';
import User from '../../../models/User';
import { TIMER_MODES } from '../../../utils/constants';
import authOptions from '../auth/[...nextauth]';

/**
 * API route for retrieving timer statistics
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export default async function handler(req, res) {
  try {
    // Check if user is authenticated using getServerSession
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session in timer/stats:', session);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all completed work sessions for this user
    const workSessions = await Session.find({ 
      userId: user._id,
      mode: TIMER_MODES.WORK,
      completed: true
    });

    // Calculate total work sessions
    const totalWorkSessions = workSessions.length;
    
    // Calculate total work time in minutes
    const totalWorkTime = Math.round(workSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
    
    // Calculate average work session duration in minutes
    const averageWorkSession = workSessions.length > 0 
      ? Math.round((totalWorkTime / workSessions.length)) 
      : 0;

    // Calculate longest streak (consecutive work sessions without long breaks)
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Sort sessions by start time
    const sortedSessions = [...workSessions].sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Simple streak calculation (can be improved with more complex logic)
    for (let i = 0; i < sortedSessions.length; i++) {
      currentStreak++;
      
      // Check if this is the last session or if there's a gap of more than 30 minutes
      // between this session and the next one
      if (i === sortedSessions.length - 1 || 
          new Date(sortedSessions[i+1].startTime) - new Date(sortedSessions[i].endTime) > 30 * 60 * 1000) {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 0;
      }
    }

    // Calculate sessions per day for the last 7 days
    const lastWeekSessions = Array(7).fill(0);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    oneWeekAgo.setHours(0, 0, 0, 0); // Start of 7 days ago
    
    // Filter sessions from the last 7 days
    const recentSessions = workSessions.filter(s => 
      new Date(s.startTime) >= oneWeekAgo && new Date(s.startTime) <= today
    );
    
    // Count sessions for each day
    recentSessions.forEach(s => {
      const sessionDate = new Date(s.startTime);
      const dayIndex = 6 - Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        lastWeekSessions[dayIndex]++;
      }
    });

    const stats = {
      totalWorkSessions,
      totalWorkTime,
      averageWorkSession,
      longestStreak,
      lastWeekSessions,
      user: session.user.name
    };
    
    console.log(`Stats retrieved for user ${user.username}: ${totalWorkSessions} work sessions, ${longestStreak} longest streak`);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
} 