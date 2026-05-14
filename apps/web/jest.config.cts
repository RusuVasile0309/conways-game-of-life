const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  displayName: '@temp-nx/web',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/web',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

const jestConfig = createJestConfig(config);

module.exports = async () => {
  const resolved = await jestConfig();
  // Disable SWC path alias resolution — handled by Nx jest resolver.
  for (const value of Object.values(resolved.transform)) {
    if (Array.isArray(value) && value[1]?.resolvedBaseUrl) {
      value[1] = { ...value[1], resolvedBaseUrl: undefined };
    }
  }
  // zod v4 ships "type":"module" — Jest resolves index.d.cts (declaration) instead of CJS runtime
  resolved.moduleNameMapper = {
    ...resolved.moduleNameMapper,
    '^zod$': '<rootDir>/../../node_modules/zod/index.cjs',
  };
  return resolved;
};
