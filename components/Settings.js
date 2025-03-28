import ReactSlider from 'react-slider';
import { useSettings } from '../contexts/SettingsContext';
import BackButton from "./BackButton";
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDefaultSettings, saveSettings as apiSaveSettings } from '../utils/api';
import { COLORS, TIMER_SETTINGS, PINK_NOISE_TYPES, PINK_NOISE_URLS, UI } from '../utils/constants';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// OR if UI doesn't exist in constants, define it directly in Settings
const SOUND_TEST_DURATION = 10000; // 10 seconds in milliseconds

function Settings() {
  const settingsInfo = useSettings();
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [workMinutes, setWorkMinutes] = useState(settingsInfo.workMinutes);
  const [breakMinutes, setBreakMinutes] = useState(settingsInfo.breakMinutes);
  const [noiseCancellation, setNoiseCancellation] = useState(settingsInfo.noiseCancellation);
  const [pinkNoiseEnabled, setPinkNoiseEnabled] = useState(settingsInfo.pinkNoiseEnabled);
  const [pinkNoiseType, setPinkNoiseType] = useState(settingsInfo.pinkNoiseType);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const audioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  
  // Load default settings from API
  useEffect(() => {
    const loadDefaultSettings = async () => {
      const defaults = await fetchDefaultSettings();
      
      if (defaults) {
        // Only set if different from current values
        if (defaults.workMinutes !== settingsInfo.workMinutes) {
          settingsInfo.setWorkMinutes(defaults.workMinutes);
          setWorkMinutes(defaults.workMinutes);
        }
        if (defaults.breakMinutes !== settingsInfo.breakMinutes) {
          settingsInfo.setBreakMinutes(defaults.breakMinutes);
          setBreakMinutes(defaults.breakMinutes);
        }
        if (defaults.noiseCancellation !== settingsInfo.noiseCancellation) {
          settingsInfo.setNoiseCancellation(defaults.noiseCancellation);
          setNoiseCancellation(defaults.noiseCancellation);
        }
        if (defaults.pinkNoiseEnabled !== settingsInfo.pinkNoiseEnabled) {
          settingsInfo.setPinkNoiseEnabled(defaults.pinkNoiseEnabled);
          setPinkNoiseEnabled(defaults.pinkNoiseEnabled);
        }
        if (defaults.pinkNoiseType !== settingsInfo.pinkNoiseType) {
          settingsInfo.setPinkNoiseType(defaults.pinkNoiseType);
          setPinkNoiseType(defaults.pinkNoiseType);
        }
      }
    };
    
    loadDefaultSettings();
  }, [settingsInfo]);
  
  // Move cleanupSound definition before saveSettings
  const cleanupSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsTestPlaying(false);
    }
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }
  }, []);
  
  // Now saveSettings can use cleanupSound
  const saveSettings = useCallback(async () => {
    // Clean up any playing sound before saving
    cleanupSound();

    if (!session) {
      setSaveStatus({ 
        type: 'error', 
        message: 'You must be signed in to save settings' 
      });
      return;
    }
    
    // Update context
    settingsInfo.setWorkMinutes(workMinutes);
    settingsInfo.setBreakMinutes(breakMinutes);
    settingsInfo.setNoiseCancellation(noiseCancellation);
    settingsInfo.setPinkNoiseEnabled(pinkNoiseEnabled);
    settingsInfo.setPinkNoiseType(pinkNoiseType);
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const result = await apiSaveSettings({
        workMinutes,
        breakMinutes,
        noiseCancellation,
        pinkNoiseEnabled,
        pinkNoiseType
      });
      
      console.log('Save settings result:', result);
      
      if (result.success) {
        // Signal that settings were saved successfully
        settingsInfo.setSettingsChanged(true);
        
        setSaveStatus({ 
          type: 'success', 
          message: 'Settings saved successfully!' 
        });
        
        // Return to timer after successful save
        setTimeout(() => {
          settingsInfo.setShowSettings(false);
        }, UI.AUTO_CLOSE_DELAY);
      } else {
        setSaveStatus({ 
          type: 'error', 
          message: result.error?.message || 'Failed to save settings' 
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({ 
        type: 'error', 
        message: 'An error occurred while saving settings' 
      });
    } finally {
      setIsSaving(false);
    }
  }, [session, workMinutes, breakMinutes, noiseCancellation, pinkNoiseEnabled, pinkNoiseType, settingsInfo, cleanupSound]);
  
  const getStatusStyles = useCallback((type) => ({
    marginTop: '10px',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: type === 'success' ? COLORS.SUCCESS_BG : COLORS.ERROR_BG,
    color: type === 'success' ? COLORS.GREEN : COLORS.RED
  }), []);
  
  // Handle pink noise toggle
  const handlePinkNoiseToggle = (value) => {
    setPinkNoiseEnabled(value);
    // Clean up sound when disabling pink noise
    if (!value) {
      cleanupSound();
      console.log('Pink noise disabled, hiding dropdown');
    } else {
      console.log('Pink noise enabled, showing dropdown');
    }
  };

  // Handle noise cancellation toggle
  const handleNoiseCancellationToggle = (value) => {
    setNoiseCancellation(value);
    console.log('Noise cancellation toggled:', value);
  };
  
  // Add this function to handle test sound playback
  const handleTestSound = useCallback(() => {
    // Clear any existing timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }

    // Initialize audio if needed
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // If sound is already playing, stop it
    if (isTestPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsTestPlaying(false);
      return;
    }

    // Clean up previous audio state
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    // Set up new audio with selected sound
    const soundUrl = PINK_NOISE_URLS[pinkNoiseType];
    audioRef.current.src = soundUrl;
    
    // Handle sound completion
    audioRef.current.onended = () => {
      setIsTestPlaying(false);
      audioRef.current.currentTime = 0;
    };

    // Play the sound and set timeout
    audioRef.current.play()
      .then(() => {
        setIsTestPlaying(true);
        
        // Use SOUND_TEST_DURATION instead of UI.TICK_INTERVAL
        audioTimeoutRef.current = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsTestPlaying(false);
          }
        }, SOUND_TEST_DURATION);
      })
      .catch(err => console.error('Error playing test sound:', err));
  }, [pinkNoiseType, isTestPlaying]);

  // Add this handler for pink noise type change
  const handlePinkNoiseTypeChange = (event) => {
    // Stop any playing test sound when changing type
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsTestPlaying(false);
    }
    setPinkNoiseType(event.target.value);
  };

  // Update back button handler
  const handleBack = () => {
    cleanupSound();
    settingsInfo.setShowSettings(false);
  };

  useEffect(() => {
    return () => {
      // Use the cleanup function when component unmounts
      cleanupSound();
    };
  }, [cleanupSound]);

  return(
    <div style={{textAlign:'left'}}>
      {/* Hidden audio element for playing sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/complete.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="setting-group">
        <label htmlFor="workMinutes">Work Minutes: {workMinutes}</label>
        <input
          type="range"
          id="workMinutes"
          min={TIMER_SETTINGS.WORK_MIN_MINUTES}
          max={TIMER_SETTINGS.WORK_MAX_MINUTES}
          value={workMinutes}
          onChange={(e) => setWorkMinutes(parseInt(e.target.value, 10))}
          className="slider"
        />
        <div className="range-info">
          Range: {TIMER_SETTINGS.WORK_MIN_MINUTES}-{TIMER_SETTINGS.WORK_MAX_MINUTES} minutes
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="breakMinutes">Break Minutes: {breakMinutes}</label>
        <input
          type="range"
          id="breakMinutes"
          min={TIMER_SETTINGS.BREAK_MIN_MINUTES}
          max={TIMER_SETTINGS.BREAK_MAX_MINUTES}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10))}
          className="slider green"
        />
        <div className="range-info">
          Range: {TIMER_SETTINGS.BREAK_MIN_MINUTES}-{TIMER_SETTINGS.BREAK_MAX_MINUTES} minutes
        </div>
      </div>
      
      <div className="setting-group">
        <div className="toggle-container">
          <label htmlFor="noiseCancellation" onClick={() => handleNoiseCancellationToggle(!noiseCancellation)}>
            Noise Cancellation
          </label>
          <div 
            className="toggle-switch" 
            onClick={(e) => {
              e.stopPropagation();
              handleNoiseCancellationToggle(!noiseCancellation);
            }}
          >
            <input
              type="checkbox"
              id="noiseCancellation"
              checked={noiseCancellation}
              onChange={(e) => {
                e.stopPropagation();
                handleNoiseCancellationToggle(e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>
        <div className="setting-description">
          Enable noise cancellation to reduce background noise during focus sessions
        </div>
      </div>
      
      <div className="setting-group">
        <div className="toggle-container">
          <label htmlFor="pinkNoiseEnabled" onClick={() => handlePinkNoiseToggle(!pinkNoiseEnabled)}>
            Pink Noise
          </label>
          <div 
            className="toggle-switch" 
            onClick={(e) => {
              e.stopPropagation();
              handlePinkNoiseToggle(!pinkNoiseEnabled);
            }}
          >
            <input
              type="checkbox"
              id="pinkNoiseEnabled"
              checked={pinkNoiseEnabled}
              onChange={(e) => {
                e.stopPropagation();
                handlePinkNoiseToggle(e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </div>
        </div>
        <div className="setting-description">
          Enable pink noise to help maintain focus and mask distractions
        </div>
        
        {pinkNoiseEnabled && (
          <div className="noise-type-selector">
            <label>Pink Noise Type</label>
            <select 
              className="select-dropdown"
              value={pinkNoiseType}
              onChange={handlePinkNoiseTypeChange}
            >
              {PINK_NOISE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button 
              className="test-sound-button" 
              onClick={handleTestSound}
              disabled={!pinkNoiseEnabled}
            >
              <span className="sound-icon">🔊</span>
              {isTestPlaying ? 'Stop Sound' : 'Test Sound'}
            </button>
          </div>
        )}
      </div>
      
      {saveStatus && (
        <div style={getStatusStyles(saveStatus.type)}>
          {saveStatus.message}
        </div>
      )}
      
      <div style={{textAlign:'center', marginTop:'20px', display: 'flex', justifyContent: 'space-between'}}>
        <BackButton onClick={handleBack} />
        <button 
          className="with-text" 
          onClick={saveSettings}
          disabled={isSaving}
          style={{
            backgroundColor: COLORS.SUCCESS_BG,
            color: COLORS.GREEN,
            zIndex: 5,
            position: 'relative'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <style jsx>{`
        .setting-group {
          margin-bottom: 20px;
          background-color: rgba(0, 0, 0, 0.2);
          padding: 15px;
          border-radius: 10px;
        }
        
        .slider {
          width: 100%;
          height: 40px;
          margin-top: 10px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
          z-index: 5;
          position: relative;
        }
        
        .slider:hover {
          opacity: 1;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--red);
          cursor: pointer;
          z-index: 10;
          position: relative;
        }
        
        .slider::-moz-range-thumb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--red);
          cursor: pointer;
          z-index: 10;
          position: relative;
        }
        
        .slider.green::-webkit-slider-thumb {
          background: var(--green);
        }
        
        .slider.green::-moz-range-thumb {
          background: var(--green);
        }
        
        .range-info {
          margin-top: 5px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .toggle-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          position: relative;
          z-index: 10;
        }
        
        .toggle-container label {
          cursor: pointer;
          user-select: none;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
          z-index: 15;
          cursor: pointer;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
          cursor: pointer;
          z-index: 20;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 34px;
          z-index: 5;
          pointer-events: none;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: var(--green);
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }
        
        .setting-description {
          margin-top: 5px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .noise-type-selector {
          margin-top: 15px;
          position: relative;
          z-index: 25;
        }
        
        .select-dropdown {
          width: 100%;
          padding: 10px;
          margin-top: 5px;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: none;
          border-radius: 5px;
          appearance: none;
          cursor: pointer;
          z-index: 30;
          position: relative;
          font-size: 14px;
        }
        
        .select-dropdown option {
          background-color: #333;
          color: white;
          padding: 10px;
        }
        
        .test-sound-button {
          margin-top: 10px;
          padding: 8px 12px;
          background-color: rgba(0, 0, 0, 0.3);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          width: 100%;
        }
        
        .test-sound-button:hover {
          background-color: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .test-sound-button:active {
          transform: scale(0.98);
        }
        
        .sound-icon {
          margin-right: 5px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

export default Settings; 