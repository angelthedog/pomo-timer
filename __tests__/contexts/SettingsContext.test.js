import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings, SettingsProvider } from '../../contexts/SettingsContext';

describe('useSettings Hook', () => {
  it('loads default settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Check settings values
    expect(result.current.workMinutes).toBe(45);
    expect(result.current.breakMinutes).toBe(10);
    expect(result.current.pinkNoiseEnabled).toBe(false);
  });

  it('updates settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Update settings
    await act(async () => {
      result.current.setWorkMinutes(30);
      result.current.setBreakMinutes(15);
      result.current.setPinkNoiseEnabled(true);
    });

    // Check updated values
    expect(result.current.workMinutes).toBe(30);
    expect(result.current.breakMinutes).toBe(15);
    expect(result.current.pinkNoiseEnabled).toBe(true);
  });
});
