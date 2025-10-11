import '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to debug tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
}; 