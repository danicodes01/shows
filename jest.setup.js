// jest.setup.js
import '@testing-library/jest-dom';
import util from 'util';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock TextEncoder and TextDecoder for Node.js environment
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Mock fetch for Node.js environment
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ message: 'Success' }),
  })
);
