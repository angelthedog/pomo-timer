import ReactSlider from 'react-slider';
import { useSettings } from '../contexts/SettingsContext';
import BackButton from "./BackButton";
import { useState, useEffect, useCallback } from 'react';
import { fetchDefaultSettings, saveSettings as apiSaveSettings } from '../utils/api';
import { COLORS, TIMER_SETTINGS, UI } from '../utils/constants';
import { useSession } from 'next-auth/react';

function Settings() {
  const settingsInfo = useSettings();
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [workMinutes, setWorkMinutes] = useState(settingsInfo.workMinutes);
  const [breakMinutes, setBreakMinutes] = useState(settingsInfo.breakMinutes);
  
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
      }
    };
    
    loadDefaultSettings();
  }, [settingsInfo]);
  
  // Save settings to API
  const saveSettings = useCallback(async () => {
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
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const result = await apiSaveSettings({
        workMinutes,
        breakMinutes
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
  }, [settingsInfo, workMinutes, breakMinutes, session]);
  
  const getStatusStyles = useCallback((type) => ({
    marginTop: '10px',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: type === 'success' ? COLORS.SUCCESS_BG : COLORS.ERROR_BG,
    color: type === 'success' ? COLORS.GREEN : COLORS.RED
  }), []);
  
  return(
    <div style={{textAlign:'left'}}>
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
      
      {saveStatus && (
        <div style={getStatusStyles(saveStatus.type)}>
          {saveStatus.message}
        </div>
      )}
      
      <div style={{textAlign:'center', marginTop:'20px', display: 'flex', justifyContent: 'space-between'}}>
        <BackButton onClick={() => settingsInfo.setShowSettings(false)} />
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
      `}</style>
    </div>
  );
}

export default Settings; 