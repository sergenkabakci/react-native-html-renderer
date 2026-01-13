module.exports = {
    preset: 'react-native',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/lib/',
        '<rootDir>/example/',
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|htmlparser2)/)',
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    setupFilesAfterEnv: [],
    moduleNameMapper: {
        '^react-native$': 'react-native',
    },
};
