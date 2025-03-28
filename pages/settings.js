import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSettings } from '../contexts/SettingsContext';

export default function Settings() {
  const router = useRouter();
  const settingsInfo = useSettings();

  useEffect(() => {
    // Show settings modal and redirect to home
    settingsInfo.setShowSettings(true);
    router.replace('/');
  }, [router, settingsInfo]);

  return null;
} 