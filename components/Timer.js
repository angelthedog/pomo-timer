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
import { TIMER_MODES, TIMER_EVENTS, COLORS, UI, PINK_NOISE_URLS, TIMER_SETTINGS } from '../utils/constants';
import { formatTime, calculatePercentage, minutesToSeconds } from '../utils/helpers';
import { useRouter } from 'next/router';

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

  // Add a ref to track last hidden time
  const lastHiddenTimeRef = useRef(null);

  // Add a ref to store state when switching focus
  const storedStateRef = useRef(null);

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

  const handleTimerEvent = useCallback(async (event, mode, duration) => {
    // Skip logging since it's not needed
    console.log('Timer event:', { event, mode, duration });
  }, []);

  const startNewSession = useCallback(() => {
    // Record session start time
    const now = Date.now();
    setSessionStartTime(now);
    sessionStartTimeRef.current = now;
    
    // Mark timer as active
    setIsTimerActive(true);
    isTimerActiveRef.current = true;
    
    // Log start event (just console log)
    if (isAuthenticated) {
      handleTimerEvent(TIMER_EVENTS.STARTED, modeRef.current);
    }
  }, [isAuthenticated, handleTimerEvent]);

  // Handle pink noise playback
  const handlePinkNoisePlayback = useCallback((shouldPlay) => {
    // Skip pink noise for unauthenticated users
    if (!isAuthenticated) {
      console.log('Skipping pink noise - user not authenticated');
      return;
    }

    console.log('Pink noise settings:', {
      shouldPlay,
      enabled: settingsInfo.pinkNoiseEnabled,
      type: settingsInfo.pinkNoiseType,
      audioElement: !!pinkNoiseRef.current
    });

    if (shouldPlay && settingsInfo.pinkNoiseEnabled) {
      // Create the audio element if it doesn't exist
      if (!pinkNoiseRef.current) {
        console.log('Creating pink noise audio element');
        pinkNoiseRef.current = new Audio(PINK_NOISE_URLS[settingsInfo.pinkNoiseType]);
        pinkNoiseRef.current.loop = true;
      } else {
        // Update audio source to match current settings
        const audioUrl = PINK_NOISE_URLS[settingsInfo.pinkNoiseType];
        console.log('Playing pink noise with URL:', audioUrl);
        
        if (pinkNoiseRef.current.src !== audioUrl) {
          pinkNoiseRef.current.src = audioUrl;
        }
      }
      
      // Start playing pink noise with current settings
      if (pinkNoiseRef.current) {
        pinkNoiseRef.current.play()
          .then(() => {
            isPinkNoisePlayingRef.current = true;
            console.log('Pink noise started playing successfully:', settingsInfo.pinkNoiseType);
          })
          .catch(err => {
            console.error('Error playing pink noise:', err);
            console.log('Audio element state:', {
              src: pinkNoiseRef.current.src,
              readyState: pinkNoiseRef.current.readyState,
              paused: pinkNoiseRef.current.paused,
              error: pinkNoiseRef.current.error
            });
          });
      } else {
        console.error('Pink noise audio element not initialized');
      }
    } else {
      // Stop playing pink noise
      if (pinkNoiseRef.current) {
        pinkNoiseRef.current.pause();
        isPinkNoisePlayingRef.current = false;
        console.log('Pink noise stopped');
      }
    }
  }, [isAuthenticated, settingsInfo.pinkNoiseEnabled, settingsInfo.pinkNoiseType]);

  const switchMode = useCallback(() => {
    const nextMode = modeRef.current === TIMER_MODES.WORK ? TIMER_MODES.BREAK : TIMER_MODES.WORK;
    
    // Always get the latest values from settings
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : TIMER_SETTINGS.DEFAULT_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : TIMER_SETTINGS.DEFAULT_BREAK_MINUTES;
    
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

  const completeCurrentSession = useCallback(() => {
    // Play completion sound immediately
    try {
      const sound = new Audio('/sounds/complete.mp3');
      sound.volume = 1.0;
      sound.play()
        .then(() => console.log('Completion sound played successfully'))
        .catch(err => {
          console.error('Error playing completion sound:', err);
        });
    } catch (err) {
      console.error('Error creating audio:', err);
    }

    // Log work session completion (just console log)
    if (isAuthenticated && modeRef.current === TIMER_MODES.WORK) {
      const totalDuration = minutesToSeconds(settingsInfo.workMinutes);
      handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, totalDuration);
    }

    // Switch to next mode and start it
    switchMode();
  }, [settingsInfo.workMinutes, isAuthenticated, switchMode, handleTimerEvent]);

  const skipCurrentSession = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    
    // Log work session completion (just console log)
    if (isAuthenticated && modeRef.current === TIMER_MODES.WORK) {
      const totalDuration = minutesToSeconds(settingsInfo.workMinutes);
      const actualDuration = totalDuration - secondsLeftRef.current;
      handleTimerEvent(TIMER_EVENTS.COMPLETED, modeRef.current, actualDuration);
    }
    
    // Reset session start time
    setSessionStartTime(null);
    sessionStartTimeRef.current = null;
    
    // Switch to next mode
    const nextMode = modeRef.current === TIMER_MODES.WORK ? TIMER_MODES.BREAK : TIMER_MODES.WORK;
    setMode(nextMode);
    modeRef.current = nextMode;
    
    // Reset timer to next mode's initial duration
    const initialSeconds = minutesToSeconds(
      nextMode === TIMER_MODES.WORK ? settingsInfo.workMinutes : settingsInfo.breakMinutes
    );
    
    // Set the new duration
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
    
    console.log('Session skipped, switched to next mode:', nextMode);
  }, [settingsInfo, modeRef, handlePinkNoisePlayback, isAuthenticated, handleTimerEvent]);

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
  }, [settingsInfo, handlePinkNoisePlayback]);

  // Fast forward to next session
  const handleFastForward = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    skipCurrentSession();
  }, [skipCurrentSession]);

  // Cancel current session
  const handleCancel = useCallback(() => {
    if (!sessionStartTimeRef.current) return;
    cancelCurrentSession();
    
    // Enable Settings and Stats buttons after cancelling
    console.log('Timer cancelled, enabling Settings and Stats buttons');
  }, [cancelCurrentSession]);

  // Save timer mode to localStorage
  const saveTimerMode = useCallback(() => {
    localStorage.setItem('timerMode', modeRef.current);
    console.log('Timer mode saved:', modeRef.current);
  }, []);

  // Restore timer mode from localStorage
  const restoreTimerMode = useCallback(() => {
    const savedMode = localStorage.getItem('timerMode');
    if (savedMode && (savedMode === TIMER_MODES.WORK || savedMode === TIMER_MODES.BREAK)) {
      setMode(savedMode);
      modeRef.current = savedMode;
      console.log('Timer mode restored:', savedMode);
    }
  }, []);

  // Handle page navigation
  useEffect(() => {
    // Restore timer mode on mount
    restoreTimerMode();
    
    // Force a re-render after mounting to ensure UI is updated
    setRenderKey(Date.now());
    
    // Save timer mode when navigating away
    const handleRouteChange = () => {
      saveTimerMode();
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      // Save mode when unmounting
      saveTimerMode();
    };
  }, [router, saveTimerMode, restoreTimerMode]);

  // Effect to initialize timer on first render
  useEffect(() => {
    // Skip initialization if there's an active session
    if (sessionStartTimeRef.current) {
      console.log('Active session in progress, skipping initialization');
      return;
    }
    
    // Only initialize if settings are loaded
    if (settingsInfo.isLoading) return;

    // Get the correct minutes based on authentication status
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : TIMER_SETTINGS.DEFAULT_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : TIMER_SETTINGS.DEFAULT_BREAK_MINUTES;
    
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
    if (!settingsInfo.isLoading) {
      // Don't reset if there's an active session or if we're in the middle of a focus switch
      if (sessionStartTimeRef.current && isTimerActiveRef.current) {
        console.log('Active session in progress, not resetting timer with new settings');
        return;
      }
      
      // Don't reset if we're in the middle of a focus switch
      if (lastHiddenTimeRef.current) {
        console.log('Focus switch in progress, not resetting timer with new settings');
        return;
      }
      
      // If no active session, just reset the timer with new settings
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
    }
  }, [settingsInfo.isLoading, settingsInfo.workMinutes, settingsInfo.breakMinutes]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Visibility changed:', document.visibilityState);
      
      if (document.visibilityState === 'hidden') {
        // Store the time when page was hidden
        lastHiddenTimeRef.current = Date.now();
        
        // Store the current state when switching away
        storedStateRef.current = {
          secondsLeft: secondsLeftRef.current,
          isPaused: isPausedRef.current,
          isTimerActive: isTimerActiveRef.current,
          mode: modeRef.current,
          sessionStartTime: sessionStartTimeRef.current
        };
        
        console.log('Page hidden, storing state:', storedStateRef.current);
      } else {
        // Page is now visible again
        console.log('Page visible again, checking conditions:', {
          lastHiddenTime: lastHiddenTimeRef.current,
          isPaused: isPausedRef.current,
          isTimerActive: isTimerActiveRef.current
        });
        
        if (lastHiddenTimeRef.current && !isPausedRef.current && isTimerActiveRef.current) {
          // Calculate elapsed time while hidden
          const elapsedSeconds = Math.floor((Date.now() - lastHiddenTimeRef.current) / 1000);
          
          // Adjust the timer
          const newSecondsLeft = Math.max(0, secondsLeftRef.current - elapsedSeconds);
          console.log(`Adjusting timer: ${secondsLeftRef.current}s -> ${newSecondsLeft}s (elapsed: ${elapsedSeconds}s)`);
          
          // Update both ref and state to ensure consistency
          secondsLeftRef.current = newSecondsLeft;
          setSecondsLeft(newSecondsLeft);
          
          // Restart pink noise if it was enabled
          if (isAuthenticated && settingsInfo.pinkNoiseEnabled) {
            console.log('Restarting pink noise after focus switch');
            // First stop the pink noise
            handlePinkNoisePlayback(false);
            // Then start it again after a short delay
            setTimeout(() => {
              handlePinkNoisePlayback(true);
            }, 100);
          }
          
          // Log the restored state
          console.log('Page visible again, restored state:', {
            secondsLeft: newSecondsLeft,
            isPaused: isPausedRef.current,
            isTimerActive: isTimerActiveRef.current,
            mode: modeRef.current,
            sessionStartTime: sessionStartTimeRef.current,
            storedState: storedStateRef.current
          });
        } else {
          console.log('Not adjusting timer or playing pink noise:', {
            lastHiddenTime: lastHiddenTimeRef.current,
            isPaused: isPausedRef.current,
            isTimerActive: isTimerActiveRef.current
          });
        }
        
        // Reset the hidden time
        lastHiddenTimeRef.current = null;
        // Clear stored state
        storedStateRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, settingsInfo.pinkNoiseEnabled, handlePinkNoisePlayback]);

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) {
        return;
      }

      if (secondsLeftRef.current === 0) {
        completeCurrentSession();
        return;
      }

      tick();
    }, UI.TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [tick, completeCurrentSession]);

  // Calculate totalSeconds and percentage right before rendering to ensure they're up-to-date
  const calculateTimerValues = () => {
    // Always use the latest values from settings
    const workMinutes = isAuthenticated ? settingsInfo.workMinutes : TIMER_SETTINGS.DEFAULT_WORK_MINUTES;
    const breakMinutes = isAuthenticated ? settingsInfo.breakMinutes : TIMER_SETTINGS.DEFAULT_BREAK_MINUTES;
    
    // Calculate total seconds based on current mode and latest settings
    const total = minutesToSeconds(
      mode === TIMER_MODES.WORK ? workMinutes : breakMinutes
    );
    
    // Calculate percentage based on current seconds left and total
    const percent = calculatePercentage(secondsLeft, total);
    

    return { totalSeconds: total, percentage: percent };
  };

  // Get the latest timer values for rendering
  const { totalSeconds, percentage } = calculateTimerValues();
  const timeDisplay = formatTime(secondsLeft);

  // Add function to check if settings/stats should be enabled
  const isSettingsAndStatsEnabled = () => {
    // Only enable if timer is in init state, cancelled, or skipped
    // Also disable if timer is naturally completed (secondsLeft is 0)
    return !isTimerActiveRef.current && !sessionStartTimeRef.current && secondsLeftRef.current > 0;
  };

  // Handle play/pause
  const handlePlayPause = useCallback((shouldPlay) => {
    if (shouldPlay) {
      // If starting from paused state
      if (isPausedRef.current) {
        // If no session is in progress, start a new one
        if (!sessionStartTimeRef.current) {
          startNewSession();
        }
      }
      
      setIsPaused(false);
      isPausedRef.current = false;
      
      // Only start pink noise for authenticated users
      if (isAuthenticated) {
        handlePinkNoisePlayback(true);
      }
      
      // Mark timer as active
      setIsTimerActive(true);
      isTimerActiveRef.current = true;
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      
      // Only stop pink noise for authenticated users
      if (isAuthenticated) {
        handlePinkNoisePlayback(false);
      }
    }
  }, [startNewSession, isAuthenticated, handlePinkNoisePlayback]);

  const handleSettingsClick = () => {
    // Show settings modal
      settingsInfo.setShowSettings(true);
  };

  const handleStatsClick = () => {
    if (isAuthenticated) {
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
      
      {/* Add pink noise audio element */}
      <audio ref={pinkNoiseRef} preload="auto" loop>
        <source src={PINK_NOISE_URLS[settingsInfo.pinkNoiseType]} type="audio/mpeg" />
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
          <div>Percentage: {percentage}%</div>
          <div>Work Minutes: {isAuthenticated ? settingsInfo.workMinutes : TIMER_SETTINGS.DEFAULT_WORK_MINUTES}</div>
          <div>Break Minutes: {isAuthenticated ? settingsInfo.breakMinutes : TIMER_SETTINGS.DEFAULT_BREAK_MINUTES}</div>
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
            disabled={!isSettingsAndStatsEnabled()}
            tooltip={!isSettingsAndStatsEnabled() ? "Timer must be reset to access settings" : ""}
          />
          <StatsButton 
            onClick={handleStatsClick}
            disabled={!isSettingsAndStatsEnabled()}
            tooltip={!isSettingsAndStatsEnabled() ? "Timer must be reset to view stats" : ""}
          />
        </div>
      )}
      
      <div className="mode-indicator">
        Current Mode: <span className={mode === TIMER_MODES.WORK ? 'work-mode' : 'break-mode'}>
          {mode === TIMER_MODES.WORK ? 'Work' : 'Break'}
        </span>
        <div className="timer-info">
          {mode === TIMER_MODES.WORK ? 
            `${secondsLeft} / ${totalSeconds} seconds (${isAuthenticated ? settingsInfo.workMinutes : TIMER_SETTINGS.DEFAULT_WORK_MINUTES} minutes)` : 
            `${secondsLeft} / ${totalSeconds} seconds (${isAuthenticated ? settingsInfo.breakMinutes : TIMER_SETTINGS.DEFAULT_BREAK_MINUTES} minutes)`
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