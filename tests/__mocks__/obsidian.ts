import { jest } from "@jest/globals";
import * as moment from 'moment';

module.exports = {
  moment: moment,
  Component: class {
  },
};

// jest.mock('obsidian', () => {
//   console.info("MUUH");
  
//   return {
//     moment: moment,
//     App: jest.fn().mockImplementation(() => {
//       return {
//         plugins: {},
//       }
//     }),
//     TFile: jest.fn().mockImplementation(() => {
//       return {
//         // Add any methods or properties you want to mock
//         basename: 'mock-basename.md',
//         path: 'mock-path',
//         extension: 'md',
//         stat: jest.fn(),
//       };
//     }),
//   };
// });