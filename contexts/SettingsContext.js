import { createContext, useState, useContext, useEffect } from 'react';
import { TIMER_SETTINGS } from '../utils/constants';
import { useSession } from 'next-auth/react';
import { fetchDefaultSettings } from '../utils/api';

// Default times for unauthenticated users
const GUEST_WORK_MINUTES = 45;
const GUEST_BREAK_MINUTES = 10;

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  
  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(GUEST_WORK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(GUEST_BREAK_MINUTES);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Load settings from API when session changes
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      // For unauthenticated users, use fixed default times
      if (!isAuthenticated) {
        setWorkMinutes(GUEST_WORK_MINUTES);
        setBreakMinutes(GUEST_BREAK_MINUTES);
        setIsLoading(false);
        console.log('Using default settings for guest:', { 
          workMinutes: GUEST_WORK_MINUTES, 
          breakMinutes: GUEST_BREAK_MINUTES 
        });
        return;
      }
      
      try {
        const settings = await fetchDefaultSettings();
        if (settings) {
          setWorkMinutes(settings.workMinutes);
          setBreakMinutes(settings.breakMinutes);
          console.log('Settings loaded for authenticated user:', settings);
        } else {
          // Fallback to defaults if API fails
          setWorkMinutes(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
          setBreakMinutes(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
          console.log('Using fallback settings:', { 
            workMinutes: TIMER_SETTINGS.DEFAULT_WORK_MINUTES, 
            breakMinutes: TIMER_SETTINGS.DEFAULT_BREAK_MINUTES 
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to defaults if API fails
        setWorkMinutes(TIMER_SETTINGS.DEFAULT_WORK_MINUTES);
        setBreakMinutes(TIMER_SETTINGS.DEFAULT_BREAK_MINUTES);
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
      setWorkMinutes,
      setBreakMinutes,
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