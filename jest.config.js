import sinonChrome from 'sinon-chrome';
import fetch, { Headers, Request, Response } from 'node-fetch';


export default {
  globals: {
    "chrome": sinonChrome,
    "fetch": fetch,
    "Headers": Headers,
    "Request": Request,
    "Response": Response
  },
  transform: { '^.+\\.(t|j)s?$': 'ts-jest'},
  testEnvironment: 'node',
  testTimeout: 300000,
  resolver: 'ts-jest-resolver',
  testRegex: '/test/.*\\.(test|spec)?\\.(ts|tsx|js)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
