import React from 'react';
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Mock the fetchDefaultSettings function
jest.mock('../../utils/api', () => ({
  fetchDefaultSettings: jest.fn().mockResolvedValue({
    workMinutes: 25,
    breakMinutes: 5,
    noiseCancellation: false,
    pinkNoiseEnabled: true,
    pinkNoiseType: 'Rainfall'
  }),
  saveSettings: jest.fn().mockResolvedValue({ success: true }),
  logTimerEvent: jest.fn().mockResolvedValue({ success: true })
}));

// Mock session data
const mockSession = {
  data: {
    user: {
      name: 'Test User',
      email: 'test@example.com'
    },
    expires: '2025-01-01T00:00:00.000Z'
  },
  status: 'authenticated'
};

// Custom render function that includes providers
const customRender = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <SessionProvider session={mockSession}>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </SessionProvider>
    ),
    ...options,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Add a simple test to satisfy Jest's requirement for at least one test
describe('Test Utils', () => {
  test('customRender function is defined', () => {
    expect(typeof customRender).toBe('function');
  });
});
