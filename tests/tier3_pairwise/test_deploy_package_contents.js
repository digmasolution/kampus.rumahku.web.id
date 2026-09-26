/**
 * Tier 3: Cross-Feature Combinations - Deployment Package Inspection & SOP Compliance
 * Verifies web_build.zip packaging: ensures inclusion of essential runtime files,
 * strict exclusion of node_modules and sensitive files, and uncompressed manifest integrity.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('../../rps-form-app/node_modules/pizzip');
const {
  createSuite,
  assert,
  assertEqual,
  PROJECT_ROOT,
  RPS_APP_DIR
} = require('../test_helper');

const suite = createSuite('Tier 3: Deployment Packaging & SOP Verification');

// Test 1: Packaging script existence or web_build.zip artifact presence
suite.test('Deployment packaging mechanism must exist and be defined per SOP', async () => {
  const candidateArtifacts = [
    path.join(PROJECT_ROOT, 'web_build.zip'),
    path.join(RPS_APP_DIR, 'web_build.zip'),
    path.join(PROJECT_ROOT, 'scripts/package.js'),
    path.join(PROJECT_ROOT, 'deploy.ps1'),
    path.join(PROJECT_ROOT, 'deploy.sh')
  ];

  const found = candidateArtifacts.some(p => fs.existsSync(p));
  if (!found) {
    throw new Error('PENDING (M3 Pending): Neither web_build.zip nor packaging scripts exist yet');
  }

  assert(true);
});

// Test 2: If web_build.zip exists, inspect its archive contents
suite.test('web_build.zip archive must strictly exclude node_modules and include runtime code', async () => {
  const zipPath = [
    path.join(PROJECT_ROOT, 'web_build.zip'),
    path.join(RPS_APP_DIR, 'web_build.zip')
  ].find(p => fs.existsSync(p));

  if (!zipPath) {
    throw new Error('PENDING (M3 Pending): web_build.zip has not been compiled yet');
  }

  const zipBuffer = fs.readFileSync(zipPath);
  const zip = new PizZip(zipBuffer);

  const fileNames = Object.keys(zip.files);
  assert(fileNames.length > 0, 'web_build.zip must not be empty');

  // STRICT RULE ENFORCEMENT: node_modules MUST NOT be in the zip archive
  const hasNodeModules = fileNames.some(f => f.includes('node_modules/') || f.startsWith('node_modules/'));
  assert(!hasNodeModules, 'web_build.zip MUST NOT contain node_modules/ directory (Strict SOP)');

  // .git MUST NOT be in the zip archive
  const hasGit = fileNames.some(f => f.includes('.git/') || f.startsWith('.git/'));
  assert(!hasGit, 'web_build.zip MUST NOT contain .git/ directory');

  // Local .env MUST NOT be included (secrets protection)
  const hasLocalEnv = fileNames.some(f => f === '.env' || f.endsWith('/.env'));
  assert(!hasLocalEnv, 'web_build.zip MUST NOT bundle local .env file');

  // Ensure production assets exist
  const normalizedFileNames = fileNames.map(f => f.replace(/\\/g, '/'));
  const hasBackend = normalizedFileNames.some(f => f.includes('apps/api') || f.includes('dist/'));
  assert(hasBackend, 'web_build.zip must include backend API files');
});

// Test 3: Automated packaging script verification for SOP compliance
suite.test('Packaging instructions must explicitly target web_build.zip and exclude dev artifacts', async () => {
  const packageScript = path.join(PROJECT_ROOT, 'deploy.ps1');
  if (!fs.existsSync(packageScript)) {
    throw new Error('PENDING (M3 Pending): deploy.ps1 not found');
  }

  const scriptContent = fs.readFileSync(packageScript, 'utf-8');
  assert(
    scriptContent.includes('web_build.zip') || scriptContent.includes('.zip'),
    'deploy.ps1 must reference zip packaging'
  );
  assert(
    scriptContent.includes('node_modules') || scriptContent.includes('Exclude'),
    'deploy.ps1 must explicitly filter or exclude node_modules'
  );
});

async function run() {
  return await suite.run();
}

if (require.main === module) {
  run().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}

module.exports = { run };
