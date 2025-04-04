import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Timer from '../../components/Timer';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Increase Jest timeout for all tests in this file
jest.setTimeout(30000);

// Mock CSS modules
jest.mock('react-circular-progressbar/dist/styles.css', () => ({}), { virtual: true });

const renderTimer = () => {
  return render(
    <SettingsProvider>
      <Timer />
    </SettingsProvider>
  );
};

describe('Timer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders timer with initial state', async () => {
    renderTimer();

    // Wait for settings to load and timer to initialize
    await waitFor(() => {
      expect(screen.queryByText(/loading settings/i)).toBeNull();
    }, { timeout: 5000 });

    // Check initial state
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByText(/45:00/i)).toBeInTheDocument();
    expect(screen.getByText('Work', { selector: '.work-mode' })).toBeInTheDocument();
  });

  it('starts timer on play button click', async () => {
    renderTimer();

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.queryByText(/loading settings/i)).toBeNull();
    }, { timeout: 5000 });

    // Start timer
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Advance timers
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Check if timer is running
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByText(/44:59/i)).toBeInTheDocument();
  });

  it('handles visibility changes correctly', async () => {
    renderTimer();

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.queryByText(/loading settings/i)).toBeNull();
    }, { timeout: 5000 });

    // Start timer
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Simulate page becoming hidden
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Simulate page becoming visible
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Check if timer is still running
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
