/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "src"],
};
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   moduleFileExtensions: ["ts", "js"],
//   moduleDirectories: ["node_modules", "src"],
//   transform: {
//     "^.+\\.[t|j]sx?$": ['ts-jest', {
//       useESM: true,
//       tsconfig: {
//         verbatimModuleSyntax: false,
//       },
//     }]
//   }
// };