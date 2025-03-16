import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { fetchTimerStats } from '../utils/api';
import { formatTimeHM } from '../utils/helpers';
import { COLORS } from '../utils/constants';

// Day names for the week chart
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Stats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Immediately redirect to home page if not authenticated
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }

    // Only fetch stats if authenticated
    if (status === 'authenticated') {
      const loadStats = async () => {
        try {
          const data = await fetchTimerStats();
          
          if (data) {
            setStats(data);
          } else {
            setError('Failed to load statistics');
          }
        } catch (error) {
          setError('Error connecting to server');
          console.error('Error fetching stats:', error);
        } finally {
          setLoading(false);
        }
      };

      loadStats();
    }
  }, [status, router]);

  // Calculate bar height for the chart
  const getBarHeight = useCallback((count) => {
    return `${Math.min(100, count * 10)}%`;
  }, []);

  // Get bar color based on count
  const getBarColor = useCallback((count) => {
    return count > 0 ? COLORS.GREEN : COLORS.TRANSPARENT_WHITE;
  }, []);

  // Handle back to timer button click
  const handleBackToTimer = () => {
    router.push('/');
  };

  // Show loading state while checking authentication or loading data
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="loading-container">
        <p>Loading statistics...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Focus Mind - Statistics</title>
        <meta name="description" content="View your Focus Mind statistics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <h1>Statistics</h1>
        
        {error && (
          <div style={{ color: COLORS.RED, marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        {stats && (
          <div className="stats-container">
            <div className="stat-card">
              <h3>Total Work Sessions</h3>
              <p className="stat-value">{stats.totalWorkSessions}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Work Time</h3>
              <p className="stat-value">{formatTimeHM(stats.totalWorkTime)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Average Session Length</h3>
              <p className="stat-value">{formatTimeHM(stats.averageWorkSession)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Longest Streak</h3>
              <p className="stat-value">{stats.longestStreak} sessions</p>
              <p className="streak-info">Consecutive work sessions with less than 30 min breaks</p>
            </div>
            
            <div className="stat-card">
              <h3>Average Productivity Rating</h3>
              <p className="stat-value feedback-value">
                {stats.averageFeedback > 0 ? (
                  <>
                    {stats.averageFeedback} <span className="star-icon">★</span>
                  </>
                ) : (
                  '--'
                )}
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Average Daily Work Time</h3>
              <p className="stat-value">
                {stats.dailyStats && stats.dailyStats.some(day => day.totalMinutes > 0) ? (
                  formatTimeHM(
                    Math.round(
                      stats.dailyStats.reduce((sum, day) => sum + day.totalMinutes, 0) / 
                      stats.dailyStats.filter(day => day.totalMinutes > 0).length * 60
                    )
                  )
                ) : (
                  '0h 0m'
                )}
              </p>
            </div>
            
            <div className="stat-card full-width">
              <h3>Last 7 Days (Work Sessions)</h3>
              {stats.dailyStats ? (
                <div className="daily-chart">
                  {stats.dailyStats.map((day, index) => (
                    <div key={index} className="day-column">
                      <div className="bar-container">
                        <div 
                          className="session-bar" 
                          style={{ 
                            height: day.sessionsCount > 0 ? `${Math.min(100, day.sessionsCount * 20)}%` : '0%',
                            opacity: day.sessionsCount > 0 ? 1 : 0.2
                          }}
                        >
                          {day.sessionsCount > 0 && (
                            <span className="count-label">
                              {day.sessionsCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="day-info">
                        <div className="day-label">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="day-date">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">--</p>
              )}
            </div>
            
            <div className="stat-card full-width">
              <h3>Daily Productivity Ratings</h3>
              {stats.dailyStats && stats.dailyStats.some(day => day.averageFeedback > 0) ? (
                <div className="daily-chart">
                  {stats.dailyStats.map((day, index) => (
                    <div key={index} className="day-column">
                      <div className="bar-container">
                        <div 
                          className="feedback-bar" 
                          style={{ 
                            height: day.averageFeedback > 0 ? `${day.averageFeedback * 20}%` : '0%',
                            opacity: day.averageFeedback > 0 ? 1 : 0.2
                          }}
                        >
                          {day.averageFeedback > 0 && (
                            <span className="count-label">
                              {day.averageFeedback}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="day-info">
                        <div className="day-label">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="day-date">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-message">--</p>
              )}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            className="with-text back-button" 
            onClick={handleBackToTimer}
            style={{ zIndex: 5, position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Timer
          </button>
        </div>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 150px);
          color: white;
          font-size: 1.2rem;
        }
        
        h1 {
          margin-bottom: 30px;
          font-size: 1.8rem;
        }
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }
        
        .full-width {
          grid-column: span 2;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          margin: 10px 0 0;
          color: ${COLORS.GREEN};
        }
        
        .streak-info {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 5px;
        }
        
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: normal;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .week-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 150px;
          margin-top: 20px;
        }
        
        .day-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 12%;
        }
        
        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          min-height: 4px;
        }
        
        .day-label {
          margin-top: 8px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .back-button {
          background-color: rgba(255, 255, 255, 0.1);
          transition: background-color 0.3s ease;
        }
        
        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .feedback-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        
        .star-icon {
          color: #FFD700;
          font-size: 1.6rem;
        }
        
        .daily-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 180px;
          margin-top: 20px;
        }
        
        .day-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 12%;
        }
        
        .bar-container {
          height: 120px;
          width: 100%;
          display: flex;
          align-items: flex-end;
        }
        
        .session-bar {
          width: 100%;
          background-color: ${COLORS.GREEN};
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          position: relative;
          transition: height 0.3s ease;
        }
        
        .feedback-bar {
          width: 100%;
          background-color: #FFD700;
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          position: relative;
          transition: height 0.3s ease;
        }
        
        .count-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .day-info {
          margin-top: 8px;
          text-align: center;
        }
        
        .day-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .day-date {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
        
        .no-data-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          margin: 30px 0;
        }
      `}</style>
    </>
  );
} 