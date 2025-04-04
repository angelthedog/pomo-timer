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

    // Get all work sessions for this user with the specified fields
    const workSessions = await Session.find({ 
      userId: user._id
    }).select('duration feedback endTimeLocal completed');

    console.log(`Found ${workSessions.length} sessions for user ${user.username}`);
    
    // Fetch ALL sessions for this user to see what's in the database
    const allSessions = await Session.find({ userId: user._id });
    console.log(`Found ${allSessions.length} total sessions for user ${user.username}`);
    
    // Log ALL sessions in detail
    console.log('ALL SESSIONS FROM MONGODB:');
    allSessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, JSON.stringify(session, null, 2));
    });
    
    // Check if there are any sessions without the mode field
    const sessionsWithoutMode = allSessions.filter(s => !s.mode);
    console.log(`Found ${sessionsWithoutMode.length} sessions without mode field`);
    
    // Check if there are any sessions without the endTimeLocal field
    const sessionsWithoutEndTimeLocal = allSessions.filter(s => !s.endTimeLocal);
    console.log(`Found ${sessionsWithoutEndTimeLocal.length} sessions without endTimeLocal field`);
    
    // Log a few examples of sessions without mode or endTimeLocal
    if (sessionsWithoutMode.length > 0) {
      console.log('Example sessions without mode:', sessionsWithoutMode.slice(0, 3));
    }
    
    if (sessionsWithoutEndTimeLocal.length > 0) {
      console.log('Example sessions without endTimeLocal:', sessionsWithoutEndTimeLocal.slice(0, 3));
    }
    
    // Log raw session data
    console.log('Raw session data from MongoDB:');
    workSessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        _id: session._id,
        duration: session.duration,
        feedback: session.feedback,
        endTimeLocal: session.endTimeLocal,
        mode: session.mode,
        userId: session.userId,
        completed: session.completed
      });
    });
    
    // Log work sessions in a more readable format
    console.log('Work sessions:', workSessions.map(s => ({
      duration: s.duration,
      feedback: s.feedback,
      endTimeLocal: s.endTimeLocal
    })));

    // 1. Total Work Sessions = count of all session events
    const totalWorkSessions = workSessions.length;
    
    // 2. Total Work Time = sum of all durations (in minutes)
    const totalWorkTime = Math.round(
      workSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    );
    
    // 3. Average Session Length = Total Work Time / Total Work Sessions
    const averageWorkSession = totalWorkSessions > 0 
      ? Math.round(totalWorkTime / totalWorkSessions) 
      : 0;

    // 4. Longest Streak = maximum number of sessions in a single day
    // Group sessions by date
    const sessionsByDate = {};
    workSessions.forEach(session => {
      if (session.endDateLocal) {
        // Use endDateLocal directly since it already contains just the date part
        const dateStr = session.endDateLocal;
        if (!sessionsByDate[dateStr]) {
          sessionsByDate[dateStr] = 0;
        }
        sessionsByDate[dateStr]++;
      } else if (session.endTimeLocal) {
        // Fallback to endTimeLocal if endDateLocal is not available
        const dateStr = session.endTimeLocal.split(',')[0];
        if (!sessionsByDate[dateStr]) {
          sessionsByDate[dateStr] = 0;
        }
        sessionsByDate[dateStr]++;
      }
    });
    
    // Find the date with the most sessions
    let longestStreak = 0;
    Object.values(sessionsByDate).forEach(count => {
      longestStreak = Math.max(longestStreak, count);
    });
    
    console.log('Sessions per day:', sessionsByDate);
    console.log('Max sessions in a day:', longestStreak);

    // 5. Average Productivity Rating = sum of feedbacks / count of sessions that has non-null feedback
    const sessionsWithFeedback = workSessions.filter(s => s.feedback !== null);
    const averageFeedback = sessionsWithFeedback.length > 0
      ? (sessionsWithFeedback.reduce((sum, s) => sum + s.feedback, 0) / sessionsWithFeedback.length).toFixed(1)
      : 0;

    // 6. Average Daily Work Time = sum of all durations / count of how many days by check the endTimeLocal
    // Get unique dates from endDateLocal or endTimeLocal
    const uniqueDates = new Set();
    workSessions.forEach(session => {
      if (session.endDateLocal) {
        uniqueDates.add(session.endDateLocal);
      } else if (session.endTimeLocal) {
        uniqueDates.add(session.endTimeLocal.split(',')[0]);
      }
    });
    
    const totalDays = uniqueDates.size;
    const averageDailyWorkTime = totalDays > 0 
      ? Math.round(totalWorkTime / totalDays) 
      : 0;

    // 7 & 8. Last 7 Days (Work Sessions and Productivity Ratings)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    oneWeekAgo.setHours(0, 0, 0, 0); // Start of 7 days ago

    // Get daily stats for the last 7 days (including today)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(oneWeekAgo);
      date.setDate(oneWeekAgo.getDate() + i);
      return date;
    });
    
    const dailyStats = last7Days.map(day => {
      // Get local date components
      const month = day.getMonth() + 1;
      const date = day.getDate();
      const year = day.getFullYear();
      
      // Format as YYYY-MM-DD for the API response (using local date components)
      const dayStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
      
      // Format as MM/DD/YYYY for comparison with endDateLocal
      const formattedDayStr = `${month}/${date}/${year}`;
      
      console.log(`Checking for sessions on ${formattedDayStr}`);
      
      // Find sessions for this day based on endDateLocal
      let daySessions = workSessions.filter(s => 
        s.endDateLocal && s.endDateLocal === formattedDayStr
      );
      
      // If no sessions found with endDateLocal, try using endTimeLocal
      if (daySessions.length === 0) {
        console.log(`No sessions found for ${formattedDayStr} using endDateLocal, trying endTimeLocal`);
        daySessions = workSessions.filter(s => 
          s.endTimeLocal && s.endTimeLocal.startsWith(formattedDayStr)
        );
      }
      
      // Calculate stats for this day
      const sessionsCount = daySessions.length;
      const totalMinutes = Math.round(
        daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
      );
      
      // Calculate average feedback for the day
      const daySessionsWithFeedback = daySessions.filter(s => s.feedback !== null);
      const dayAverageFeedback = daySessionsWithFeedback.length > 0
        ? (daySessionsWithFeedback.reduce((sum, s) => sum + s.feedback, 0) / daySessionsWithFeedback.length).toFixed(1)
        : 0;
      
      return {
        date: dayStr,
        sessionsCount,
        totalMinutes,
        averageFeedback: dayAverageFeedback
      };
    });

    console.log('Daily stats for last 7 days:', dailyStats.map(day => ({
      date: day.date,
      sessionsCount: day.sessionsCount,
      totalMinutes: day.totalMinutes,
      averageFeedback: day.averageFeedback
    })));

    const stats = {
      totalWorkSessions,
      totalWorkTime,
      averageWorkSession,
      longestStreak,
      averageFeedback,
      averageDailyWorkTime,
      dailyStats,
      user: session.user.name
    };
    
    console.log(`Stats retrieved for user ${user.username}: ${totalWorkSessions} work sessions, ${longestStreak} longest streak`);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
} 