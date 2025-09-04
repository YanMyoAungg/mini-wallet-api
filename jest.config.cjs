module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
