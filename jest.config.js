// module.exports = {
//   preset: "ts-jest",
//   testEnvironment: "node",
//   moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
// };

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  coverageReporters: ["text", "lcov", "cobertura"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "test-results",
        outputName: "junit.xml",
      },
    ],
  ],
};
