import { parseStringPromise } from 'xml2js';
import { Annotation } from '../types/annotation';
import { TestResult, TestResultCounts } from '../types/test-result';
import { UnitTestResultParser } from './parser';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default class JunitParser extends UnitTestResultParser {
  private testCaseAnnotation(testcase: any): Annotation {
    const stacktrace = testcase.failure.toString().trim().substring(0, 65536);
    const [filename, lineno] = this.getLocation(stacktrace);

    const sanitizedFilename = this.sanitizePath(filename);
    const message = testcase.failure
      .split('\n')
      .filter((s: string) => s.trim().length > 0)
      .slice(0, 2)
      .join('\n');
    const classname = testcase.classname;
    const methodname = testcase.name;

    return new Annotation(
      sanitizedFilename,
      lineno,
      lineno,
      0,
      0,
      'failure',
      `Failed test ${methodname} in ${classname}`,
      message,
      stacktrace
    );
  }

  private getTestSuites(toplevelTestSuite: any): any[] {
    if ('testsuite' in toplevelTestSuite) {
      return Array.isArray(toplevelTestSuite['testsuite'])
        ? toplevelTestSuite['testsuite']
        : [toplevelTestSuite['testsuite']];
    }

    return [];
  }

  private getFailedTestCases(testsuites: any[]): any[] {
    let testCases: any[] = [];

    for (const testsuite of testsuites) {
      if ('testcase' in testsuite) {
        const childcases = testsuite['testcase'];

        if (Array.isArray(childcases)) {
          testCases = testCases.concat(childcases);
        } else {
          testCases.push(childcases);
        }
      }
    }

    return testCases.filter((s) => s.failure);
  }

  protected async parseResults(testData: string): Promise<TestResult> {
    const parsedXml: any = await parseStringPromise(testData, {
      trim: true,
      mergeAttrs: true,
      explicitArray: false,
    });

    const testRun = parsedXml['testsuites'];

    const testSuites = this.getTestSuites(testRun);

    let allResults = new TestResultCounts(0, 0, 0, 0, 0, 0);
    let duration = 0.0;
    for (const testSuite of testSuites) {
      duration += testSuite.time ? parseFloat(testSuite.time) : 0;
      const tests: number = testSuite.tests ? parseInt(testSuite.tests) : 0;
      const failures: number = testSuite.failures
        ? parseInt(testSuite.failures)
        : 0;
      const skipped: number = testSuite.skipped
        ? parseInt(testSuite.skipped)
        : 0;
      const errors: number = testSuite.errors ? parseInt(testSuite.errors) : 0;

      allResults = allResults.merge(
        new TestResultCounts(
          tests,
          tests - failures - skipped - errors,
          0,
          skipped,
          failures,
          0
        )
      );
    }

    const failedCases = this.getFailedTestCases(testSuites);
    const annotations = failedCases.map((s) => this.testCaseAnnotation(s));

    return new TestResult(allResults, duration, annotations);
  }
}
