module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/main.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Specific thresholds for different modules
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/api/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/cli/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000, // 30 seconds timeout for E2E and performance tests
  maxWorkers: 4 // Limit concurrent test workers
};