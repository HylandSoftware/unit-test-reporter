import { setFailed, getInput } from '@actions/core';
import nunitParser from './parsers/nunit';
import junitParser from './parsers/junit';
import { uploadResults } from './github';
import { UnitTestResultParser } from './parsers/parser';
import trxParser from './parsers/trx';

async function run(): Promise<void> {
  try {
    const path = getInput('path');
    const numFailures = parseInt(getInput('numFailures'));
    const accessToken = getInput('access-token');
    const title = getInput('report-title');
    const reportType = getInput('reportType');

    let parser: UnitTestResultParser | null = null;
    switch (reportType) {
      case 'nunit':
        parser = new nunitParser();
        break;
      case 'junit':
        parser = new junitParser();
        break;
      case 'trx':
        parser = new trxParser();
        break;
      default:
        setFailed(
          `Unknown report type ${reportType}.  Types 'nunit' are supported`
        );
        break;
    }

    if (parser != null) {
      const results = await parser.readResults(path);
      uploadResults(accessToken, title, numFailures, results);
    }
  } catch (error: any) {
    setFailed(error.message);
  }
}

run();
