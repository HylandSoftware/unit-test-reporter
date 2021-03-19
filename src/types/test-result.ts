import { Annotation } from './annotation';

export class TestResult {
  constructor(
    readonly resultCounts: TestResultCounts,
    readonly totalduration: number,
    readonly annotations: Annotation[]
  ) {}

  merge(testResult: TestResult): TestResult {
    return new TestResult(
      this.resultCounts.merge(testResult.resultCounts),
      this.totalduration + testResult.totalduration,
      this.annotations.concat(testResult.annotations)
    );
  }
}

export class TestResultCounts {
  constructor(
    readonly total: number,
    readonly passed: number,
    readonly warning: number,
    readonly skipped: number,
    readonly failed: number,
    readonly timeout: number
  ) {}

  merge(testResultCounts: TestResultCounts): TestResultCounts {
    return new TestResultCounts(
      this.total + testResultCounts.total,
      this.passed + testResultCounts.passed,
      this.warning + testResultCounts.warning,
      this.skipped + testResultCounts.skipped,
      this.failed + testResultCounts.failed,
      this.timeout + testResultCounts.timeout
    );
  }
}
