import { parseStringPromise } from 'xml2js';
import { Annotation, AnnotationLevel } from '../types/annotation';
import { TestResult, TestResultCounts } from '../types/test-result';
import { UnitTestResultParser } from './parser';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default class TrxParser extends UnitTestResultParser {
  protected async parseResults(testData: string): Promise<TestResult> {
    const parsedXml: any = await parseStringPromise(testData, {
      trim: true,
      mergeAttrs: true,
      explicitArray: false,
    });

    const testRun = parsedXml['TestRun'];

    const results = this.getResults(testRun);
    const failedResults = results.filter((r) => r.outcome !== 'Passed');

    const annotations = failedResults.map((s) => this.resultAnnotations(s));
    const duration =
      new Date(testRun.Times.finish).valueOf() -
      new Date(testRun.Times.start).valueOf();
    return new TestResult(
      new TestResultCounts(
        parseInt(testRun.ResultSummary.Counters.total),
        parseInt(testRun.ResultSummary.Counters.passed),
        parseInt(testRun.ResultSummary.Counters.warning),
        parseInt(testRun.ResultSummary.Counters.notExecuted),
        parseInt(testRun.ResultSummary.Counters.failed),
        parseInt(testRun.ResultSummary.Counters.timeout)
      ),
      duration,
      annotations
    );
  }

  private resultAnnotations(testResult: any): Annotation {
    if (testResult.Output.ErrorInfo) {
      const errorInfo = testResult.Output.ErrorInfo;
      let [filename, lineno] = ['unknown', 0];
      const stackTrace = errorInfo.StackTrace || '';
      if (stackTrace.length > 0) {
        [filename, lineno] = this.getLocation(errorInfo.StackTrace);
      }

      const sanitizedFilename = this.sanitizePath(filename);
      const message = errorInfo.Message;

      let testOutcome: AnnotationLevel = AnnotationLevel.Notice;
      switch (testResult.outcome) {
        case 'Failed':
          testOutcome = AnnotationLevel.Failure;
          break;
        case 'Warning':
          testOutcome = AnnotationLevel.Warning;
          break;
      }

      return new Annotation(
        sanitizedFilename,
        lineno,
        lineno,
        0,
        0,
        testOutcome,
        `Failed test ${testResult.testName}`,
        message,
        stackTrace.substring(0, 65536)
      );
    } else {
      let testOutcome: AnnotationLevel = AnnotationLevel.Notice;
      switch (testResult.outcome) {
        case 'Failed':
          testOutcome = AnnotationLevel.Failure;
          break;
        case 'Warning':
          testOutcome = AnnotationLevel.Warning;
          break;
      }

      return new Annotation(
        testResult.testName,
        0,
        0,
        0,
        0,
        testOutcome,
        testResult.testName,
        testResult.Output.StdOut,
        ''
      );
    }
  }

  private getResults(results: any): any[] {
    let unitTestResults: any = [];

    if (results.Results && results.Results.UnitTestResult) {
      const utrs = results.Results.UnitTestResult;

      if (Array.isArray(utrs)) {
        unitTestResults = unitTestResults.concat(utrs);
      } else {
        unitTestResults.push(utrs);
      }
    }

    return unitTestResults;
  }
}
