/**
 * Tier 1: Feature Coverage - VPS Deployment Scripts & Multi-Tenant Configs
 * Verifies deploy.ps1, deploy.sh, fix_server.php, Apache kampus.conf, and systemd service.
 * Enforces User Rule 3 (No `scp -r`, local zip compression, remote `unzip -o`).
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

const suite = createSuite('Tier 1: VPS Deployment Scripts & Configs');

// Test 1: deploy.ps1 Script Validation
suite.test('deploy.ps1 must exist, target 38.103.170.236, prohibit scp -r, and use zip + unzip -o', async () => {
  const ps1Path = path.join(PROJECT_ROOT, 'deploy.ps1');

  if (!fs.existsSync(ps1Path)) {
    throw new Error('PENDING (M3 Pending): deploy.ps1 has not been created yet');
  }

  const content = fs.readFileSync(ps1Path, 'utf-8');
  assertIncludes(content, '38.103.170.236', 'deploy.ps1 must target VPS IP 38.103.170.236');
  assertIncludes(content, 'kampus', 'deploy.ps1 must reference the kampus project directory/domain');

  // CRITICAL USER RULE 3 ENFORCEMENT:
  assert(!content.includes('scp -r'), 'deploy.ps1 MUST NOT use scp -r (Strict User SOP Rule 3)');
  assert(
    content.includes('zip') || content.includes('Compress-Archive') || content.includes('web_build.zip'),
    'deploy.ps1 must use local archive compression (web_build.zip)'
  );
  assert(
    content.includes('unzip -o') || content.includes('unzip'),
    'deploy.ps1 must use unzip -o on server'
  );
});

// Test 2: deploy.sh Script Validation
suite.test('deploy.sh must exist, be bash compliant, prohibit scp -r, and use unzip -o', async () => {
  const shPath = path.join(PROJECT_ROOT, 'deploy.sh');

  if (!fs.existsSync(shPath)) {
    throw new Error('PENDING (M3 Pending): deploy.sh has not been created yet');
  }

  const content = fs.readFileSync(shPath, 'utf-8');
  assert(content.startsWith('#!/bin/bash') || content.startsWith('#!/bin/sh'), 'deploy.sh must have a valid shebang');
  assertIncludes(content, '38.103.170.236', 'deploy.sh must target VPS IP 38.103.170.236');

  // CRITICAL USER RULE 3 ENFORCEMENT:
  assert(!content.includes('scp -r'), 'deploy.sh MUST NOT use scp -r (Strict User SOP Rule 3)');
  assert(content.includes('unzip -o'), 'deploy.sh must use unzip -o for safe server extraction');
});

// Test 3: fix_server.php Fallback Script Validation
suite.test('fix_server.php must exist and provide 1-click self-extracting / fixing HTTP recovery', async () => {
  const phpPath = path.join(PROJECT_ROOT, 'fix_server.php');

  if (!fs.existsSync(phpPath)) {
    throw new Error('PENDING (M3 Pending): fix_server.php has not been created yet');
  }

  const content = fs.readFileSync(phpPath, 'utf-8');
  assert(content.includes('<?php'), 'fix_server.php must be valid PHP');
  assert(
    content.includes('unzip') || content.includes('ZipArchive'),
    'fix_server.php must contain zip extraction recovery logic'
  );
  assert(
    content.includes('kampus') || content.includes('/var/www'),
    'fix_server.php must target isolated directory'
  );
});

// Test 4: Apache VirtualHost Config (kampus.conf) Validation
suite.test('Apache configuration kampus.conf must configure domain and reverse proxy port 3005', async () => {
  // Check candidate locations for kampus.conf
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'kampus.conf'),
    path.join(PROJECT_ROOT, 'scripts/kampus.conf'),
    path.join(PROJECT_ROOT, 'rps-form-app/scripts/kampus.conf'),
    path.join(PROJECT_ROOT, 'docs/kampus.conf')
  ];

  const foundPath = candidatePaths.find(p => fs.existsSync(p));
  if (!foundPath) {
    throw new Error('PENDING (M3 Pending): kampus.conf Apache configuration not found');
  }

  const content = fs.readFileSync(foundPath, 'utf-8');
  assertIncludes(content, 'kampus.rumahku.web.id', 'kampus.conf must configure ServerName kampus.rumahku.web.id');
  assertIncludes(content, '3005', 'kampus.conf must reverse proxy API requests to Node.js port 3005');
  assertIncludes(content, '/var/www/kampus-dosen', 'kampus.conf must strictly isolate root to /var/www/kampus-dosen');
});

// Test 5: Systemd Unit (kampus-api.service) Validation
suite.test('Systemd service unit kampus-api.service must configure Node.js daemon', async () => {
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'kampus-api.service'),
    path.join(PROJECT_ROOT, 'scripts/kampus-api.service'),
    path.join(PROJECT_ROOT, 'rps-form-app/scripts/kampus-api.service'),
    path.join(PROJECT_ROOT, 'docs/kampus-api.service')
  ];

  const foundPath = candidatePaths.find(p => fs.existsSync(p));
  if (!foundPath) {
    throw new Error('PENDING (M3 Pending): kampus-api.service unit file not found');
  }

  const content = fs.readFileSync(foundPath, 'utf-8');
  assertIncludes(content, '[Unit]', 'Service unit must have [Unit] section');
  assertIncludes(content, '[Service]', 'Service unit must have [Service] section');
  assertIncludes(content, 'node', 'Service unit ExecStart must invoke node');
  assertIncludes(content, '3005', 'Service unit environment must define PORT=3005');
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
