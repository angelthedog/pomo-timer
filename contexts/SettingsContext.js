import { createContext, useState, useContext, useEffect } from 'react';
import { TIMER_SETTINGS, PINK_NOISE_TYPES } from '../utils/constants';
import { useSession } from 'next-auth/react';
import { fetchDefaultSettings } from '../utils/api';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  
  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [pinkNoiseEnabled, setPinkNoiseEnabled] = useState(false);
  const [pinkNoiseType, setPinkNoiseType] = useState(PINK_NOISE_TYPES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Load settings from API when session changes
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      // For unauthenticated users, use fixed default times
      if (!isAuthenticated) {
        setWorkMinutes(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
        setBreakMinutes(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
        setNoiseCancellation(false);
        setPinkNoiseEnabled(false);
        setPinkNoiseType(PINK_NOISE_TYPES[0]);
        setIsLoading(false);
        console.log('Using default settings for guest:', { 
          workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES, 
          breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
          noiseCancellation: false,
          pinkNoiseEnabled: false,
          pinkNoiseType: PINK_NOISE_TYPES[0]
        });
        return;
      }
      
      try {
        const settings = await fetchDefaultSettings();
        if (settings) {
          setWorkMinutes(settings.workMinutes);
          setBreakMinutes(settings.breakMinutes);
          setNoiseCancellation(settings.noiseCancellation || false);
          setPinkNoiseEnabled(settings.pinkNoiseEnabled || false);
          setPinkNoiseType(settings.pinkNoiseType || PINK_NOISE_TYPES[0]);
          console.log('Settings loaded for authenticated user:', settings);
        } else {
          // Fallback to defaults if API fails
          setWorkMinutes(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
          setBreakMinutes(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
          setNoiseCancellation(false);
          setPinkNoiseEnabled(false);
          setPinkNoiseType(PINK_NOISE_TYPES[0]);
          console.log('Using fallback settings:', { 
            workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES, 
            breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES,
            noiseCancellation: false,
            pinkNoiseEnabled: false,
            pinkNoiseType: PINK_NOISE_TYPES[0]
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to defaults if API fails
        setWorkMinutes(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
        setBreakMinutes(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
        setNoiseCancellation(false);
        setPinkNoiseEnabled(false);
        setPinkNoiseType(PINK_NOISE_TYPES[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
    
    // Signal settings changed when authentication status changes
    if (status !== 'loading') {
      setSettingsChanged(true);
    }
  }, [session, isAuthenticated, status]);

  return (
    <SettingsContext.Provider value={{
      showSettings,
      setShowSettings,
      workMinutes,
      breakMinutes,
      noiseCancellation,
      pinkNoiseEnabled,
      pinkNoiseType,
      setWorkMinutes,
      setBreakMinutes,
      setNoiseCancellation,
      setPinkNoiseEnabled,
      setPinkNoiseType,
      isLoading,
      isAuthenticated,
      settingsChanged,
      setSettingsChanged
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext; 