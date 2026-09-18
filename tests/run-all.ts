// Master Test Runner for Local Brain Test Suite
import { TestSuiteRunner } from './helpers.ts';
import { runApiE2ETests } from './e2e-api.test.ts';
import { runLocalEngineTests } from './local-engine.test.ts';
import { runVersioningTests } from './versioning-and-state.test.ts';
import { runUiUxTests } from './ui-ux-flow.test.ts';
import { runLivingWikiTests } from './wiki-living-engine.test.ts';

async function main() {
  console.log('\n\x1b[1m\x1b[36m=======================================================');
  console.log('   LOCAL BRAIN DESKTOP — COMPREHENSIVE TEST SUITE');
  console.log('=======================================================\x1b[0m\n');

  const runner = new TestSuiteRunner();
  const startTime = Date.now();

  try {
    console.log('\x1b[1m\x1b[34m[1/5] Running Backend API E2E Tests...\x1b[0m');
    await runApiE2ETests(runner);

    console.log('\n\x1b[1m\x1b[34m[2/5] Running Local Intelligence Engine & Hybrid Search Tests...\x1b[0m');
    await runLocalEngineTests(runner);

    console.log('\n\x1b[1m\x1b[34m[3/5] Running Document Versioning & State Integrity Tests...\x1b[0m');
    await runVersioningTests(runner);

    console.log('\n\x1b[1m\x1b[34m[4/5] Running UI/UX Formats & Workflow Verification Tests...\x1b[0m');
    await runUiUxTests(runner);

    console.log('\n\x1b[1m\x1b[34m[5/5] Running Living Personal Wiki & Knowledge Vault Tests...\x1b[0m');
    await runLivingWikiTests(runner);
  } catch (fatalErr: any) {
    console.error('\n\x1b[31mFatal test suite error:\x1b[0m', fatalErr);
  }

  const totalTime = Date.now() - startTime;
  const passed = runner.results.filter((r) => r.passed).length;
  const failed = runner.results.filter((r) => !r.passed).length;
  const total = runner.results.length;

  console.log('\n\x1b[1m\x1b[36m=======================================================');
  console.log('   TEST EXECUTION SUMMARY');
  console.log('=======================================================\x1b[0m');
  console.log(`Total Tests:  ${total}`);
  console.log(`Passed:       \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed:       ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`Duration:     ${totalTime}ms\n`);

  if (failed > 0) {
    console.log('\x1b[31mFailed Tests Details:\x1b[0m');
    runner.results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`- [${r.suite}] ${r.name}: ${r.error?.message || r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ ALL SUITES PASSED CLEANLY!\x1b[0m\n');
    process.exit(0);
  }
}

main();
