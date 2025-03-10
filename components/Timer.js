import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from 'next-auth/react';
import { useSettings } from '../contexts/SettingsContext';
import PlayButton from "./PlayButton";
import PauseButton from "./PauseButton";
import FastForwardButton from "./FastForwardButton";
import CancelButton from "./CancelButton";
import SettingsButton from "./SettingsButton";
import StatsButton from "./StatsButton";
import { logTimerEvent } from '../utils/api';
import { TIMER_MODES, TIMER_EVENTS, COLORS, UI } from '../utils/constants';
import { formatTime, calculatePercentage, minutesToSeconds } from '../utils/helpers';
import { useRouter } from 'next/router';

// Default times for unauthenticated users
const GUEST_WORK_MINUTES = 45;
const GUEST_BREAK_MINUTES = 10;

function Timer() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = !!session;
  const settingsInfo = useSettings();

  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState(TIMER_MODES.WORK);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerState, setTimerState] = useState({});
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [returningFromStats, setReturningFromStats] = useState(false);
  const [previousUrl, setPreviousUrl] = useState('');
  const [prevAuthState, setPrevAuthState] = useState(authStatus);

  const secondsLeftRef = useRef(secondsLeft);
  const isPausedRef = useRef(isPaused);
  const modeRef = useRef(mode);
  const prevWorkMinutesRef = useRef(settingsInfo.workMinutes);
  const prevBreakMinutesRef = useRef(settingsInfo.breakMinutes);
  const timerStateRef = useRef({});
  const sessionStartTimeRef = useRef(null);
  const isTimerActiveRef = useRef(false);

  const tick = useCallback(() => {
    secondsLeftRef.current--;
    setSecondsLeft(secondsLeftRef.current);
  }, []);

  const handleTimerEvent = useCallback(async (event, mode, duration = null) => {
    // Only log events if user is authenticated
    if (isAuthenticated) {
      try {
        const result = await logTimerEvent(event, mode, duration);
        console.log(`Timer event logged: ${event}`, result);
        return result;
      } catch (error) {
        console.error('Error logging timer event:', error);
      }
    }
    return null;
  }, [isAuthenticated]);

  const startNewSession = useCallback(() => {
    // Record session start time
    const now = Date.now();
    setSessionStartTime(now);
    sessionStartTimeRef.current = now;
    
    // Mark timer as active
    setIsTimerActive(true);
    isTimerActiveRef.current = true;
    
    // Log start event if authenticated
    if (isAuthenticated) {
      handleTimerEvent(TIMER_EVENTS.STARTED, modeRef.current);
    }
  }, [handleTimerEvent, modeRef, isAuthenticated]);

  const completeCurrentSession = useCallback((skipToNext = false) => {
    if (!sessionStartTimeRef.current) return;
    
    // Calculate elapsed time
    const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    
    // Log completion with actual duration if authenticated
    if (isAuthenticated) {
      handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, elapsedSeconds);
    }
    
    // Reset session start time
    setSessionStartTime(null);
    sessionStartTimeRef.current = null;
    
    console.log(`Session completed: ${modeRef.current}, Duration: ${elapsedSeconds} seconds`);
    
    // If skipping to next, don't wait for timer to reach zero
    if (skipToNext) {
      switchMode();
    }
  }, [handleTimerEvent, modeRef, isAuthenticated]);

  const cancelCurrentSession = useCallback(() => {
    // Don't log the session, just reset the timer
    console.log('Session canceled');
    
    // Reset session start time
    setSessionStartTime(null);
    sessionStartTimeRef.current = null;
    
    // Reset timer to current mode with initial duration
    const initialSeconds = minutesToSeconds(
      modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );
    
    setSecondsLeft(initialSeconds);
    secondsLeftRef.current = initialSeconds;
    
    // Pause timer
    setIsPaused(true);
    isPausedRef.current = true;
    
    // Mark timer as inactive
    setIsTimerActive(false);
    isTimerActiveRef.current = false;
  }, [settingsInfo]);

  const resetTimer = useCallback(() => {
    // Complete current session if one is in progress
    if (sessionStartTimeRef.current && !isPausedRef.current) {
      completeCurrentSession();
    }
    
    // Reset timer to current mode with new duration
    const newSeconds = minutesToSeconds(
      modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );
    
    // IMPORTANT: Set the current time to the full duration
    // This ensures the red portion of the circle is reset to match the total time
    setSecondsLeft(newSeconds);
    secondsLeftRef.current = newSeconds;
    
    // Pause timer
    setIsPaused(true);
    isPausedRef.current = true;
    
    // Reset session start time
    setSessionStartTime(null);
    sessionStartTimeRef.current = null;
    
    // Mark timer as inactive
    setIsTimerActive(false);
    isTimerActiveRef.current = false;
    
    // Force a re-render by updating the render key
    setRenderKey(Date.now());
    
    console.log('Timer reset with new settings:', {
      mode: modeRef.current,
      seconds: newSeconds,
      workMinutes: settingsInfo.workMinutes,
      breakMinutes: settingsInfo.breakMinutes
    });
  }, [settingsInfo, completeCurrentSession]);

  const switchMode = useCallback(() => {
    const nextMode = modeRef.current === TIMER_MODES.WORK ? TIMER_MODES.BREAK : TIMER_MODES.WORK;
    const nextSeconds = minutesToSeconds(
      nextMode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );

    setMode(nextMode);
    modeRef.current = nextMode;

    setSecondsLeft(nextSeconds);
    secondsLeftRef.current = nextSeconds;
    
    // Start new session for next mode
    startNewSession();
  }, [settingsInfo, startNewSession]);

  // Fast forward to next session
  const handleFastForward = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    
    // Complete current session with actual duration
    completeCurrentSession(true);
    
    // Pause timer after fast forward
    setIsPaused(true);
    isPausedRef.current = true;
  }, [completeCurrentSession]);

  // Cancel current session
  const handleCancel = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    cancelCurrentSession();
  }, [cancelCurrentSession]);

  // Save timer state before navigating away
  const saveTimerState = useCallback(() => {
    const state = {
      isPaused: isPausedRef.current,
      mode: modeRef.current,
      secondsLeft: secondsLeftRef.current,
      sessionStartTime: sessionStartTimeRef.current,
      isTimerActive: isTimerActiveRef.current,
      timestamp: Date.now()
    };
    
    setTimerState(state);
    timerStateRef.current = state;
    
    // Store in localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerState', JSON.stringify(state));
    }
    
    console.log('Timer state saved:', state);
    
    return state;
  }, []);

  // Restore timer state when returning to the page
  const restoreTimerState = useCallback(() => {
    let state = timerStateRef.current;
    
    // Try to get from localStorage if not in memory
    if (!state || Object.keys(state).length === 0) {
      try {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
          state = JSON.parse(savedState);
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
      }
    }
    
    if (state && Object.keys(state).length > 0) {
      // Check if state is still valid (not too old)
      const elapsed = (Date.now() - state.timestamp) / 1000;
      
      if (elapsed < 3600) { // Only restore if less than 1 hour old
        // Restore mode
        setMode(state.mode);
        modeRef.current = state.mode;
        
        // Restore seconds left (exact value from when it was paused)
        setSecondsLeft(state.secondsLeft);
        secondsLeftRef.current = state.secondsLeft;
        
        // Restore pause state (should be paused when returning from stats)
        setIsPaused(true);
        isPausedRef.current = true;
        
        // Restore session start time if there was one
        if (state.sessionStartTime) {
          setSessionStartTime(state.sessionStartTime);
          sessionStartTimeRef.current = state.sessionStartTime;
          
          // Mark timer as active but paused
          setIsTimerActive(true);
          isTimerActiveRef.current = true;
        } else {
          // No active session
          setIsTimerActive(false);
          isTimerActiveRef.current = false;
        }
        
        console.log('Timer state restored:', { 
          mode: state.mode, 
          secondsLeft: state.secondsLeft,
          isPaused: true,
          sessionStartTime: state.sessionStartTime,
          isTimerActive: state.isTimerActive
        });
      }
    }
  }, []);

  // Check for settings changes
  useEffect(() => {
    if (settingsInfo.settingsChanged) {
      console.log('Settings changed, resetting timer');
      
      // Force a complete reset of the timer
      // This ensures both the total time and current time are updated
      resetTimer();
      
      // Clear the settings changed flag
      settingsInfo.setSettingsChanged(false);
    }
  }, [settingsInfo.settingsChanged, resetTimer, settingsInfo]);

  // Handle authentication state changes
  useEffect(() => {
    // Check if auth state changed
    if (prevAuthState !== authStatus && authStatus !== 'loading') {
      console.log('Authentication state changed:', { 
        previous: prevAuthState, 
        current: authStatus,
        isAuthenticated
      });
      
      // Update previous auth state
      setPrevAuthState(authStatus);
      
      // Reset timer when auth state changes
      if (authStatus === 'authenticated' || authStatus === 'unauthenticated') {
        // Complete any active session
        if (sessionStartTimeRef.current && !isPausedRef.current) {
          completeCurrentSession();
        }
        
        // Reset timer with new settings
        resetTimer();
      }
    }
  }, [authStatus, prevAuthState, isAuthenticated, completeCurrentSession, resetTimer]);

  // Initialize timer when component mounts or when settings change
  useEffect(() => {
    // Reset timer if settings have changed
    const workMinutesChanged = prevWorkMinutesRef.current !== settingsInfo.workMinutes;
    const breakMinutesChanged = prevBreakMinutesRef.current !== settingsInfo.breakMinutes;
    
    if (workMinutesChanged || breakMinutesChanged) {
      console.log('Settings changed, resetting timer:', {
        oldWorkMinutes: prevWorkMinutesRef.current,
        newWorkMinutes: settingsInfo.workMinutes,
        oldBreakMinutes: prevBreakMinutesRef.current,
        newBreakMinutes: settingsInfo.breakMinutes
      });
      
      // Update refs
      prevWorkMinutesRef.current = settingsInfo.workMinutes;
      prevBreakMinutesRef.current = settingsInfo.breakMinutes;
      
      // Reset timer with new settings
      // This will update both the total time and current time
      resetTimer();
    } else if (secondsLeftRef.current === 0) {
      // Initialize timer with work minutes from settings
      const initialSeconds = minutesToSeconds(settingsInfo.workMinutes);
      setSecondsLeft(initialSeconds);
      secondsLeftRef.current = initialSeconds;
    }
  }, [settingsInfo.workMinutes, settingsInfo.breakMinutes, resetTimer]);

  // Effect to initialize timer on first render
  useEffect(() => {
    // Skip initialization if there's already a saved state
    if (localStorage.getItem('timerState')) {
      return;
    }
    
    // Initialize timer with current mode's minutes
    const initialSeconds = minutesToSeconds(
      mode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );
    setSecondsLeft(initialSeconds);
    secondsLeftRef.current = initialSeconds;
    
    console.log('Timer initialized with:', {
      mode,
      seconds: initialSeconds,
      workMinutes: settingsInfo.workMinutes,
      breakMinutes: settingsInfo.breakMinutes
    });
  }, [renderKey, settingsInfo.workMinutes, settingsInfo.breakMinutes, mode]);

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) {
        return;
      }
      if (secondsLeftRef.current === 0) {
        // Complete current session when timer reaches zero
        completeCurrentSession();
        return switchMode();
      }

      tick();
    }, UI.TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [switchMode, tick, completeCurrentSession]);

  // Handle page navigation
  useEffect(() => {
    // Restore timer state when component mounts
    restoreTimerState();
    
    // Save timer state when navigating away
    const handleRouteChange = (url) => {
      // Save the current URL before navigation
      setPreviousUrl(router.asPath);
      
      // Save timer state before navigating
      saveTimerState();
      
      // If navigating to stats, ensure timer is paused
      if (url.includes('/stats')) {
        console.log('Navigating to stats page, ensuring timer is paused');
        setIsPaused(true);
        isPausedRef.current = true;
      }
    };
    
    // Handle route change complete
    const handleRouteChangeComplete = (url) => {
      // Check if returning from stats
      if (previousUrl.includes('/stats') && url === '/') {
        console.log('Returning from stats page, will restore timer state');
        setReturningFromStats(true);
        // Force a re-render to ensure the timer state is restored
        setRenderKey(Date.now());
      }
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      // Save state when component unmounts
      saveTimerState();
    };
  }, [router, saveTimerState, restoreTimerState, previousUrl]);

  // Effect to handle returning from settings
  useEffect(() => {
    // Check if we're returning from settings
    if (!settingsInfo.showSettings) {
      // Force a re-render to ensure the timer is updated
      setRenderKey(Date.now());
    }
  }, [settingsInfo.showSettings]);

  const totalSeconds = minutesToSeconds(
    mode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
  );
  
  const percentage = calculatePercentage(secondsLeft, totalSeconds);
  const timeDisplay = formatTime(secondsLeft);

  const handlePlayPause = useCallback((shouldPlay) => {
    if (shouldPlay) {
      // If starting from paused state
      if (isPausedRef.current) {
        // If no session is in progress, start a new one
        if (!sessionStartTimeRef.current) {
          startNewSession();
        } else if (isAuthenticated) {
          // Otherwise, resume existing session if authenticated
          handleTimerEvent(TIMER_EVENTS.RESUMED, modeRef.current);
        }
      }
      
      setIsPaused(false);
      isPausedRef.current = false;
      
      // Mark timer as active
      setIsTimerActive(true);
      isTimerActiveRef.current = true;
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      
      // Log pause event if authenticated
      if (isAuthenticated) {
        handleTimerEvent(TIMER_EVENTS.PAUSED, modeRef.current);
      }
    }
  }, [handleTimerEvent, startNewSession, modeRef, isAuthenticated]);

  const handleSettingsClick = () => {
    if (isAuthenticated && !isTimerActive) {
      // Complete current session if one is in progress
      if (sessionStartTimeRef.current && !isPausedRef.current) {
        completeCurrentSession();
      }
      
      // Save timer state before showing settings
      saveTimerState();
      settingsInfo.setShowSettings(true);
    }
  };

  const handleStatsClick = () => {
    if (isAuthenticated && isPaused) {
      // Save timer state before navigating to stats
      saveTimerState();
      router.push('/stats');
    }
  };

  // Show loading state while settings are being loaded
  if (settingsInfo.isLoading) {
    return (
      <div className="loading-container">
        <p>Loading settings...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 300px;
            color: white;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div key={renderKey}>
      <CircularProgressbar
        value={percentage}
        text={timeDisplay}
        styles={buildStyles({
          textColor: COLORS.WHITE,
          pathColor: mode === TIMER_MODES.WORK ? COLORS.RED : COLORS.GREEN,
          tailColor: COLORS.TRANSPARENT_WHITE,
        })} 
      />
      <div style={{marginTop:'20px', display: 'flex', justifyContent: 'center', gap: '10px'}}>
        {isPaused
          ? <PlayButton onClick={() => handlePlayPause(true)} />
          : <PauseButton onClick={() => handlePlayPause(false)} />}
        <FastForwardButton 
          onClick={handleFastForward} 
          disabled={!sessionStartTimeRef.current}
          tooltip={!sessionStartTimeRef.current ? "No active session" : ""}
        />
        <CancelButton 
          onClick={handleCancel}
          disabled={!sessionStartTimeRef.current}
          tooltip={!sessionStartTimeRef.current ? "No active session" : ""}
        />
      </div>
      
      {isAuthenticated && (
        <div style={{marginTop:'20px', display: 'flex', justifyContent: 'space-between'}}>
          <SettingsButton 
            onClick={handleSettingsClick} 
            disabled={isTimerActive}
            tooltip={isTimerActive ? "Cancel timer first to access settings" : ""}
          />
          <StatsButton 
            onClick={handleStatsClick}
            disabled={!isPaused}
            tooltip={!isPaused ? "Pause timer first to view stats" : ""}
          />
        </div>
      )}
      
      <div className="mode-indicator">
        Current Mode: <span className={mode === TIMER_MODES.WORK ? 'work-mode' : 'break-mode'}>
          {mode === TIMER_MODES.WORK ? 'Work' : 'Break'}
        </span>
        <div className="timer-info">
          {mode === TIMER_MODES.WORK ? 
            `${secondsLeft} / ${totalSeconds} seconds (${settingsInfo.workMinutes} minutes)` : 
            `${secondsLeft} / ${totalSeconds} seconds (${settingsInfo.breakMinutes} minutes)`
          }
        </div>
        {!isAuthenticated && (
          <div className="fixed-times">
            Fixed times: Work 45m / Break 10m
          </div>
        )}
      </div>
      
      {!isAuthenticated && (
        <div className="auth-message">
          Sign in to access settings, stats, and custom timers
        </div>
      )}
      
      <style jsx>{`
        .auth-message {
          margin-top: 10px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        
        .mode-indicator {
          margin-top: 15px;
          text-align: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .timer-info {
          margin-top: 5px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .fixed-times {
          margin-top: 5px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .work-mode {
          color: ${COLORS.RED};
          font-weight: bold;
        }
        
        .break-mode {
          color: ${COLORS.GREEN};
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default Timer; 