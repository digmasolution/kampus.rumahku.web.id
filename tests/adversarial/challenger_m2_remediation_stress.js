/**
 * Milestone 2 Remediation Adversarial Stress Test Harness
 * Author: Challenger M2 Remediation (challenger_m2_2)
 *
 * Objectives:
 * 1. Missing headers in agent requests (auth, content-type, trace-id, agent metadata)
 * 2. Large or malformed payloads to /api/v1/ai/actions/execute (syntax, primitives, boundaries, 11MB payload)
 * 3. Repeated execution of system.run_doctor to verify consistency (50 sequential, 20 concurrent, state isolation)
 */

const path = require('path');
process.env.NODE_PATH = path.resolve(__dirname, '../../rps-form-app/node_modules');
require('module').Module._initPaths();

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

// Enforce test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3007';
process.env.CORS_ORIGIN = 'http://localhost:5173,https://kampus.rumahku.web.id';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const RPS_APP_DIR = path.resolve(PROJECT_ROOT, 'rps-form-app');
process.env.DATABASE_URL = `file:${path.resolve(RPS_APP_DIR, 'prisma/dev.db')}`;

const appModule = require('../../rps-form-app/apps/api/dist/server');
const app = appModule.default || appModule;
const { prisma } = require('../../rps-form-app/apps/api/dist/services/rps.service');
const { aiService } = require('../../rps-form-app/apps/api/dist/services/ai.service');
const express = require(path.join(RPS_APP_DIR, 'node_modules/express'));

let server;
let serverPort;
let baseUrl;

const VALID_DEV_KEY = 'kampus-ai-agent-key-dev';
const logDir = path.join(RPS_APP_DIR, 'storage/logs');
const agentLogPath = path.join(logDir, 'ai-agent.jsonl');
const errorLogPath = path.join(logDir, 'ai-errors.jsonl');

function startTestServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      baseUrl = `http://127.0.0.1:${serverPort}`;
      console.log(`[Challenger M2 Remediation] Ephemeral test server active at ${baseUrl}`);
      resolve();
    });
  });
}

function stopTestServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[Challenger M2 Remediation] Test server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function request(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let payload = null;
    if (body !== null && typeof body === 'object' && !(body instanceof Buffer)) {
      payload = JSON.stringify(body);
      if (!('Content-Type' in options.headers) && !('content-type' in options.headers)) {
        options.headers['Content-Type'] = 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (typeof body === 'string') {
      payload = body;
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (body instanceof Buffer) {
      payload = body;
      options.headers['Content-Length'] = payload.length;
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(rawBuffer.toString('utf8'));
          } catch (e) {
            parsed = rawBuffer.toString('utf8');
          }
        } else {
          parsed = rawBuffer.toString('utf8');
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBuffer,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runRemediationStressSuite() {
  console.log('========================================================================');
  console.log('CHALLENGER M2 REMEDIATION: EMPIRICAL STRESS & EDGE-CASE HARNESS');
  console.log('Targets: Missing Headers, Malformed/Large Payloads, Repeated Doctor Runs');
  console.log('========================================================================\n');

  await startTestServer();

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(title, ok, detail = '') {
    if (ok) {
      passed++;
      testResults.push({ title, status: 'PASS', detail });
      console.log(`  [✓ PASS] ${title}${detail ? ' (' + detail + ')' : ''}`);
    } else {
      failed++;
      testResults.push({ title, status: 'FAIL', detail });
      console.error(`  [✗ FAIL] ${title}: ${detail}`);
    }
  }

  try {
    // =========================================================================
    // SECTION 1: MISSING HEADERS IN AGENT REQUESTS
    // =========================================================================
    console.log('--- SECTION 1: MISSING HEADERS IN AGENT REQUESTS ---');

    const aiEndpoints = [
      { method: 'GET', path: '/api/v1/ai/context' },
      { method: 'GET', path: '/api/v1/ai/context/rps/fake-uuid' },
      { method: 'GET', path: '/api/v1/ai/actions/catalog' },
      { method: 'POST', path: '/api/v1/ai/actions/execute', body: { action: 'system.ping' } },
      { method: 'GET', path: '/api/v1/ai/learning/rules' },
      { method: 'POST', path: '/api/v1/ai/learning/rules', body: { ruleCode: 'TEST', title: 'T', ruleContent: 'C', category: 'TEST' } },
      { method: 'POST', path: '/api/v1/ai/learning/feedback', body: { agentId: 'test', feedbackType: 'CRITIQUE', targetType: 'RPS_STRUCTURE', content: 'C' } },
      { method: 'GET', path: '/api/v1/ai/history' },
      { method: 'GET', path: '/api/v1/ai/errors' },
    ];

    for (const ep of aiEndpoints) {
      const res = await request(ep.method, ep.path, ep.body || null);
      record(
        `Reject unauthenticated request without headers to ${ep.method} ${ep.path} with HTTP 401`,
        res.status === 401 && res.body && res.body.success === false,
        `Status ${res.status}`
      );
    }

    // 1.2 Auth Header Variants & Incomplete Formats
    {
      const res1 = await request('GET', '/api/v1/ai/context', null, { Authorization: '' });
      record('Empty Authorization header rejected with 401', res1.status === 401, `Status ${res1.status}`);

      const res2 = await request('GET', '/api/v1/ai/context', null, { Authorization: 'Bearer' });
      record('Authorization Bearer without token rejected with 401', res2.status === 401, `Status ${res2.status}`);

      const res3 = await request('GET', '/api/v1/ai/context', null, { Authorization: 'Bearer    ' });
      record('Authorization Bearer with whitespace-only token rejected with 401', res3.status === 401, `Status ${res3.status}`);

      const res4 = await request('GET', '/api/v1/ai/context', null, { Authorization: 'Basic dXNlcjpwYXNz' });
      record('Non-Bearer Authorization (Basic) rejected with 401', res4.status === 401, `Status ${res4.status}`);

      const res5 = await request('GET', '/api/v1/ai/context', null, { 'X-Agent-Key': '   ' });
      record('Whitespace-only X-Agent-Key rejected with 401', res5.status === 401, `Status ${res5.status}`);
    }

    // 1.3 Case Insensitivity of Headers
    {
      const resUpper = await request('GET', '/api/v1/ai/context', null, { 'X-AGENT-KEY': VALID_DEV_KEY });
      const resLower = await request('GET', '/api/v1/ai/context', null, { 'x-agent-key': VALID_DEV_KEY });
      record(
        'Header case insensitivity: X-AGENT-KEY and x-agent-key accepted with HTTP 200',
        resUpper.status === 200 && resLower.status === 200,
        `Upper: ${resUpper.status}, Lower: ${resLower.status}`
      );
    }

    // 1.4 Missing Content-Type Header on POST /actions/execute
    {
      // Missing Content-Type header with JSON body string
      const resNoCt = await request('POST', '/api/v1/ai/actions/execute', '{"action":"system.ping"}', {
        'X-Agent-Key': VALID_DEV_KEY,
        // Intentionally no Content-Type
      });
      record(
        'Missing Content-Type header on POST /actions/execute handled safely without crash',
        resNoCt.status === 400 || resNoCt.status === 200,
        `Status ${resNoCt.status}`
      );

      // Non-JSON Content-Type (text/plain)
      const resTextCt = await request('POST', '/api/v1/ai/actions/execute', '{"action":"system.ping"}', {
        'X-Agent-Key': VALID_DEV_KEY,
        'Content-Type': 'text/plain',
      });
      record(
        'text/plain Content-Type on POST /actions/execute handled safely without crash',
        resTextCt.status === 400,
        `Status ${resTextCt.status}`
      );
    }

    // 1.5 Missing Trace ID Header (Auto-generation Verification)
    {
      const resAutoTrace = await request('POST', '/api/v1/ai/actions/execute', { action: 'system.ping' }, {
        'X-Agent-Key': VALID_DEV_KEY,
        // No X-Trace-Id or X-Correlation-Id
      });
      const isValidUuid = typeof resAutoTrace.body?.traceId === 'string' && resAutoTrace.body.traceId.length > 10;
      record(
        'Missing Trace ID header: Middleware generates valid traceId and returns it in response',
        resAutoTrace.status === 200 && isValidUuid,
        `Generated traceId: ${resAutoTrace.body?.traceId}`
      );
    }

    // 1.6 Missing Agent Metadata Headers (Fallback Verification)
    {
      const resNoMetadata = await request('POST', '/api/v1/ai/actions/execute', { action: 'system.ping' }, {
        'X-Agent-Key': VALID_DEV_KEY,
        // No X-Agent-Id, X-Agent-Name, X-Agent-Platform
      });
      record(
        'Missing Agent Metadata headers (X-Agent-Id, X-Agent-Name) defaults safely without crash',
        resNoMetadata.status === 200 && resNoMetadata.body?.success === true,
        `Status ${resNoMetadata.status}`
      );
    }

    // =========================================================================
    // SECTION 2: LARGE OR MALFORMED PAYLOADS TO /api/v1/ai/actions/execute
    // =========================================================================
    console.log('\n--- SECTION 2: LARGE OR MALFORMED PAYLOADS ---');

    // 2.1 Zero-byte / Empty Body
    {
      const resEmpty = await request('POST', '/api/v1/ai/actions/execute', '', {
        'X-Agent-Key': VALID_DEV_KEY,
        'Content-Type': 'application/json',
      });
      record(
        'Empty body (0 bytes) returns HTTP 400 without crash',
        resEmpty.status === 400 && resEmpty.body?.success === false,
        `Status ${resEmpty.status}`
      );
    }

    // 2.2 Malformed JSON Syntax
    {
      const brokenJson = '{"action": "system.ping", "parameters": { unclosed';
      const resBroken = await request('POST', '/api/v1/ai/actions/execute', brokenJson, {
        'X-Agent-Key': VALID_DEV_KEY,
        'Content-Type': 'application/json',
      });
      record(
        'Broken JSON syntax caught by parser and returns HTTP 400 without crash',
        resBroken.status === 400,
        `Status ${resBroken.status}`
      );
    }

    // 2.3 Non-Object JSON Root Primitives
    {
      const primitives = [
        { label: 'null', val: 'null' },
        { label: 'number (12345)', val: '12345' },
        { label: 'boolean (true)', val: 'true' },
        { label: 'string ("malformed")', val: '"malformed"' },
        { label: 'array ([])', val: '[]' },
      ];

      for (const p of primitives) {
        const resPrim = await request('POST', '/api/v1/ai/actions/execute', p.val, {
          'X-Agent-Key': VALID_DEV_KEY,
          'Content-Type': 'application/json',
        });
        record(
          `Root primitive ${p.label} safely rejected with HTTP 400`,
          resPrim.status === 400,
          `Status ${resPrim.status}`
        );
      }
    }

    // 2.4 Malformed Action Property
    {
      const actionVariations = [
        { label: 'Missing action property ({})', body: {} },
        { label: 'Empty string action', body: { action: '' } },
        { label: 'Whitespace action', body: { action: '   ' } },
        { label: 'Null action', body: { action: null } },
        { label: 'Number action (999)', body: { action: 999 } },
        { label: 'Boolean action (false)', body: { action: false } },
        { label: 'Object action ({})', body: { action: {} } },
        { label: 'Array action ([])', body: { action: [] } },
        { label: 'SQL Injection in action name', body: { action: "'; DROP TABLE RpsDocument; --" } },
        { label: 'Path traversal in action name', body: { action: '../../etc/passwd' } },
        { label: 'Null byte in action name', body: { action: 'system.ping\0evil' } },
        { label: 'Extreme length action name (10k chars)', body: { action: 'a'.repeat(10000) } },
      ];

      for (const v of actionVariations) {
        const resAct = await request('POST', '/api/v1/ai/actions/execute', v.body, {
          'X-Agent-Key': VALID_DEV_KEY,
        });
        record(
          `Adversarial action name (${v.label}) rejected with HTTP 400`,
          resAct.status === 400 && resAct.body?.success === false,
          `Status ${resAct.status}`
        );
      }
    }

    // 2.5 Malformed Parameters Property
    {
      const paramVariations = [
        { label: 'String parameters', params: 'not-an-object' },
        { label: 'Array parameters', params: [1, 2, 3] },
        { label: 'Number parameters', params: 42 },
        { label: 'Boolean parameters', params: true },
      ];

      for (const pv of paramVariations) {
        const resParam = await request('POST', '/api/v1/ai/actions/execute', {
          action: 'system.ping',
          parameters: pv.params,
        }, {
          'X-Agent-Key': VALID_DEV_KEY,
        });
        record(
          `Malformed parameter type (${pv.label}) rejected with HTTP 400 VALIDATION_ERROR`,
          resParam.status === 400 && (resParam.body?.code === 'VALIDATION_ERROR' || resParam.body?.error),
          `Status ${resParam.status}, Code: ${resParam.body?.code}`
        );
      }

      // Null parameter fallback behavior (falsy coalesce to {} by controller)
      const resNullParam = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.ping',
        parameters: null,
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      record(
        `Null parameter is safely coalesced to empty object for zero-arg actions`,
        resNullParam.status === 200 && resNullParam.body?.success === true,
        `Status ${resNullParam.status}`
      );
    }

    // 2.6 Edge Cases in Standard Action Handlers
    {
      // Missing IDs for actions requiring ID
      const idActions = ['rps.get', 'rps.update', 'rps.export_docx', 'rps.audit_compliance'];
      for (const act of idActions) {
        const resId = await request('POST', '/api/v1/ai/actions/execute', {
          action: act,
          parameters: {},
        }, {
          'X-Agent-Key': VALID_DEV_KEY,
        });
        record(
          `Action ${act} missing ID parameter rejected with HTTP 400 INVALID_PARAMETER`,
          resId.status === 400 && resId.body?.code === 'INVALID_PARAMETER',
          `Status ${resId.status}`
        );
      }

      // rps.validate adversarial assessments with domain-compliant and non-compliant schemas
      const validateCases = [
        {
          label: 'Non-object / corrupted penilaian',
          params: { penilaian: 'corrupted_string' },
          check: (r) => r.status === 200 && r.body?.result?.warnings?.some(w => w.includes('0%')),
        },
        {
          label: 'Non-numeric weight in penilaian',
          params: { penilaian: [{ komponen: 'Quiz', bobot: 'not_a_number' }] },
          check: (r) => r.status === 200 && r.body?.result?.valid === false,
        },
        {
          label: 'Negative weight in penilaian',
          params: { penilaian: [{ komponen: 'Exam', bobot: -30 }] },
          check: (r) => r.status === 200 && r.body?.result?.errors?.some(e => e.includes('Negative assessment weight')),
        },
        {
          label: 'Exact 100% weight sum',
          params: { penilaian: [{ komponen: 'Tugas', bobot: 40 }, { komponen: 'UTS', bobot: 30 }, { komponen: 'UAS', bobot: 30 }] },
          check: (r) => r.status === 200 && r.body?.result?.valid === true && r.body?.result?.totalWeight === 100,
        },
        {
          label: 'Under 100% weight sum (80%)',
          params: { penilaian: [{ komponen: 'Tugas', bobot: 50 }, { komponen: 'UTS', bobot: 30 }] },
          check: (r) => r.status === 200 && r.body?.result?.valid === false && r.body?.result?.warnings?.some(w => w.includes('80%')),
        },
        {
          label: 'Over 100% weight sum (120%)',
          params: { penilaian: { Tugas: 60, UTS: 30, UAS: 30 } },
          check: (r) => r.status === 200 && r.body?.result?.valid === false && r.body?.result?.warnings?.some(w => w.includes('120%')),
        },
      ];

      for (const vc of validateCases) {
        const resVal = await request('POST', '/api/v1/ai/actions/execute', {
          action: 'rps.validate',
          parameters: vc.params,
        }, {
          'X-Agent-Key': VALID_DEV_KEY,
        });
        record(
          `Pedagogical validation edge case (${vc.label}) handled cleanly`,
          vc.check(resVal),
          `Status ${resVal.status}`
        );
      }
    }

    // 2.7 Prototype Pollution & Deep Nesting
    {
      delete Object.prototype['adversarialPolluted'];
      const pollutionPayload = JSON.parse('{"action":"system.ping","parameters":{"__proto__":{"adversarialPolluted":true}}}');
      const resPollute = await request('POST', '/api/v1/ai/actions/execute', pollutionPayload, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      record(
        'Prototype pollution does not contaminate global Object.prototype',
        resPollute.status === 200 && Object.prototype['adversarialPolluted'] === undefined,
        `polluted: ${Object.prototype['adversarialPolluted']}`
      );

      // Deeply nested JSON (50 levels)
      let deepObj = { leaf: 'data' };
      for (let i = 0; i < 50; i++) {
        deepObj = { nested: deepObj };
      }
      const resDeep = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.ping',
        parameters: { deep: deepObj },
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      record(
        'Handle 50-level deeply nested JSON parameters without stack overflow',
        resDeep.status === 200 && resDeep.body?.success === true,
        `Status ${resDeep.status}`
      );
    }

    // 2.8 Payload Limits: 2MB within 10MB limit vs 11MB exceeding limit
    {
      // 2MB payload within limit
      const padding2MB = 'A'.repeat(2 * 1024 * 1024);
      const res2MB = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.ping',
        parameters: { data: padding2MB },
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      record(
        'Process 2MB large payload within 10MB limit successfully',
        res2MB.status === 200 && res2MB.body?.success === true,
        `Status ${res2MB.status}`
      );

      // 11MB payload exceeding 10MB limit -> Express body-parser should return HTTP 413 Payload Too Large
      console.log('    [Info] Generating 11MB oversized payload to test body limit...');
      const padding11MB = 'B'.repeat(11 * 1024 * 1024);
      const res11MB = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.ping',
        parameters: { data: padding11MB },
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      record(
        'Enforce 10MB payload boundary: 11MB payload rejected with HTTP 413 Payload Too Large',
        res11MB.status === 413,
        `Status ${res11MB.status}`
      );
    }

    // =========================================================================
    // SECTION 3: REPEATED EXECUTION OF system.run_doctor CONSISTENCY
    // =========================================================================
    console.log('\n--- SECTION 3: REPEATED EXECUTION OF system.run_doctor CONSISTENCY ---');

    // 3.1 50 Sequential Executions of system.run_doctor
    {
      const TOTAL_RUNS = 50;
      let allHealthy = true;
      let allPassed = true;
      let endpointCounts = new Set();
      let uniqueTraces = new Set();
      const startTime = Date.now();

      for (let i = 0; i < TOTAL_RUNS; i++) {
        const resDoctor = await request('POST', '/api/v1/ai/actions/execute', {
          action: 'system.run_doctor',
        }, {
          'X-Agent-Key': VALID_DEV_KEY,
        });

        if (resDoctor.status !== 200) allHealthy = false;
        const result = resDoctor.body?.result;
        if (!result || result.status !== 'HEALTHY') allHealthy = false;
        if (result?.layers?.layer1_database?.status !== 'PASS') allPassed = false;
        if (result?.layers?.layer2_api?.status !== 'PASS') allPassed = false;
        if (result?.layers?.layer3_models?.status !== 'PASS') allPassed = false;
        if (result?.layers?.layer2_api?.missingRoutes?.length !== 0) allPassed = false;

        const endpoints = result?.layers?.layer2_api?.totalDiscoveredEndpoints;
        endpointCounts.add(endpoints);

        if (resDoctor.body?.traceId) {
          uniqueTraces.add(resDoctor.body.traceId);
        }
      }

      const duration = Date.now() - startTime;
      const avgLatency = Math.round(duration / TOTAL_RUNS);

      record(
        `Execute system.run_doctor 50 consecutive times with 100% HEALTHY status`,
        allHealthy && allPassed,
        `50/50 HEALTHY, Avg latency: ${avgLatency}ms`
      );

      record(
        `Discovered endpoint count is strictly invariant across all 50 runs`,
        endpointCounts.size === 1 && !endpointCounts.has(undefined) && !endpointCounts.has(0),
        `Unique endpoint counts observed: [${[...endpointCounts].join(', ')}]`
      );

      record(
        `Trace IDs across all 50 sequential doctor executions are unique`,
        uniqueTraces.size === TOTAL_RUNS,
        `Unique traces: ${uniqueTraces.size}/${TOTAL_RUNS}`
      );
    }

    // 3.2 Concurrent Burst of system.run_doctor (20 Simultaneous Calls)
    {
      const BURST_SIZE = 20;
      const promises = [];
      const burstStart = Date.now();

      for (let i = 0; i < BURST_SIZE; i++) {
        promises.push(
          request('POST', '/api/v1/ai/actions/execute', {
            action: 'system.run_doctor',
          }, {
            'X-Agent-Key': VALID_DEV_KEY,
          })
        );
      }

      const burstResponses = await Promise.all(promises);
      const burstDuration = Date.now() - burstStart;

      const burstAll200 = burstResponses.every((r) => r.status === 200);
      const burstAllHealthy = burstResponses.every((r) => r.body?.result?.status === 'HEALTHY');
      const burstAllLayer2Pass = burstResponses.every((r) => r.body?.result?.layers?.layer2_api?.status === 'PASS');
      const burstTraces = new Set(burstResponses.map((r) => r.body?.traceId).filter(Boolean));

      record(
        `Concurrent burst: 20 simultaneous system.run_doctor calls succeed with status HEALTHY`,
        burstAll200 && burstAllHealthy && burstAllLayer2Pass,
        `All 200: ${burstAll200}, All HEALTHY: ${burstAllHealthy}, Duration: ${burstDuration}ms`
      );

      record(
        `Concurrent burst doctor runs produce 20 unique trace IDs without collision`,
        burstTraces.size === BURST_SIZE,
        `Unique traces: ${burstTraces.size}/${BURST_SIZE}`
      );
    }

    // 3.3 Dynamic State Isolation: Multi-Cycle Invalidation and Recovery
    {
      // Cycle 1: Mutate app to empty app -> status DEGRADED
      const emptyApp = express();
      aiService.setApp(emptyApp);
      const resDegraded1 = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.run_doctor',
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      const c1Ok = resDegraded1.status === 200 &&
                   resDegraded1.body?.result?.status === 'DEGRADED' &&
                   resDegraded1.body?.result?.layers?.layer2_api?.status === 'FAIL';

      // Cycle 2: Restore real server app -> status HEALTHY
      aiService.setApp(app);
      const resRestored1 = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.run_doctor',
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      const c2Ok = resRestored1.status === 200 &&
                   resRestored1.body?.result?.status === 'HEALTHY' &&
                   resRestored1.body?.result?.layers?.layer2_api?.status === 'PASS';

      // Cycle 3: Mutate app to partial app (only 1 route) -> status DEGRADED
      const partialApp = express();
      const pRouter = express.Router();
      pRouter.get('/rps', (req, res) => res.json([]));
      partialApp.use('/api', pRouter);
      aiService.setApp(partialApp);

      const resDegraded2 = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.run_doctor',
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      const c3Ok = resDegraded2.status === 200 &&
                   resDegraded2.body?.result?.status === 'DEGRADED' &&
                   resDegraded2.body?.result?.layers?.layer2_api?.missingRoutes?.includes('POST /api/rps');

      // Cycle 4: Restore real server app again -> status HEALTHY
      aiService.setApp(app);
      const resRestored2 = await request('POST', '/api/v1/ai/actions/execute', {
        action: 'system.run_doctor',
      }, {
        'X-Agent-Key': VALID_DEV_KEY,
      });
      const c4Ok = resRestored2.status === 200 &&
                   resRestored2.body?.result?.status === 'HEALTHY' &&
                   resRestored2.body?.result?.layers?.layer2_api?.status === 'PASS';

      record(
        'Multi-cycle dynamic invalidation & recovery: Doctor reflects router mutations instantly without stale cache',
        c1Ok && c2Ok && c3Ok && c4Ok,
        `C1 (Degraded): ${c1Ok}, C2 (Restored): ${c2Ok}, C3 (Partial Degraded): ${c3Ok}, C4 (Restored): ${c4Ok}`
      );
    }

    // 3.4 Telemetry File Stream Integrity after High-Volume Doctor Runs
    {
      const agentLogContent = fs.readFileSync(agentLogPath, 'utf8');
      const lines = agentLogContent.trim().split('\n').filter(Boolean);
      let parseErrors = 0;
      let doctorLogCount = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.action === 'system.run_doctor') {
            doctorLogCount++;
          }
        } catch {
          parseErrors++;
        }
      }

      record(
        `Telemetry stream integrity: All lines in ai-agent.jsonl remain strictly valid JSON after 70+ doctor runs`,
        parseErrors === 0 && doctorLogCount >= 70,
        `Valid lines: ${lines.length}, Doctor entries: ${doctorLogCount}, Parse errors: ${parseErrors}`
      );
    }

  } finally {
    await stopTestServer();
  }

  console.log('\n========================================================================');
  console.log(`REMEDIATION HARNESS SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error(`❌ Remediation stress tests detected ${failed} failure(s)!`);
    process.exit(1);
  } else {
    console.log('✅ All Milestone 2 Remediation stress tests PASSED successfully!');
    process.exit(0);
  }
}

runRemediationStressSuite().catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
