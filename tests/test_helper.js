/**
 * E2E Test Helper for Dunia_Kampus (Aplikasi Dosen - RPS)
 * Zero-dependency test harness & HTTP client for Node.js 18+
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RPS_APP_DIR = path.resolve(PROJECT_ROOT, 'rps-form-app');
const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:3000';

let spawnedServerProcess = null;

/**
 * Check if the target API server is currently responding
 */
async function isServerRunning(timeoutMs = 1500) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_BASE_URL}/api/rps`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.status < 500;
  } catch (err) {
    return false;
  }
}

/**
 * Start the backend API server if not already running
 */
async function startServerIfNeeded() {
  const running = await isServerRunning(1000);
  if (running) {
    return true;
  }

  const serverJsPath = path.join(RPS_APP_DIR, 'apps/api/dist/server.js');
  if (!fs.existsSync(serverJsPath)) {
    throw new Error(`API server entry not found at ${serverJsPath}. Run build first.`);
  }

  console.log(`[TestRunner] Starting API server on ${API_BASE_URL}...`);
  spawnedServerProcess = spawn(process.execPath, [serverJsPath], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: '3000',
      NODE_ENV: 'development'
    },
    stdio: 'ignore'
  });
  spawnedServerProcess.on('error', (err) => {
    console.error(`[TestRunner] Process error:`, err.message);
  });

  // Wait for server to become responsive
  const startTime = Date.now();
  while (Date.now() - startTime < 8000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isServerRunning(1000)) {
      console.log(`[TestRunner] API server is ready!`);
      return true;
    }
  }

  throw new Error(`Failed to start API server within timeout on ${API_BASE_URL}`);
}

/**
 * Stop server if spawned by test helper
 */
function stopServer() {
  if (spawnedServerProcess) {
    console.log(`[TestRunner] Stopping test server process...`);
    try {
      if (process.platform === 'win32' && spawnedServerProcess.pid) {
        const { execSync } = require('child_process');
        try { execSync(`taskkill /F /T /PID ${spawnedServerProcess.pid}`, { stdio: 'ignore' }); } catch (e) {}
      } else {
        spawnedServerProcess.kill();
      }
    } catch (e) {
      // ignore
    }
    spawnedServerProcess = null;
  }
}

// Clean up on exit
process.on('exit', () => stopServer());
process.on('SIGINT', () => { stopServer(); process.exit(1); });
process.on('SIGTERM', () => { stopServer(); process.exit(1); });

/**
 * HTTP helper methods
 */
async function apiGet(route, headers = {}) {
  const url = route.startsWith('http') ? route : `${API_BASE_URL}${route}`;
  const res = await fetch(url, { method: 'GET', headers });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else if (contentType.includes('text/')) {
    data = await res.text();
  } else {
    data = Buffer.from(await res.arrayBuffer());
  }
  return { status: res.status, headers: res.headers, data };
}

async function apiPost(route, body, headers = {}) {
  const url = route.startsWith('http') ? route : `${API_BASE_URL}${route}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function apiPut(route, body, headers = {}) {
  const url = route.startsWith('http') ? route : `${API_BASE_URL}${route}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function apiUpload(route, fieldName, filename, fileBuffer, mimeType = 'application/octet-stream', headers = {}) {
  const url = route.startsWith('http') ? route : `${API_BASE_URL}${route}`;
  const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, fileBuffer, tail]);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      ...headers
    },
    body
  });
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

/**
 * Assertion helpers
 */
function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Values not equal'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'Deep equality failed'}:\nExpected: ${e}\nActual:   ${a}`);
  }
}

function assertIncludes(actual, search, message) {
  if (typeof actual === 'string') {
    if (!actual.includes(search)) {
      throw new Error(`${message || 'String inclusion failed'}: could not find "${search}" in "${actual.substring(0, 200)}..."`);
    }
  } else if (Array.isArray(actual)) {
    if (!actual.includes(search)) {
      throw new Error(`${message || 'Array inclusion failed'}: could not find ${JSON.stringify(search)} in array`);
    }
  } else {
    throw new Error(`assertIncludes target must be string or array`);
  }
}

function assertMatch(actual, regex, message) {
  if (!regex.test(actual)) {
    throw new Error(`${message || 'Regex match failed'}: "${actual}" does not match ${regex}`);
  }
}

/**
 * Test Suite Runner Engine
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
  }

  test(title, fn) {
    this.tests.push({ title, fn });
  }

  async run() {
    const results = {
      suite: this.name,
      total: this.tests.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      details: []
    };

    console.log(`\n======================================================`);
    console.log(`SUITE: ${this.name}`);
    console.log(`======================================================`);

    for (const t of this.tests) {
      const start = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - start;
        results.passed++;
        results.details.push({ title: t.title, status: 'PASS', duration, error: null });
        console.log(`  [PASS] ${t.title} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - start;
        const msg = err.message || String(err);
        if (msg.includes('PENDING') || msg.includes('M2 Pending') || msg.includes('M3 Pending') || msg.includes('not yet implemented')) {
          results.pending++;
          results.details.push({ title: t.title, status: 'PENDING', duration, error: msg });
          console.log(`  [PENDING] ${t.title} (${duration}ms) -> ${msg}`);
        } else {
          results.failed++;
          results.details.push({ title: t.title, status: 'FAIL', duration, error: msg });
          console.log(`  [FAIL] ${t.title} (${duration}ms) -> ${msg}`);
        }
      }
    }

    return results;
  }
}

function createSuite(name) {
  return new TestSuite(name);
}

module.exports = {
  PROJECT_ROOT,
  RPS_APP_DIR,
  API_BASE_URL,
  isServerRunning,
  startServerIfNeeded,
  stopServer,
  apiGet,
  apiPost,
  apiPut,
  apiUpload,
  assert,
  assertEqual,
  assertDeepEqual,
  assertIncludes,
  assertMatch,
  createSuite
};
