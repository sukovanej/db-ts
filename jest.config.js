module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './packages',
  transform: {
    '^.+\\.ts$': [
      '@swc-node/jest',
      { jsc: { target: 'es2021' }, sourceMaps: 'inline' },
    ],
  },
  testRegex: '.spec.ts$',
  roots: ['<rootDir>/db-ts/test', '<rootDir>/db-ts-postgres/test'],
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['<rootDir>/**/*.{js,ts}'],
  coveragePathIgnorePatterns: ['/node_modules/', '/examples/', '/test/'],
  coverageProvider: 'v8',
};
