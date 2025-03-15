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
  const [shouldAutoStart, setShouldAutoStart] = useState(true);
  
  // Create a ref for the audio element
  const audioRef = useRef(null);

  // Refs to maintain state across renders and in callbacks
  const secondsLeftRef = useRef(secondsLeft);
  const isPausedRef = useRef(isPaused);
  const modeRef = useRef(mode);
  const prevWorkMinutesRef = useRef(settingsInfo.workMinutes);
  const prevBreakMinutesRef = useRef(settingsInfo.breakMinutes);
  const timerStateRef = useRef({});
  const sessionStartTimeRef = useRef(null);
  const isTimerActiveRef = useRef(false);
  const shouldAutoStartRef = useRef(true);

  // Add a function to test the sound - moved to the top with other hooks
  const testSound = useCallback(() => {
    if (audioRef.current) {
      console.log('Testing sound playback');
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => console.log('Test sound played successfully'))
        .catch(err => console.error('Test sound failed:', err));
    } else {
      console.error('Audio element not available for testing');
    }
  }, []);

  // Add an effect to initialize the audio element - moved to the top with other hooks
  useEffect(() => {
    // Initialize audio when component mounts
    if (audioRef.current) {
      // Preload the audio
      audioRef.current.load();
      console.log('Audio element initialized');
      
      // Add event listeners for debugging
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Audio can play through without buffering');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      // Verify the audio file exists by trying to fetch it
      fetch('/sounds/complete.mp3')
        .then(response => {
          if (response.ok) {
            console.log('Audio file exists and is accessible');
          } else {
            console.error('Audio file not found or not accessible:', response.status);
          }
        })
        .catch(error => {
          console.error('Error checking audio file:', error);
        });
    }
  }, []);

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
    
    // Play completion sound only if not skipping to next (natural completion)
    // We've moved this to the timer tick effect to ensure it only plays when timer reaches zero naturally
    
    // If skipping to next, don't auto-start the next session
    if (skipToNext) {
      console.log('Skipping to next session without auto-starting');
      setShouldAutoStart(false);
      shouldAutoStartRef.current = false;
      
      // Ensure we have the latest settings before switching
      if (isAuthenticated) {
        console.log('Using authenticated settings:', {
          workMinutes: settingsInfo.workMinutes,
          breakMinutes: settingsInfo.breakMinutes
        });
      } else {
        console.log('Using guest settings:', {
          workMinutes: GUEST_WORK_MINUTES,
          breakMinutes: GUEST_BREAK_MINUTES
        });
      }
      
      switchMode();
    } else {
      // Normal completion - auto-start next session
      console.log('Normal completion, auto-starting next session');
      setShouldAutoStart(true);
      shouldAutoStartRef.current = true;
      
      // Ensure we have the latest settings before switching
      if (isAuthenticated) {
        console.log('Using authenticated settings:', {
          workMinutes: settingsInfo.workMinutes,
          breakMinutes: settingsInfo.breakMinutes
        });
      } else {
        console.log('Using guest settings:', {
          workMinutes: GUEST_WORK_MINUTES,
          breakMinutes: GUEST_BREAK_MINUTES
        });
      }
      
      switchMode();
    }
  }, [handleTimerEvent, modeRef, isAuthenticated, settingsInfo]);

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
    
    // Don't auto-start after cancellation
    setShouldAutoStart(false);
    shouldAutoStartRef.current = false;
  }, [settingsInfo]);

  const resetTimer = useCallback(() => {
    // Complete current session if one is in progress
    if (sessionStartTimeRef.current && !isPausedRef.current) {
      // We need to be careful not to create circular dependencies
      // So we'll manually complete the session without calling completeCurrentSession
      
      // Calculate elapsed time
      const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      
      // Log completion with actual duration if authenticated
      if (isAuthenticated) {
        handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, elapsedSeconds);
      }
      
      // Reset session start time
      setSessionStartTime(null);
      sessionStartTimeRef.current = null;
      
      console.log(`Session completed during reset: ${modeRef.current}, Duration: ${elapsedSeconds} seconds`);
      
      // Note: We don't play the completion sound here since this is a manual reset
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
  }, [settingsInfo, isAuthenticated, handleTimerEvent]);

  const switchMode = useCallback(() => {
    const nextMode = modeRef.current === TIMER_MODES.WORK ? TIMER_MODES.BREAK : TIMER_MODES.WORK;
    
    // Always get the latest values from settings
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES;
    
    // Calculate seconds based on the latest settings values
    const nextSeconds = minutesToSeconds(
      nextMode === TIMER_MODES.WORK ? workMinutes : breakMinutes
    );

    console.log(`Switching mode to ${nextMode}, using minutes: ${nextMode === TIMER_MODES.WORK ? workMinutes : breakMinutes}`);

    setMode(nextMode);
    modeRef.current = nextMode;

    setSecondsLeft(nextSeconds);
    secondsLeftRef.current = nextSeconds;
    
    // If shouldAutoStart is true, start the next session automatically
    if (shouldAutoStartRef.current) {
      // Start new session for next mode
      startNewSession();
      
      // Unpause the timer to start automatically
      setIsPaused(false);
      isPausedRef.current = false;
    } else {
      // Don't auto-start, just prepare the timer
      setIsPaused(true);
      isPausedRef.current = true;
      
      // Reset shouldAutoStart for next time
      setShouldAutoStart(true);
      shouldAutoStartRef.current = true;
    }
    
    // Force a re-render to update the UI with the new mode and time
    setRenderKey(Date.now());
  }, [settingsInfo, startNewSession, isAuthenticated]);

  // Fast forward to next session
  const handleFastForward = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    
    // Complete current session with skip flag to prevent auto-start
    completeCurrentSession(true);
    
    // Enable Settings and Stats buttons after skipping
    setIsPaused(true);
    isPausedRef.current = true;
    console.log('Timer skipped, enabling Settings and Stats buttons');
  }, [completeCurrentSession]);

  // Cancel current session
  const handleCancel = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    cancelCurrentSession();
    
    // Enable Settings and Stats buttons after cancelling
    console.log('Timer cancelled, enabling Settings and Stats buttons');
  }, [cancelCurrentSession]);

  // Save timer state before navigating away
  const saveTimerState = useCallback(() => {
    const state = {
      isPaused: isPausedRef.current,
      mode: modeRef.current,
      secondsLeft: secondsLeftRef.current,
      sessionStartTime: sessionStartTimeRef.current,
      isTimerActive: isTimerActiveRef.current,
      shouldAutoStart: shouldAutoStartRef.current,
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
        
        // If timer was running, subtract elapsed time
        if (!state.isPaused && state.sessionStartTime) {
          // Calculate how many seconds have passed since the state was saved
          const secondsElapsed = Math.floor(elapsed);
          const adjustedSecondsLeft = Math.max(0, state.secondsLeft - secondsElapsed);
          
          console.log(`Timer was running, adjusted time by ${secondsElapsed} seconds. New time: ${adjustedSecondsLeft}`);
          
          // If timer reached zero while away, handle session completion
          if (adjustedSecondsLeft === 0) {
            // Complete the session that ended while away
            // Note: We don't play the completion sound here since the user wasn't present
            console.log('Timer completed while page was hidden, not playing sound');
            completeCurrentSession();
            return; // Exit early as completeCurrentSession will handle the mode switch
          }
          
          // Update seconds left
          setSecondsLeft(adjustedSecondsLeft);
          secondsLeftRef.current = adjustedSecondsLeft;
          
          // Ensure the timer stays unpaused when returning
          setIsPaused(false);
          isPausedRef.current = false;
          
          // Restore session start time - keep the original start time
          if (state.sessionStartTime) {
            setSessionStartTime(state.sessionStartTime);
            sessionStartTimeRef.current = state.sessionStartTime;
            
            // Mark timer as active
            setIsTimerActive(true);
            isTimerActiveRef.current = true;
          }
        } else {
          // Timer was paused, restore exact seconds
          setSecondsLeft(state.secondsLeft);
          secondsLeftRef.current = state.secondsLeft;
          
          // Restore pause state
          setIsPaused(state.isPaused);
          isPausedRef.current = state.isPaused;
          
          // Restore session start time if there was one
          if (state.sessionStartTime) {
            setSessionStartTime(state.sessionStartTime);
            sessionStartTimeRef.current = state.sessionStartTime;
            
            // Mark timer as active
            setIsTimerActive(true);
            isTimerActiveRef.current = true;
          } else {
            // No active session
            setIsTimerActive(false);
            isTimerActiveRef.current = false;
          }
        }
        
        // Restore auto-start preference
        setShouldAutoStart(state.shouldAutoStart !== undefined ? state.shouldAutoStart : true);
        shouldAutoStartRef.current = state.shouldAutoStart !== undefined ? state.shouldAutoStart : true;
        
        // Force a re-render to update the UI
        setRenderKey(Date.now());
        
        console.log('Timer state restored:', { 
          mode: state.mode, 
          secondsLeft: secondsLeftRef.current,
          isPaused: isPausedRef.current,
          sessionStartTime: state.sessionStartTime,
          isTimerActive: state.isTimerActive,
          shouldAutoStart: shouldAutoStartRef.current
        });
      }
    }
  }, [completeCurrentSession]);

  // Check for settings changes
  useEffect(() => {
    if (settingsInfo.settingsChanged) {
      console.log('Settings changed flag detected, updating timer with new database values:', {
        workMinutes: settingsInfo.workMinutes,
        breakMinutes: settingsInfo.breakMinutes
      });
      
      // Update refs to track the new settings
      prevWorkMinutesRef.current = settingsInfo.workMinutes;
      prevBreakMinutesRef.current = settingsInfo.breakMinutes;
      
      // Reset timer with current mode and new duration from database
      const newSeconds = minutesToSeconds(
        modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
      );
      
      // IMPORTANT: Update both state and ref immediately and synchronously
      setSecondsLeft(newSeconds);
      secondsLeftRef.current = newSeconds;
      
      // Ensure timer is paused
      setIsPaused(true);
      isPausedRef.current = true;
      
      // Reset session start time
      setSessionStartTime(null);
      sessionStartTimeRef.current = null;
      
      // Mark timer as inactive
      setIsTimerActive(false);
      isTimerActiveRef.current = false;
      
      // Clear the settings changed flag
      settingsInfo.setSettingsChanged(false);
      
      // Force a re-render to update the UI
      setRenderKey(Date.now() + 5); // Use a different key to force a complete re-render
      
      console.log('Timer updated with new settings:', {
        mode: modeRef.current,
        seconds: newSeconds,
        workMinutes: settingsInfo.workMinutes,
        breakMinutes: settingsInfo.breakMinutes
      });
    }
  }, [settingsInfo.settingsChanged, settingsInfo.workMinutes, settingsInfo.breakMinutes]);

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
      
      // Handle auth state changes
      if (authStatus === 'authenticated' || authStatus === 'unauthenticated') {
        // We'll handle any active session directly here to avoid circular dependencies
        if (sessionStartTimeRef.current) {
          // Calculate elapsed time
          const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
          
          // Log completion with actual duration if authenticated (for the session that's ending)
          if (prevAuthState === 'authenticated') {
            handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, elapsedSeconds);
          }
          
          // Reset session start time
          setSessionStartTime(null);
          sessionStartTimeRef.current = null;
          
          console.log(`Session completed due to auth change: ${modeRef.current}, Duration: ${elapsedSeconds} seconds`);
        }
        
        // If user just logged in, ensure we use the database values
        if (authStatus === 'authenticated' && prevAuthState !== 'authenticated') {
          console.log('User logged in, immediately updating timer with database values');
          
          // Clear any existing timer state to ensure we use fresh database values
          localStorage.removeItem('timerState');
          
          // Immediately update the timer with database values
          const databaseSeconds = minutesToSeconds(
            modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
          );
          
          // Update the timer with database values
          setSecondsLeft(databaseSeconds);
          secondsLeftRef.current = databaseSeconds;
          
          // Update refs to track the settings
          prevWorkMinutesRef.current = settingsInfo.workMinutes;
          prevBreakMinutesRef.current = settingsInfo.breakMinutes;
          
          // Force a re-render to update the UI
          setRenderKey(Date.now());
          
          console.log('Timer immediately updated with database values:', {
            mode: modeRef.current,
            seconds: databaseSeconds,
            workMinutes: settingsInfo.workMinutes,
            breakMinutes: settingsInfo.breakMinutes
          });
        } else if (authStatus === 'unauthenticated' && prevAuthState === 'authenticated') {
          // User logged out, reset to guest values
          console.log('User logged out, stopping timer and resetting to guest values');
          
          // Clear any existing timer state
          localStorage.removeItem('timerState');
          
          // Always reset to WORK mode when logging out
          setMode(TIMER_MODES.WORK);
          modeRef.current = TIMER_MODES.WORK;
          
          // Reset timer with guest work minutes (45 min)
          const guestSeconds = minutesToSeconds(GUEST_WORK_MINUTES);
          
          // IMPORTANT: Update both state and ref immediately and synchronously
          setSecondsLeft(guestSeconds);
          secondsLeftRef.current = guestSeconds;
          
          // Update refs to track the guest settings
          prevWorkMinutesRef.current = GUEST_WORK_MINUTES;
          prevBreakMinutesRef.current = GUEST_BREAK_MINUTES;
          
          // Always pause the timer when logging out
          setIsPaused(true);
          isPausedRef.current = true;
          
          // Reset session if any was in progress
          setSessionStartTime(null);
          sessionStartTimeRef.current = null;
          setIsTimerActive(false);
          isTimerActiveRef.current = false;
          
          // Force a re-render to update the UI with a unique key
          setRenderKey(Date.now() + 20);
          
          console.log('Timer reset to guest work mode (45 min):', {
            mode: modeRef.current,
            seconds: guestSeconds,
            workMinutes: GUEST_WORK_MINUTES,
            breakMinutes: GUEST_BREAK_MINUTES
          });
        } else {
          // For other auth state changes, just reset the timer
          resetTimer();
        }
      }
    }
  }, [authStatus, prevAuthState, isAuthenticated, resetTimer, handleTimerEvent, settingsInfo]);

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
      console.log('Found saved timer state, skipping initialization');
      return;
    }
    
    // Get the correct minutes based on authentication status
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES;
    
    console.log('Initializing timer with values:', {
      isAuthenticated,
      workMinutes,
      breakMinutes,
      mode,
      fromDatabase: isAuthenticated
    });
    
    // Initialize timer with current mode's minutes
    const initialSeconds = minutesToSeconds(
      mode === TIMER_MODES.WORK ? workMinutes : breakMinutes
    );
    
    // IMPORTANT: Update both the state and the ref to ensure consistency
    setSecondsLeft(initialSeconds);
    secondsLeftRef.current = initialSeconds;
    
    // Update refs to track the settings
    prevWorkMinutesRef.current = workMinutes;
    prevBreakMinutesRef.current = breakMinutes;
    
    // Force a re-render to ensure UI is updated
    setRenderKey(Date.now() + 25);
    
    console.log('Timer initialized with seconds:', initialSeconds);
  }, []);  // Only run once on mount, not when settings change

  // Effect to update timer when settings load
  useEffect(() => {
    // This effect runs whenever settingsInfo.workMinutes or settingsInfo.breakMinutes changes
    // or when isAuthenticated or settingsInfo.isLoading changes
    
    // Only proceed if settings are loaded (not loading) and user is authenticated
    if (!settingsInfo.isLoading && isAuthenticated) {
      console.log('Settings loaded from database, updating timer with database values:', {
        workMinutes: settingsInfo.workMinutes,
        breakMinutes: settingsInfo.breakMinutes
      });
      
      // Always update the timer with the current mode's duration from database
      const databaseSeconds = minutesToSeconds(
        modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
      );
      
      // IMPORTANT: Update both the state and the ref to ensure consistency
      setSecondsLeft(databaseSeconds);
      secondsLeftRef.current = databaseSeconds;
      
      // Update the refs to track the new settings
      prevWorkMinutesRef.current = settingsInfo.workMinutes;
      prevBreakMinutesRef.current = settingsInfo.breakMinutes;
      
      // Force a re-render to update the UI
      setRenderKey(Date.now());
      
      console.log('Timer updated with database values:', {
        mode: modeRef.current,
        seconds: databaseSeconds,
        workMinutes: settingsInfo.workMinutes,
        breakMinutes: settingsInfo.breakMinutes
      });
    }
  }, [settingsInfo.isLoading, isAuthenticated, settingsInfo.workMinutes, settingsInfo.breakMinutes]);

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) {
        return;
      }
      if (secondsLeftRef.current === 0) {
        // Play completion sound when timer naturally reaches zero
        console.log('Timer reached zero naturally, playing completion sound');
        
        // Play sound using a simpler approach
        try {
          // Create a new Audio object each time for more reliable playback
          const sound = new Audio('/sounds/complete.mp3');
          sound.volume = 1.0; // Ensure full volume
          
          // Play the sound
          sound.play()
            .then(() => console.log('Completion sound played successfully'))
            .catch(err => console.error('Error playing completion sound:', err));
            
          // Also try the audio element as backup
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1.0;
            audioRef.current.play().catch(e => console.error("Backup audio play failed:", e));
          }
        } catch (err) {
          console.error('Error creating audio:', err);
        }
        
        // Complete current session when timer reaches zero
        completeCurrentSession();
        return;
      }

      // Debug log every 10 seconds to track timer progress
      if (secondsLeftRef.current % 10 === 0) {
        console.log(`Timer tick: ${secondsLeftRef.current} seconds left, mode: ${modeRef.current}`);
      }

      tick();
    }, UI.TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [tick, completeCurrentSession]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, restoring timer state');
        // Small delay to ensure state is properly restored
        setTimeout(() => {
          restoreTimerState();
          // Force UI update after restoration
          setRenderKey(Date.now());
        }, 100);
      } else {
        console.log('Page became hidden, saving timer state');
        saveTimerState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveTimerState, restoreTimerState]);

  // Handle page navigation
  useEffect(() => {
    // Restore timer state when component mounts
    restoreTimerState();
    
    // Force a re-render after mounting to ensure UI is updated
    setRenderKey(Date.now());
    
    // Save timer state when navigating away
    const handleRouteChange = (url) => {
      // Save the current URL before navigation
      setPreviousUrl(router.asPath);
      
      // Save timer state before navigating
      saveTimerState();
    };
    
    // Handle route change complete
    const handleRouteChangeComplete = (url) => {
      // Check if returning from stats
      if (previousUrl.includes('/stats') && url === '/') {
        console.log('Returning from stats page, will restore timer state');
        setReturningFromStats(true);
        // Force a re-render to ensure the timer state is restored
        setTimeout(() => {
          restoreTimerState();
          setRenderKey(Date.now());
        }, 100);
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
      const returningFromSettings = localStorage.getItem('returningFromSettings') === 'true';
      
      if (returningFromSettings) {
        console.log('Returning from settings, updating timer with new database values');
        
        // Clear the flag
        localStorage.removeItem('returningFromSettings');
        
        // Calculate the correct seconds based on current mode and settings
        const correctSeconds = minutesToSeconds(
          modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
        );
        
        // IMPORTANT: Update both state and ref immediately
        setSecondsLeft(correctSeconds);
        secondsLeftRef.current = correctSeconds;
        
        console.log('Directly updated secondsLeft after returning from settings:', {
          mode: modeRef.current,
          newSeconds: correctSeconds,
          workMinutes: settingsInfo.workMinutes,
          breakMinutes: settingsInfo.breakMinutes
        });
        
        // Force settings to be applied
        settingsInfo.setSettingsChanged(true);
      }
      
      // Force a re-render to ensure the timer is updated
      setRenderKey(Date.now() + 3); // Use a unique key to force a complete re-render
    }
  }, [settingsInfo.showSettings, settingsInfo.workMinutes, settingsInfo.breakMinutes]);

  // Calculate totalSeconds and percentage right before rendering to ensure they're up-to-date
  const calculateTimerValues = () => {
    // Always use the latest values from settings
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES;
    
    // Calculate total seconds based on current mode and latest settings
    const total = minutesToSeconds(
      mode === TIMER_MODES.WORK ? workMinutes : breakMinutes
    );
    
    // IMPORTANT: If the secondsLeft doesn't match what it should be based on settings,
    // we need to update it to match the current settings
    if (isAuthenticated) {
      const expectedSeconds = minutesToSeconds(
        mode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
      );
      
      // Check if we're returning from settings or if there's a mismatch
      const returningFromSettings = localStorage.getItem('returningFromSettings') === 'true';
      const mismatch = secondsLeft !== expectedSeconds && !sessionStartTimeRef.current;
      
      if (mismatch || returningFromSettings) {
        console.log('Detected mismatch in calculateTimerValues for authenticated user:', {
          secondsLeft,
          expectedSeconds,
          returningFromSettings,
          mismatch
        });
        
        // This is a synchronous update that will be reflected in the next render
        secondsLeftRef.current = expectedSeconds;
        // We don't call setSecondsLeft here to avoid re-renders during the current render
      }
    } else {
      // For guest users, ensure we're using the correct guest values
      const expectedGuestSeconds = minutesToSeconds(
        mode === TIMER_MODES.WORK ? GUEST_WORK_MINUTES : GUEST_BREAK_MINUTES
      );
      
      // If there's a mismatch and no active session, update the seconds
      if (secondsLeft !== expectedGuestSeconds && !sessionStartTimeRef.current) {
        console.log('Detected mismatch in calculateTimerValues for guest user:', {
          secondsLeft,
          expectedGuestSeconds,
          mode
        });
        
        // Update the ref for the next render
        secondsLeftRef.current = expectedGuestSeconds;
      }
    }
    
    // Calculate percentage based on current seconds left and total
    // If secondsLeft > total, the percentage calculation will be capped at 100% by the helper function
    const percent = calculatePercentage(secondsLeft, total);
    
    console.log('Calculated timer values:', {
      workMinutes,
      breakMinutes,
      total,
      secondsLeft,
      percent,
      mode,
      isAuthenticated
    });
    
    return { totalSeconds: total, percentage: percent };
  };

  // Effect to ensure the UI is updated when settings change
  useEffect(() => {
    // Force a re-render whenever settings change to update the progress bar
    setRenderKey(Date.now());
    
    console.log('Settings changed, updating UI with new values:', {
      workMinutes: settingsInfo.workMinutes,
      breakMinutes: settingsInfo.breakMinutes,
      mode,
      secondsLeft
    });
  }, [settingsInfo.workMinutes, settingsInfo.breakMinutes]);

  // Get the latest timer values for rendering
  const { totalSeconds, percentage } = calculateTimerValues();
  const timeDisplay = formatTime(secondsLeft);

  // Immediate fix for secondsLeft if it doesn't match the current settings
  useEffect(() => {
    // For authenticated users
    if (isAuthenticated) {
      const expectedSeconds = minutesToSeconds(
        mode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
      );
      
      // Only fix if there's no active session and the seconds don't match
      if (!sessionStartTimeRef.current && secondsLeft !== expectedSeconds) {
        console.log('CRITICAL: Detected mismatch for authenticated user, fixing immediately:', {
          current: secondsLeft,
          expected: expectedSeconds,
          mode,
          workMinutes: settingsInfo.workMinutes,
          breakMinutes: settingsInfo.breakMinutes
        });
        
        // Update both state and ref
        setSecondsLeft(expectedSeconds);
        secondsLeftRef.current = expectedSeconds;
        
        // Force a re-render
        setRenderKey(Date.now() + 10);
        
        console.log('Fixed secondsLeft for authenticated user:', {
          from: secondsLeft,
          to: expectedSeconds,
          mode
        });
      }
    } 
    // For guest users
    else {
      const expectedGuestSeconds = minutesToSeconds(
        mode === TIMER_MODES.WORK ? GUEST_WORK_MINUTES : GUEST_BREAK_MINUTES
      );
      
      // Only fix if there's no active session and the seconds don't match
      if (!sessionStartTimeRef.current && secondsLeft !== expectedGuestSeconds) {
        console.log('CRITICAL: Detected mismatch for guest user, fixing immediately:', {
          current: secondsLeft,
          expected: expectedGuestSeconds,
          mode,
          workMinutes: GUEST_WORK_MINUTES,
          breakMinutes: GUEST_BREAK_MINUTES
        });
        
        // Update both state and ref
        setSecondsLeft(expectedGuestSeconds);
        secondsLeftRef.current = expectedGuestSeconds;
        
        // Force a re-render
        setRenderKey(Date.now() + 15);
        
        console.log('Fixed secondsLeft for guest user:', {
          from: secondsLeft,
          to: expectedGuestSeconds,
          mode
        });
      }
    }
  });  // Run on every render to catch any mismatches

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
      
      // Disable Settings and Stats buttons when timer is running
      console.log('Timer started, disabling Settings and Stats buttons');
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      
      // Log pause event if authenticated
      if (isAuthenticated) {
        handleTimerEvent(TIMER_EVENTS.PAUSED, modeRef.current);
      }
      
      // Enable Settings and Stats buttons when timer is paused
      console.log('Timer paused, enabling Settings and Stats buttons');
    }
  }, [handleTimerEvent, startNewSession, modeRef, isAuthenticated]);

  const handleSettingsClick = () => {
    if (isAuthenticated && isPaused) {
      // Save timer state before showing settings
      saveTimerState();
      
      // Set a flag to indicate we're going to settings
      // This will help us know to update the timer when we return
      localStorage.setItem('returningFromSettings', 'true');
      
      // Show settings
      settingsInfo.setShowSettings(true);
      
      console.log('Opening settings, timer state saved');
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
      {/* Audio element for the completion sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/complete.mp3" type="audio/mpeg" />
        <source src="/sounds/complete.wav" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Add a more visible test sound button */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={testSound} 
          style={{
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            padding: '5px 10px',
            background: '#333',
            color: 'white',
            border: '1px solid #666',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          Test Sound
        </button>
      )}
      
      <CircularProgressbar
        value={percentage}
        text={timeDisplay}
        styles={buildStyles({
          textColor: COLORS.WHITE,
          pathColor: mode === TIMER_MODES.WORK ? COLORS.RED : COLORS.GREEN,
          tailColor: COLORS.TRANSPARENT_WHITE,
        })} 
      />
      
      {/* Debug info to verify values */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <div>Mode: {mode}</div>
          <div>Seconds Left: {secondsLeft}</div>
          <div>Total Seconds: {totalSeconds}</div>
          <div>Percentage: {percentage.toFixed(2)}%</div>
          <div>Work Minutes: {isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES}</div>
          <div>Break Minutes: {isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES}</div>
        </div>
      )}
      
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
            disabled={!isPaused}
            tooltip={!isPaused ? "Pause timer first to access settings" : ""}
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
            `${secondsLeft} / ${totalSeconds} seconds (${isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES} minutes)` : 
            `${secondsLeft} / ${totalSeconds} seconds (${isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES} minutes)`
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
        
        .debug-info {
          margin-top: 10px;
          padding: 5px;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 5px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}

export default Timer; 