/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  testTimeout: 20000,
  forceExit: true,
  clearMocks: true,
};

