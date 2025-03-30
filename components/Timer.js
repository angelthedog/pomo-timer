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
import { TIMER_MODES, TIMER_EVENTS, COLORS, UI, PINK_NOISE_URLS } from '../utils/constants';
import { formatTime, calculatePercentage, minutesToSeconds } from '../utils/helpers';
import { useRouter } from 'next/router';
import FeedbackModal from './FeedbackModal';

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
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Create a ref for the audio element
  const audioRef = useRef(null);

  // Refs to maintain state across renders and in callbacks
  const secondsLeftRef = useRef(secondsLeft);
  const isPausedRef = useRef(isPaused);
  const modeRef = useRef(mode);
  const prevWorkMinutesRef = useRef(settingsInfo.workMinutes);
  const prevBreakMinutesRef = useRef(settingsInfo.breakMinutes);
  const sessionStartTimeRef = useRef(null);
  const isTimerActiveRef = useRef(false);

  // Add these refs for pink noise
  const pinkNoiseRef = useRef(null);
  const isPinkNoisePlayingRef = useRef(false);

  // Add a function to test the sound
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

  // Add an effect to initialize the audio element
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
    if (!isAuthenticated) return;
    
    try {
      const timestamp = Date.now();
      
      const response = await fetch('/api/timer/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          timestamp,
          mode,
          duration
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to log timer event');
      }
      
      const data = await response.json();
      
      // Store the session ID when a session is started
      if (event === TIMER_EVENTS.STARTED) {
        console.log('Session started with ID:', data.sessionId);
        setCurrentSessionId(data.sessionId);
      }
      
      console.log(`Timer event logged: ${event}`);
    } catch (error) {
      console.error('Error logging timer event:', error);
    }
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
    
    // Store the current session ID if it's a work session
    const workSessionId = modeRef.current === TIMER_MODES.WORK ? currentSessionId : null;
    
    // Log completion with actual duration if authenticated
    if (isAuthenticated) {
      handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, elapsedSeconds);
    }
    
    // Reset session start time
    setSessionStartTime(null);
    sessionStartTimeRef.current = null;
    
    console.log(`Session completed: ${modeRef.current}, Duration: ${elapsedSeconds} seconds`);
    
    // Show feedback modal only for work sessions
    if (modeRef.current === TIMER_MODES.WORK && isAuthenticated) {
      console.log('Showing feedback modal for work session ID:', workSessionId);
      setShowFeedbackModal(true);
      // Store the work session ID for feedback
      setCurrentSessionId(workSessionId);
      // Don't switch mode yet - wait for feedback to be submitted
      return;
    }
    
    // Switch mode and start next session
    switchMode();
  }, [handleTimerEvent, modeRef, isAuthenticated, currentSessionId]);

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

    // Stop pink noise
    handlePinkNoisePlayback(false);
  }, [settingsInfo]);

  const resetTimer = useCallback(() => {
    // Complete current session if one is in progress
    if (sessionStartTimeRef.current && !isPausedRef.current) {
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
    }
    
    // Reset timer to current mode with new duration
    const newSeconds = minutesToSeconds(
      modeRef.current === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );
    
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
    
    // Start new session for next mode
    startNewSession();
    
    // Unpause the timer to start automatically
    setIsPaused(false);
    isPausedRef.current = false;
    
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

    // Stop pink noise
    handlePinkNoisePlayback(false);
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
      timestamp: Date.now()
    };
    
    // Store in localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerState', JSON.stringify(state));
    }
    
    console.log('Timer state saved:', state);
    
    return state;
  }, []);

  // Restore timer state when returning to the page
  const restoreTimerState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('timerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
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
          
          // Force a re-render to update the UI
          setRenderKey(Date.now());
          
          console.log('Timer state restored:', { 
            mode: state.mode, 
            secondsLeft: secondsLeftRef.current,
            isPaused: isPausedRef.current,
            sessionStartTime: state.sessionStartTime,
            isTimerActive: state.isTimerActive
          });
        }
      }
    } catch (error) {
      console.error('Error restoring timer state:', error);
    }
  }, [completeCurrentSession]);

  // Effect to initialize timer on first render
  useEffect(() => {
    // Skip initialization if there's already a saved state
    if (localStorage.getItem('timerState')) {
      console.log('Found saved timer state, skipping initialization');
      return;
    }
    
    // Skip initialization if there's an active session
    if (sessionStartTimeRef.current) {
      console.log('Active session in progress, skipping initialization');
      return;
    }
    
    // Only initialize if settings are loaded
    if (settingsInfo.isLoading) return;

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
    
    // Set both state and ref to ensure consistency
    setSecondsLeft(initialSeconds);
    secondsLeftRef.current = initialSeconds;
    
    // Update refs to track the settings
    prevWorkMinutesRef.current = workMinutes;
    prevBreakMinutesRef.current = breakMinutes;
    
    // Force a re-render to ensure UI is updated
    setRenderKey(Date.now());
    
    console.log('Timer initialized with seconds:', initialSeconds);
  }, [settingsInfo.isLoading, settingsInfo.workMinutes, settingsInfo.breakMinutes, isAuthenticated, mode]);

  // Effect to update timer when settings load
  useEffect(() => {
    // This effect runs whenever settingsInfo.workMinutes or settingsInfo.breakMinutes changes
    // or when isAuthenticated or settingsInfo.isLoading changes
    
    // Only proceed if settings are loaded (not loading)
    if (!settingsInfo.isLoading) {
      // Don't reset if there's an active session
      if (sessionStartTimeRef.current) {
        console.log('Active session in progress, not updating timer with database values');
        return;
      }
      
      // Get the correct minutes based on authentication status
      const workMinutes = isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES;
      const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES;
      
      console.log('Settings loaded, updating timer with values:', {
        workMinutes,
        breakMinutes,
        isAuthenticated
      });
      
      // Always update the timer with the current mode's duration
      const databaseSeconds = minutesToSeconds(
        modeRef.current === TIMER_MODES.WORK ? workMinutes : breakMinutes
      );
      
      // IMPORTANT: Update both the state and the ref to ensure consistency
      setSecondsLeft(databaseSeconds);
      secondsLeftRef.current = databaseSeconds;
      
      // Update the refs to track the new settings
      prevWorkMinutesRef.current = workMinutes;
      prevBreakMinutesRef.current = breakMinutes;
      
      // Force a re-render to update the UI
      setRenderKey(Date.now());
      
      console.log('Timer updated with values:', {
        mode: modeRef.current,
        seconds: databaseSeconds,
        workMinutes,
        breakMinutes
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
      if (document.visibilityState === 'hidden') {
        // Save state if timer was running, regardless of auth status
        if (!isPausedRef.current && sessionStartTimeRef.current) {
          console.log('Page became hidden, saving timer state');
          saveTimerState();
        }
      } else {
        // When becoming visible, check if timer was running
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
          const state = JSON.parse(savedState);
          if (!state.isPaused && state.sessionStartTime) {
            // Calculate elapsed time while hidden
            const elapsed = (Date.now() - state.timestamp) / 1000;
            const secondsElapsed = Math.floor(elapsed);
            const adjustedSecondsLeft = Math.max(0, state.secondsLeft - secondsElapsed);
            
            // Update timer state
            setSecondsLeft(adjustedSecondsLeft);
            secondsLeftRef.current = adjustedSecondsLeft;
            
            // If timer reached zero while away, handle completion
            if (adjustedSecondsLeft === 0) {
              completeCurrentSession();
            }
            
            // Force UI update
            setRenderKey(Date.now());
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveTimerState, completeCurrentSession]);

  // Handle page navigation
  useEffect(() => {
    // Restore timer state when component mounts
    restoreTimerState();
    
    // Force a re-render after mounting to ensure UI is updated
    setRenderKey(Date.now());
    
    // Save timer state when navigating away
    const handleRouteChange = () => {
      // Save timer state before navigating
      saveTimerState();
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      // Save state when component unmounts
      saveTimerState();
    };
  }, [router, saveTimerState, restoreTimerState]);

  // Calculate totalSeconds and percentage right before rendering to ensure they're up-to-date
  const calculateTimerValues = () => {
    // Always use the latest values from settings
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : GUEST_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : GUEST_BREAK_MINUTES;
    
    // Calculate total seconds based on current mode and latest settings
    const total = minutesToSeconds(
      mode === TIMER_MODES.WORK ? workMinutes : breakMinutes
    );
    
    // Calculate percentage based on current seconds left and total
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

  // Get the latest timer values for rendering
  const { totalSeconds, percentage } = calculateTimerValues();
  const timeDisplay = formatTime(secondsLeft);

  // Handle pink noise playback
  const handlePinkNoisePlayback = useCallback((shouldPlay) => {
    if (!settingsInfo.pinkNoiseEnabled) return;

    if (shouldPlay && !isPinkNoisePlayingRef.current) {
      console.log('Starting pink noise playback');
      if (!pinkNoiseRef.current) {
        pinkNoiseRef.current = new Audio(PINK_NOISE_URLS[settingsInfo.pinkNoiseType]);
        pinkNoiseRef.current.loop = true;
      }
      pinkNoiseRef.current.play();
      isPinkNoisePlayingRef.current = true;
    } else if (!shouldPlay && isPinkNoisePlayingRef.current) {
      console.log('Stopping pink noise playback');
      if (pinkNoiseRef.current) {
        pinkNoiseRef.current.pause();
        pinkNoiseRef.current.currentTime = 0;
      }
      isPinkNoisePlayingRef.current = false;
    }
  }, [settingsInfo.pinkNoiseEnabled, settingsInfo.pinkNoiseType]);

  // Handle play/pause
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
      handlePinkNoisePlayback(true); // Start pink noise
      
      // Mark timer as active
      setIsTimerActive(true);
      isTimerActiveRef.current = true;
      
      // Disable Settings and Stats buttons when timer is running
      console.log('Timer started, disabling Settings and Stats buttons');
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      handlePinkNoisePlayback(false); // Pause pink noise
      
      // Log pause event if authenticated
      if (isAuthenticated) {
        handleTimerEvent(TIMER_EVENTS.PAUSED, modeRef.current);
      }
      
      // Enable Settings and Stats buttons when timer is paused
      console.log('Timer paused, enabling Settings and Stats buttons');
    }
  }, [handleTimerEvent, startNewSession, modeRef, isAuthenticated, handlePinkNoisePlayback]);

  const handleSettingsClick = () => {
    // Show settings modal
    settingsInfo.setShowSettings(true);
  };

  const handleStatsClick = () => {
    if (isAuthenticated) {
      router.push('/stats');
    }
  };

  // Add this function to handle feedback submission
  const handleFeedbackSubmit = async (sessionId, rating) => {
    if (!isAuthenticated) return;
    
    try {
      console.log(`Submitting feedback: ${rating} stars for session ${sessionId}`);
      
      const response = await fetch('/api/timer/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          feedback: rating
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to submit feedback');
      }
      
      const data = await response.json();
      console.log('Feedback submitted successfully:', data);
      
      // Add a delay before closing the modal and switching modes
      setTimeout(() => {
        setShowFeedbackModal(false);
        // Switch modes after feedback is submitted
        switchMode();
      }, UI.AUTO_CLOSE_DELAY);
    } catch (error) {
      console.error('Error submitting feedback:', error);
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
      
      {/* Add the feedback modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        sessionId={currentSessionId}
      />
      
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