import * as github from '@actions/github';
import { Annotation } from './types/annotation';
import { TestResult } from './types/test-result';

function generateSummary(annotation: Annotation): string {
  return `* ${annotation.title}\n   ${annotation.message}`;
}

export async function uploadResults(
  accessToken: string,
  title: string,
  numFailures: number,
  results: TestResult
): Promise<void> {
  const octokit = github.getOctokit(accessToken);

  const summary =
    results.resultCounts.failed > 0
      ? `${results.resultCounts.failed} tests failed`
      : `${results.resultCounts.passed} tests passed`;

  let details =
    results.resultCounts.failed === 0
      ? `**${results.resultCounts.total} total tests**
** ${results.resultCounts.passed} tests passed**`
      : `
**${results.resultCounts.total} total tests**
**${results.resultCounts.passed} tests passed**
**${results.resultCounts.failed} tests failed**
`;

  for (const ann of results.annotations) {
    const annStr = generateSummary(ann);
    const newDetails = `${details}\n${annStr}`;
    if (newDetails.length > 65000) {
      details = `${details}\n\n ... and more.`;
      break;
    } else {
      details = newDetails;
    }
  }

  const context = github.context;
  const pr = context.payload.pull_request;
  await octokit.rest.checks.create({
    head_sha: (pr && pr['head'] && pr['head'].sha) || context.sha,
    name: title,
    owner: context.repo.owner,
    repo: context.repo.repo,
    status: 'completed',
    conclusion:
      results.resultCounts.failed > 0 || results.resultCounts.passed === 0
        ? 'failure'
        : 'success',
    output: {
      title,
      summary,
      annotations: results.annotations.slice(0, numFailures),
      text: details,
    },
  });
}
