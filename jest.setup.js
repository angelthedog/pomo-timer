import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { server } from './mocks/server';

// Start the mock service worker
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close the server after all tests
afterAll(() => server.close());

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn()
    }
  })
}));

// Mock the next-auth session
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn()
}));

// Mock the Audio API
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();
window.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock the visibility API
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true
});

// Mock location for MSW
const location = {
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000'
};

Object.defineProperty(window, 'location', {
  value: location,
  writable: true
});

// Mock fetch API
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/api/settings/default')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        workMinutes: 25,
        breakMinutes: 5,
        noiseCancellation: false,
        pinkNoiseEnabled: true,
        pinkNoiseType: 'Rainfall'
      })
    });
  }
  
  if (url.includes('/api/settings/save')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  
  if (url.includes('/api/timer/log')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  
  return Promise.reject(new Error(`Unhandled fetch request to ${url}`));
});

// Mock console.error to suppress React 18 warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported in React 18') ||
    args[0]?.includes?.('Warning: unmountComponentAtNode is deprecated') ||
    args[0]?.includes?.('Warning: `ReactDOMTestUtils.act` is deprecated') ||
    args[0]?.includes?.('Warning: An update to') ||
    args[0]?.includes?.('Maximum update depth exceeded') ||
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// ... rest of your setup code
