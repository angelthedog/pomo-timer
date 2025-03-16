import { useState } from 'react';

<div className={styles.statItem}>
  <h3>Average Feedback</h3>
  <p>
    {stats.averageFeedback > 0 ? (
      <span>
        {stats.averageFeedback} <span>★</span>
      </span>
    ) : (
      'No ratings yet'
    )}
  </p>
</div> 

function Stats() {
  const [selectedDay, setSelectedDay] = useState(null);
  
  return (
    <div className={styles.statsContainer}>
      <h1 className={styles.statsTitle}>Your Focus Mind Statistics</h1>
      
      <div className={styles.statsSection}>
        <h2>Feedback</h2>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <h3>Average Rating</h3>
            <p className={styles.statValue}>
              {stats.averageFeedback > 0 ? (
                <span>
                  {stats.averageFeedback} <span className={styles.starIcon}>★</span>
                </span>
              ) : (
                'No ratings yet'
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className={styles.statsSection}>
        <h2>Daily Activity (Last 7 Days)</h2>
        <div className={styles.dailyStatsContainer}>
          {stats.dailyStats && stats.dailyStats.map((day) => (
            <div 
              key={day.date} 
              className={`${styles.dailyStatCard} ${selectedDay === day.date ? styles.selected : ''}`}
              onClick={() => setSelectedDay(day.date === selectedDay ? null : day.date)}
            >
              <div className={styles.dailyStatDate}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className={styles.dailyStatGrid}>
                <div className={styles.dailyStatItem}>
                  <span className={styles.dailyStatLabel}>Sessions</span>
                  <span className={styles.dailyStatValue}>{day.sessionsCount}</span>
                </div>
                <div className={styles.dailyStatItem}>
                  <span className={styles.dailyStatLabel}>Minutes</span>
                  <span className={styles.dailyStatValue}>{day.totalMinutes}</span>
                </div>
                <div className={styles.dailyStatItem}>
                  <span className={styles.dailyStatLabel}>Rating</span>
                  <span className={styles.dailyStatValue}>
                    {day.averageFeedback > 0 ? (
                      <span>
                        {day.averageFeedback} <span className={styles.starIcon}>★</span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.dailyStats && stats.dailyStats.length > 0 && (
        <div className={styles.statsSection}>
          <h2>Daily Activity (Last 7 Days)</h2>
          <div className={styles.dailyStatsContainer}>
            {stats.dailyStats.map((day) => (
              <div 
                key={day.date} 
                className={styles.dailyStatCard}
              >
                <div className={styles.dailyStatDate}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className={styles.dailyStatGrid}>
                  <div className={styles.dailyStatItem}>
                    <span className={styles.dailyStatLabel}>Sessions</span>
                    <span className={styles.dailyStatValue}>{day.sessionsCount}</span>
                  </div>
                  <div className={styles.dailyStatItem}>
                    <span className={styles.dailyStatLabel}>Minutes</span>
                    <span className={styles.dailyStatValue}>{day.totalMinutes}</span>
                  </div>
                  <div className={styles.dailyStatItem}>
                    <span className={styles.dailyStatLabel}>Rating</span>
                    <span className={styles.dailyStatValue}>
                      {day.averageFeedback > 0 ? (
                        <span>
                          {day.averageFeedback} <span className={styles.starIcon}>★</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 