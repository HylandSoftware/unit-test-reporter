import { promises as fs } from 'fs';
import { EOL } from 'os';
import junitParser from '../../src/parsers/junit';
var path = require('path');

test('parse all Results', async () => {
  var testPath = path.join('__tests__', 'junit', 'testcase-allpass.xml');

  var results = await new junitParser().readResults(testPath);

  expect(results.annotations).toHaveLength(0);
  expect(results.resultCounts.total).toBe(2);
  expect(results.resultCounts.passed).toBe(2);
  expect(results.resultCounts.failed).toBe(0);
  expect(results.totalduration).toBe(15.807);
});

test('parse jest junit output example', async () => {
  var testPath = path.join('__tests__', 'junit', 'jest-junit.xml');

  var results = await new junitParser().readResults(testPath);

  expect(results.annotations).toHaveLength(0);
  expect(results.resultCounts.total).toBe(1);
  expect(results.resultCounts.passed).toBe(1);
  expect(results.resultCounts.failed).toBe(0);
  expect(results.totalduration).toBe(0.161);
});

test('parse jest junit failue', async () => {
  var testPath = path.join('__tests__', 'junit', 'testcase-failure.xml');

  var results = await new junitParser().readResults(testPath);

  expect(results.resultCounts.total).toBe(58);
  expect(results.resultCounts.passed).toBe(57);
  expect(results.resultCounts.failed).toBe(1);
  expect(results.totalduration).toBe(27.169);
  expect(results.annotations).toHaveLength(1);
  const annotation = results.annotations[0];
  expect(annotation.message).toBe(
    'Error: expect(received).toBeTruthy()\nReceived: false'
  );
  expect(annotation.annotation_level).toBe('failure');
  expect(annotation.start_line).toBe(224);
  expect(annotation.path).toBe(
    `C:/code/gitweb/libs/users/src/lib/users/user-form/component.spec.ts`
  );
});
