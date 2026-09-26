/**
 * Milestone 3 Adversarial & Critic Stress Test Suite
 * Evaluates:
 * 1. agents.md Central Command Index integrity and Golden Rules completeness
 * 2. Context Compression & Issue-to-Fix persistence and edge-case handling
 * 3. Deployment Packaging integrity (zip slip resistance, secret exclusion)
 * 4. VPS Multi-Tenant Isolation boundaries (zero foreign tenant interference)
 * 5. Live Remote VPS HTTP reachability via standard Node http.request
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const PizZip = require('../../rps-form-app/node_modules/pizzip');
const {
  createSuite,
  assert,
  assertEqual,
  assertIncludes,
  PROJECT_ROOT,
  RPS_APP_DIR
} = require('../test_helper');

const suite = createSuite('Adversarial & Critic Suite: Milestone 3 Deep Stress Tests');

// -------------------------------------------------------------
// SECTION 1: agents.md Central Command Index Completeness
// -------------------------------------------------------------
suite.test('agents.md must strictly include all mandatory Golden Rules & Navigation sections', async () => {
  const agentsMdPath = path.join(PROJECT_ROOT, 'agents.md');
  assert(fs.existsSync(agentsMdPath), 'agents.md must exist at repository root');

  const content = fs.readFileSync(agentsMdPath, 'utf-8');

  // Rule 1: Prevent God Code (SRP & Modularity)
  assertIncludes(content, 'Rule 1: Prevent "God Code"', 'Must define Rule 1: Prevent God Code');
  assertIncludes(content, 'SRP', 'Rule 1 must enforce SRP');
  assertIncludes(content, 'apps/api/src/routes/', 'Must document route structure');
  assertIncludes(content, 'apps/api/src/controllers/', 'Must document controller structure');
  assertIncludes(content, 'apps/api/src/services/', 'Must document service structure');

  // Rule 2: Prevent Backdoors & Security Debt
  assertIncludes(content, 'Rule 2: Prevent Backdoors', 'Must define Rule 2: Prevent Backdoors');
  assertIncludes(content, 'Zero hardcoded bypasses', 'Must mandate zero hardcoded bypasses');
  assertIncludes(content, 'Input Sanitization', 'Must mandate input sanitization');

  // Rule 3: Safe VPS Deployment (Zip & Extract SOP)
  assertIncludes(content, 'Rule 3: Safe VPS Deployment', 'Must define Rule 3: Safe VPS Deployment');
  assertIncludes(content, 'HINDARI `scp -r`', 'Must enforce HINDARI scp -r');
  assertIncludes(content, 'WAJIB KOMPRESI', 'Must enforce WAJIB KOMPRESI');
  assertIncludes(content, '/var/www/kampus-dosen', 'Must enforce isolated root directory');

  // Rule 4: Database & PDO Safety
  assertIncludes(content, 'Rule 4: Database & PDO Safety', 'Must define Rule 4: PDO Safety');
  assertIncludes(content, 'Named Parameter Safety', 'Must enforce named parameter uniqueness');

  // Rule 5: Cross-Platform & Pipe Deadlock Prevention
  assertIncludes(content, 'Rule 5: Cross-Platform & Pipe Deadlock Prevention', 'Must define Rule 5');
  assertIncludes(content, 'WSL-to-Windows Pipe Rule', 'Must enforce pipe deadlock prevention');
  assertIncludes(content, 'No PowerShell UTF-8 BOM', 'Must enforce UTF-8 BOM prohibition');

  // Quick Reference Index / Anti-Lost-in-the-Middle
  assertIncludes(content, 'Quick Reference Index', 'Must provide quick reference index');
  assertIncludes(content, 'node tests/runner.js', 'Must include test runner commands');
});

// -------------------------------------------------------------
// SECTION 2: Context Compression & Issue-to-Fix Persistence
// -------------------------------------------------------------
suite.test('LearningService must reject issue fix with missing mandatory fields', async () => {
  const { learningService } = require('../../rps-form-app/apps/api/dist/services/learning.service');

  // Missing rootCause
  let threw = false;
  try {
    await learningService.recordIssueFix({
      issueTitle: 'Test Issue',
      technicalFix: 'Fixed something'
      // rootCause omitted
    });
  } catch (err) {
    threw = true;
    assertIncludes(err.message, 'rootCause', 'Error message must cite missing rootCause');
  }
  assert(threw, 'recordIssueFix must reject missing rootCause');

  // Missing technicalFix
  threw = false;
  try {
    await learningService.recordIssueFix({
      issueTitle: 'Test Issue',
      rootCause: 'Root cause here'
      // technicalFix omitted
    });
  } catch (err) {
    threw = true;
    assertIncludes(err.message, 'technicalFix', 'Error message must cite missing technicalFix');
  }
  assert(threw, 'recordIssueFix must reject missing technicalFix');
});

suite.test('LearningService must handle malformed JSONL gracefully during summaries read', async () => {
  const { learningService } = require('../../rps-form-app/apps/api/dist/services/learning.service');
  const jsonlPath = path.join(RPS_APP_DIR, 'storage/logs/issue-fix-summary.jsonl');

  assert(fs.existsSync(jsonlPath), 'issue-fix-summary.jsonl must exist');

  // Temporarily append a corrupted non-JSON line
  const originalContent = fs.readFileSync(jsonlPath, 'utf-8');
  try {
    fs.appendFileSync(jsonlPath, 'CORRUPTED_RAW_TEXT_NOT_JSON\n', 'utf-8');

    // getIssueFixSummaries should NOT throw; it must skip corrupted line
    const summaries = await learningService.getIssueFixSummaries();
    assert(Array.isArray(summaries), 'Summaries must return array');
    assert(summaries.length > 0, 'Summaries must parse valid entries despite malformed line');
  } finally {
    // Restore original file
    fs.writeFileSync(jsonlPath, originalContent, 'utf-8');
  }
});

// -------------------------------------------------------------
// SECTION 3: Deployment Packaging Deep Security Audit
// -------------------------------------------------------------
suite.test('web_build.zip must not contain path traversal (zip slip) entries or secret leaks', async () => {
  const zipPath = path.join(PROJECT_ROOT, 'web_build.zip');
  assert(fs.existsSync(zipPath), 'web_build.zip must exist');

  const zipBuffer = fs.readFileSync(zipPath);
  const zip = new PizZip(zipBuffer);
  const entries = Object.keys(zip.files);

  // Check for zip slip / directory traversal attempts in file names
  for (const entry of entries) {
    assert(!entry.includes('../') && !entry.includes('..\\'), `Entry ${entry} contains directory traversal sequence`);
    assert(!path.isAbsolute(entry), `Entry ${entry} must be relative, not absolute`);
  }

  // Check for sensitive files
  const forbiddenPatterns = [
    /\.env($|\.)/,
    /\.git($|\/)/,
    /id_rsa/,
    /id_ed25519/,
    /\.pem$/,
    /\.key$/,
    /node_modules/
  ];

  for (const entry of entries) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(entry), `Entry ${entry} matches forbidden security pattern ${pattern}`);
    }
  }
});

// -------------------------------------------------------------
// SECTION 4: Multi-Tenant VPS Isolation Verification
// -------------------------------------------------------------
suite.test('kampus.conf and kampus-api.service must never reference neighboring tenant paths', async () => {
  const confPath = path.join(PROJECT_ROOT, 'kampus.conf');
  const servicePath = path.join(PROJECT_ROOT, 'kampus-api.service');

  const conf = fs.readFileSync(confPath, 'utf-8');
  const service = fs.readFileSync(servicePath, 'utf-8');

  const foreignTenants = ['syukran', 'arabiq', 'uncm'];

  for (const tenant of foreignTenants) {
    assert(!conf.toLowerCase().includes(tenant), `kampus.conf must not reference foreign tenant: ${tenant}`);
    assert(!service.toLowerCase().includes(tenant), `kampus-api.service must not reference foreign tenant: ${tenant}`);
  }

  // Verify dedicated non-colliding port
  assertIncludes(conf, '3005', 'kampus.conf must proxy to port 3005');
  assertIncludes(service, 'PORT=3005', 'kampus-api.service must bind to PORT=3005');
});

// -------------------------------------------------------------
// SECTION 5: Live Remote VPS Online Reachability Probe
// -------------------------------------------------------------
suite.test('Remote VPS (38.103.170.236) must respond with HTTP 200 via http.request Host header', async () => {
  const checkEndpoint = (pathName) => {
    return new Promise((resolve) => {
      const req = http.request(
        {
          host: '38.103.170.236',
          port: 80,
          path: pathName,
          headers: {
            'Host': 'kampus.rumahku.web.id',
            'User-Agent': 'Critic-Verifier/1.0'
          },
          timeout: 5000
        },
        (res) => {
          resolve({ status: res.statusCode, ok: res.statusCode === 200 });
        }
      );
      req.on('error', (err) => {
        resolve({ status: 0, ok: false, error: err.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, ok: false, error: 'timeout' });
      });
      req.end();
    });
  };

  const rootCheck = await checkEndpoint('/');
  const apiCheck = await checkEndpoint('/api/rps');
  const fixCheck = await checkEndpoint('/fix_server.php');

  console.log(`    [Live VPS Probes] / -> HTTP ${rootCheck.status} | /api/rps -> HTTP ${apiCheck.status} | /fix_server.php -> HTTP ${fixCheck.status}`);

  assertEqual(rootCheck.status, 200, 'Live VPS root SPA must return HTTP 200');
  assertEqual(apiCheck.status, 200, 'Live VPS API proxy must return HTTP 200');
  assertEqual(fixCheck.status, 200, 'Live VPS fix_server.php recovery script must return HTTP 200');
});

async function run() {
  return await suite.run();
}

if (require.main === module) {
  run().then((res) => {
    if (res.failed > 0) process.exit(1);
  });
}

module.exports = { run };
