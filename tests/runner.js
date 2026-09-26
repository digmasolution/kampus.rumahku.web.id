#!/usr/bin/env node
/**
 * Unified Test Runner for Dunia_Kampus (Aplikasi Dosen - RPS)
 * Executes Tier 1, 2, 3, and 4 test suites per TEST_INFRA.md
 *
 * Usage:
 *   node tests/runner.js
 *   node tests/runner.js --tier 1
 *   node tests/runner.js --tier 2
 *   node tests/runner.js --tier 3
 *   node tests/runner.js --tier 4
 *   node tests/runner.js --file tests/tier1_feature/test_rps_crud.js
 */

const fs = require('fs');
const path = require('path');
const { startServerIfNeeded, stopServer, isServerRunning, API_BASE_URL } = require('./test_helper');

const TIERS = {
  1: {
    name: 'Tier 1: Feature Coverage',
    dir: path.join(__dirname, 'tier1_feature'),
    files: [
      'test_rps_crud.js',
      'test_export_endpoints.js',
      'test_ai_dx_endpoints.js',
      'test_persistent_logs.js',
      'test_vps_scripts.js',
      'test_meeting_todo.js'
    ]
  },
  2: {
    name: 'Tier 2: Boundary & Corner Cases',
    dir: path.join(__dirname, 'tier2_boundary'),
    files: [
      'test_empty_boundary.js',
      'test_max_weight_boundary.js',
      'test_invalid_tokens.js',
      'test_injection_sanitization.js',
      'test_malformed_inputs.js'
    ]
  },
  3: {
    name: 'Tier 3: Cross-Feature Combinations',
    dir: path.join(__dirname, 'tier3_pairwise'),
    files: [
      'test_draft_export_flow.js',
      'test_ai_action_rps_sync.js',
      'test_deploy_package_contents.js'
    ]
  },
  4: {
    name: 'Tier 4: Real-World Workload Scenarios',
    dir: path.join(__dirname, 'tier4_workload'),
    files: [
      'test_end_to_end_lecturer_journey.js',
      'test_vps_isolation_and_live_http.js'
    ]
  }
};

async function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tier: null,
    file: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' && args[i + 1]) {
      options.tier = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Dunia_Kampus Unified Test Runner
--------------------------------
Commands:
  node tests/runner.js              Run all 4 tiers of tests
  node tests/runner.js --tier 1     Run only Tier 1 (Feature Coverage)
  node tests/runner.js --tier 2     Run only Tier 2 (Boundary & Corner Cases)
  node tests/runner.js --tier 3     Run only Tier 3 (Cross-Feature Combinations)
  node tests/runner.js --tier 4     Run only Tier 4 (Real-World Scenarios)
  node tests/runner.js --file <path> Run a single test file
  node tests/runner.js --help       Show this help message
`);
}

async function run() {
  const options = await parseArgs();
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`\n======================================================`);
  console.log(`  DUNIA_KAMPUS E2E TEST RUNNER (TEST TRACK)`);
  console.log(`  Target API: ${API_BASE_URL}`);
  console.log(`  Start Time: ${new Date().toISOString()}`);
  console.log(`======================================================`);

  // Auto-start backend server if needed
  try {
    await startServerIfNeeded();
  } catch (err) {
    console.warn(`[TestRunner] Warning: Could not auto-start API server: ${err.message}`);
    console.warn(`[TestRunner] Continuing with file-system & mock tests where applicable...`);
  }

  const allResults = [];
  const startTime = Date.now();

  // Determine which files to execute
  let filesToRun = [];

  if (options.file) {
    const resolved = path.isAbsolute(options.file) ? options.file : path.resolve(process.cwd(), options.file);
    if (!fs.existsSync(resolved)) {
      console.error(`Error: Test file not found at ${resolved}`);
      stopServer();
      process.exit(1);
    }
    filesToRun.push({ tierNum: 'Custom', filePath: resolved });
  } else if (options.tier) {
    const tierDef = TIERS[options.tier];
    if (!tierDef) {
      console.error(`Error: Invalid tier ${options.tier}. Choose 1, 2, 3, or 4.`);
      stopServer();
      process.exit(1);
    }
    for (const f of tierDef.files) {
      const fullPath = path.join(tierDef.dir, f);
      filesToRun.push({ tierNum: options.tier, filePath: fullPath });
    }
  } else {
    // Run all tiers 1 to 4
    for (const [tierNum, tierDef] of Object.entries(TIERS)) {
      for (const f of tierDef.files) {
        const fullPath = path.join(tierDef.dir, f);
        filesToRun.push({ tierNum, filePath: fullPath });
      }
    }
  }

  // Execute each test suite
  for (const item of filesToRun) {
    if (!fs.existsSync(item.filePath)) {
      console.log(`\n[TestRunner] Notice: Test suite not yet implemented at ${path.basename(item.filePath)}`);
      continue;
    }

    try {
      const suiteModule = require(item.filePath);
      if (typeof suiteModule.run === 'function') {
        const result = await suiteModule.run();
        allResults.push(result);
      } else {
        console.warn(`[TestRunner] ${path.basename(item.filePath)} does not export a run() function.`);
      }
    } catch (err) {
      console.error(`[TestRunner] Failed to execute ${path.basename(item.filePath)}:`, err);
      allResults.push({
        suite: path.basename(item.filePath),
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        pending: 0,
        details: [{ title: 'Suite Execution', status: 'FAIL', duration: 0, error: err.message }]
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Print Summary Table
  console.log(`\n\n======================================================`);
  console.log(`             TEST EXECUTION SUMMARY REPORT            `);
  console.log(`======================================================`);

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalPending = 0;

  for (const res of allResults) {
    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;
    totalPending += (res.pending || 0);

    const statusBadge = res.failed > 0 ? '[FAIL]' : (res.pending > 0 ? '[WARN]' : '[PASS]');
    console.log(` ${statusBadge} ${res.suite.padEnd(40)} Passed: ${res.passed}/${res.total} | Failed: ${res.failed} | Pending: ${res.pending || 0}`);
  }

  console.log(`------------------------------------------------------`);
  console.log(` Total Suites  : ${allResults.length}`);
  console.log(` Total Tests   : ${totalTests}`);
  console.log(` Passed        : ${totalPassed}`);
  console.log(` Failed        : ${totalFailed}`);
  console.log(` Pending/M-dep : ${totalPending}`);
  console.log(` Execution Time: ${totalDuration}ms`);
  console.log(` Completed At  : ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  stopServer();

  if (totalFailed > 0) {
    console.error(`\n❌ Test run finished with ${totalFailed} failure(s).\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ All verified tests PASSED successfully!\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(`Fatal Runner Error:`, err);
    stopServer();
    process.exit(1);
  });
}

module.exports = { run };
