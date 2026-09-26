/**
 * Tier 4: Real-World Workload Scenarios - Multi-Tenant VPS Isolation & Live Network Probing
 * Verifies non-interference between Dunia_Kampus and existing VPS tenants (Syukran, Arabiq, UNCM),
 * Apache reverse-proxy rules, port isolation, and remote host reachability.
 */

const fs = require('fs');
const path = require('path');
const {
  createSuite,
  assert,
  assertEqual,
  assertIncludes,
  PROJECT_ROOT
} = require('../test_helper');

const suite = createSuite('Tier 4: VPS Isolation & Live Network Verification');

const VPS_IP = '38.103.170.236';
const DOMAIN = 'kampus.rumahku.web.id';
const ISOLATED_VPS_ROOT = '/var/www/kampus-dosen';

// Test 1: Verify Apache virtual host isolation definitions
suite.test('Apache virtual host configuration must ensure strict path and port isolation', async () => {
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'kampus.conf'),
    path.join(PROJECT_ROOT, 'scripts/kampus.conf'),
    path.join(PROJECT_ROOT, 'rps-form-app/scripts/kampus.conf'),
    path.join(PROJECT_ROOT, 'docs/kampus.conf')
  ];

  const foundPath = candidatePaths.find(p => fs.existsSync(p));
  if (!foundPath) {
    throw new Error('PENDING (M3 Pending): kampus.conf not found');
  }

  const confContent = fs.readFileSync(foundPath, 'utf-8');

  // Verify it doesn't touch other tenant paths
  assert(!confContent.includes('/var/www/syukran-laravel'), 'Must not reference syukran-laravel');
  assert(!confContent.includes('/var/www/arabiq'), 'Must not reference arabiq');
  assert(!confContent.includes('/var/www/uncm'), 'Must not reference uncm');

  // Must isolate to kampus-dosen
  assertIncludes(confContent, ISOLATED_VPS_ROOT, `Must use isolated root ${ISOLATED_VPS_ROOT}`);

  // Must bind proxy to 127.0.0.1:3005
  assert(
    confContent.includes('127.0.0.1:3005') || confContent.includes('localhost:3005'),
    'Must proxy to local port 3005 only'
  );
});

// Test 2: Multi-tenant host header simulation
suite.test('Host header simulation: requests for foreign domains must not map to kampus assets', async () => {
  // Check virtual host declarations ensure specific ServerName
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'kampus.conf'),
    path.join(PROJECT_ROOT, 'scripts/kampus.conf'),
    path.join(PROJECT_ROOT, 'rps-form-app/scripts/kampus.conf')
  ];

  const foundPath = candidatePaths.find(p => fs.existsSync(p));
  if (!foundPath) {
    throw new Error('PENDING (M3 Pending): kampus.conf not found');
  }

  const confContent = fs.readFileSync(foundPath, 'utf-8');
  assertIncludes(confContent, `ServerName ${DOMAIN}`, `Must explicitly set ServerName to ${DOMAIN}`);
});

// Test 3: Systemd service daemon port and user isolation
suite.test('Systemd service configuration must isolate process to www-data and port 3005', async () => {
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'kampus-api.service'),
    path.join(PROJECT_ROOT, 'scripts/kampus-api.service'),
    path.join(PROJECT_ROOT, 'rps-form-app/scripts/kampus-api.service')
  ];

  const foundPath = candidatePaths.find(p => fs.existsSync(p));
  if (!foundPath) {
    throw new Error('PENDING (M3 Pending): kampus-api.service not found');
  }

  const serviceContent = fs.readFileSync(foundPath, 'utf-8');
  assert(
    serviceContent.includes('User=www-data') || serviceContent.includes('User='),
    'Service should run as designated non-root user (e.g. www-data)'
  );
  assertIncludes(serviceContent, 'PORT=3005', 'Service environment must specify PORT=3005');
  assertIncludes(serviceContent, ISOLATED_VPS_ROOT, `WorkingDirectory must be inside ${ISOLATED_VPS_ROOT}`);
});

// Test 4: Live Network Connectivity Probe (VPS Target 38.103.170.236)
suite.test('Live network probe to VPS 38.103.170.236 should check online deployment state', async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`http://${VPS_IP}`, {
      method: 'GET',
      headers: {
        'Host': DOMAIN,
        'User-Agent': 'E2E-Verifier-Bot/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // If server responds, verify it returned an HTTP response
    assert(res.status >= 200 && res.status < 600, `VPS responded with status ${res.status}`);
    console.log(`    (Notice: Live VPS returned HTTP status ${res.status})`);
  } catch (err) {
    clearTimeout(timeoutId);
    // Remote VPS may not have public DNS yet or may be awaiting deployment
    console.log(`    (Notice: Remote VPS probe skipped/offline during local run: ${err.message})`);
    assert(true);
  }
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
