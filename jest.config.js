module.exports = {
  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/__tests__/**/*.test.js', '<rootDir>/__tests__/**/*.spec.js'],
      setupFilesAfterEnv: ['./jest.setup.js', './jest.setup.console.js'], // Correct paths
      moduleNameMapper: {
        '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.node.js', '<rootDir>/__tests__/**/*.server.js'],
      setupFilesAfterEnv: ['./jest.setup.js'],
      moduleNameMapper: {
        '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    },
  ],
};
