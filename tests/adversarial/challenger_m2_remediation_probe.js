/**
 * Adversarial Probe Suite: Milestone 2 Remediation
 * Agent: Challenger M2 Remediation 2 (challenger_m2_3)
 *
 * Probing:
 * 1. Dynamic Doctor Invalidation (Router Stack & Contract Probes)
 * 2. Telemetry Trace Correlation (Headers vs Action Parameters vs Direct Calls)
 * 3. Backdoor Bypasses & Golden Rule Integrity Checks
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '3007';

const path = require('path');
process.env.NODE_PATH = path.resolve(__dirname, '../../rps-form-app/node_modules');
require('module').Module._initPaths();

const fs = require('fs');
const http = require('http');
const express = require('express');
const { randomUUID } = require('crypto');

const appRoot = path.resolve(__dirname, '../../rps-form-app');
const serverApp = require(path.join(appRoot, 'apps/api/dist/server')).default;
const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));
const { rpsService } = require(path.join(appRoot, 'apps/api/dist/services/rps.service'));
const { learningService } = require(path.join(appRoot, 'apps/api/dist/services/learning.service'));
const { loggerService } = require(path.join(appRoot, 'apps/api/dist/services/logger.service'));

const agentLogPath = path.join(appRoot, 'storage/logs/ai-agent.jsonl');
const errorLogPath = path.join(appRoot, 'storage/logs/ai-errors.jsonl');

let testServer = null;
const TEST_PORT = 3007;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const results = [];
function record(testName, passed, details) {
  results.push({ testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${testName}`);
  if (details) {
    console.log(`   Details:`, typeof details === 'object' ? JSON.stringify(details) : details);
  }
}

async function startServer() {
  return new Promise((resolve, reject) => {
    testServer = http.createServer(serverApp);
    testServer.listen(TEST_PORT, () => {
      aiService.setApp(serverApp);
      resolve();
    });
    testServer.on('error', reject);
  });
}

function stopServer() {
  if (testServer) {
    testServer.close();
  }
}

async function runAdversarialProbes() {
  console.log('\n======================================================');
  console.log(' ADVERSARIAL PROBE: DYNAMIC DOCTOR & TELEMETRY TRACE');
  console.log(' Agent: challenger_m2_3');
  console.log('======================================================\n');

  await startServer();

  try {
    // -------------------------------------------------------------
    // SECTION 1: Dynamic Doctor Invalidation Probes
    // -------------------------------------------------------------
    console.log('--- SECTION 1: DYNAMIC DOCTOR INVALIDATION PROBES ---');

    // 1.1 Baseline with live server app
    aiService.setApp(serverApp);
    const diag1 = await aiService.runDoctorDiagnostics();
    record('1.1 Doctor Baseline: Live server app returns Layer 2 PASS and HEALTHY',
      diag1.status === 'HEALTHY' && diag1.layers.layer2_api.status === 'PASS' && diag1.layers.layer2_api.missingRoutes.length === 0,
      { status: diag1.status, layer2: diag1.layers.layer2_api.status, discovered: diag1.layers.layer2_api.totalDiscoveredEndpoints }
    );

    // 1.2 Empty Express App
    const emptyApp = express();
    aiService.setApp(emptyApp);
    const diag2 = await aiService.runDoctorDiagnostics();
    record('1.2 Invalidation: Empty app returns Layer 2 FAIL and DEGRADED with 5 missing routes',
      diag2.status === 'DEGRADED' && diag2.layers.layer2_api.status === 'FAIL' && diag2.layers.layer2_api.missingRoutes.length === 5,
      { status: diag2.status, layer2: diag2.layers.layer2_api.status, missing: diag2.layers.layer2_api.missingRoutes }
    );

    // 1.3 Missing single route invalidation: test omitting each of the 5 expected contracts one-by-one
    const expectedEndpoints = [
      { path: '/api/rps', method: 'GET' },
      { path: '/api/rps', method: 'POST' },
      { path: '/api/v1/ai/context', method: 'GET' },
      { path: '/api/v1/ai/actions/catalog', method: 'GET' },
      { path: '/api/v1/ai/learning/rules', method: 'GET' },
    ];

    for (const omit of expectedEndpoints) {
      const partialApp = express();
      const apiR = express.Router();
      const aiR = express.Router();

      if (!(omit.path === '/api/rps' && omit.method === 'GET')) apiR.get('/rps', (req, res) => res.json([]));
      if (!(omit.path === '/api/rps' && omit.method === 'POST')) apiR.post('/rps', (req, res) => res.json({}));
      if (!(omit.path === '/api/v1/ai/context' && omit.method === 'GET')) aiR.get('/context', (req, res) => res.json({}));
      if (!(omit.path === '/api/v1/ai/actions/catalog' && omit.method === 'GET')) aiR.get('/actions/catalog', (req, res) => res.json([]));
      if (!(omit.path === '/api/v1/ai/learning/rules' && omit.method === 'GET')) aiR.get('/learning/rules', (req, res) => res.json([]));

      partialApp.use('/api/v1/ai', aiR);
      partialApp.use('/api', apiR);
      aiService.setApp(partialApp);

      const diagOmit = await aiService.runDoctorDiagnostics();
      const missingKey = `${omit.method} ${omit.path}`;
      const correctlyFailed = diagOmit.status === 'DEGRADED' &&
                              diagOmit.layers.layer2_api.status === 'FAIL' &&
                              diagOmit.layers.layer2_api.missingRoutes.includes(missingKey);

      record(`1.3 Invalidation: Omitting '${missingKey}' genuinely fails Layer 2 and marks DEGRADED`,
        correctlyFailed,
        { status: diagOmit.status, missingRoutes: diagOmit.layers.layer2_api.missingRoutes }
      );
    }

    // 1.4 Mismatched HTTP method (e.g. PUT instead of GET /api/rps)
    const methodMismatchApp = express();
    const mmRouter = express.Router();
    mmRouter.put('/rps', (req, res) => res.json([])); // WRONG METHOD! Expected GET
    mmRouter.post('/rps', (req, res) => res.json({}));
    const mmAiRouter = express.Router();
    mmAiRouter.get('/context', (req, res) => res.json({}));
    mmAiRouter.get('/actions/catalog', (req, res) => res.json([]));
    mmAiRouter.get('/learning/rules', (req, res) => res.json([]));
    methodMismatchApp.use('/api/v1/ai', mmAiRouter);
    methodMismatchApp.use('/api', mmRouter);
    aiService.setApp(methodMismatchApp);

    const diagMethodMismatch = await aiService.runDoctorDiagnostics();
    record('1.4 Invalidation: Method mismatch (PUT instead of GET /api/rps) fails Layer 2 and marks DEGRADED',
      diagMethodMismatch.status === 'DEGRADED' &&
      diagMethodMismatch.layers.layer2_api.status === 'FAIL' &&
      diagMethodMismatch.layers.layer2_api.missingRoutes.includes('GET /api/rps'),
      { missing: diagMethodMismatch.layers.layer2_api.missingRoutes }
    );

    // 1.5 Corrupted route path prefix (e.g. /api/corrupted_rps instead of /api/rps)
    const corruptPathApp = express();
    const cpRouter = express.Router();
    cpRouter.get('/corrupted_rps', (req, res) => res.json([])); // Corrupted path!
    cpRouter.post('/rps', (req, res) => res.json({}));
    const cpAi = express.Router();
    cpAi.get('/context', (req, res) => res.json({}));
    cpAi.get('/actions/catalog', (req, res) => res.json([]));
    cpAi.get('/learning/rules', (req, res) => res.json([]));
    corruptPathApp.use('/api/v1/ai', cpAi);
    corruptPathApp.use('/api', cpRouter);
    aiService.setApp(corruptPathApp);

    const diagCorruptPath = await aiService.runDoctorDiagnostics();
    record('1.5 Invalidation: Corrupted path prefix fails Layer 2 and marks DEGRADED',
      diagCorruptPath.status === 'DEGRADED' &&
      diagCorruptPath.layers.layer2_api.status === 'FAIL' &&
      diagCorruptPath.layers.layer2_api.missingRoutes.includes('GET /api/rps'),
      { missing: diagCorruptPath.layers.layer2_api.missingRoutes }
    );

    // 1.6 Contract Probe Failure: Route mounted, but underlying service probe fails
    // Test 1.6.1: rpsService.getAll returns non-array
    aiService.setApp(serverApp); // Full routes mounted
    const originalGetAll = rpsService.getAll;
    try {
      rpsService.getAll = async () => 'NOT_AN_ARRAY'; // Corrupt the contract!
      const diagProbeFail1 = await aiService.runDoctorDiagnostics();
      record('1.6.1 Invalidation: Contract probe failure (rpsService.getAll returns non-array) fails Layer 2 and marks DEGRADED',
        diagProbeFail1.status === 'DEGRADED' &&
        diagProbeFail1.layers.layer2_api.status === 'FAIL' &&
        diagProbeFail1.layers.layer2_api.missingRoutes.includes('GET /api/rps'),
        {
          status: diagProbeFail1.status,
          layer2: diagProbeFail1.layers.layer2_api.status,
          missing: diagProbeFail1.layers.layer2_api.missingRoutes,
          probeDetails: diagProbeFail1.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/rps' && r.method === 'GET')
        }
      );
    } finally {
      rpsService.getAll = originalGetAll;
    }

    // Test 1.6.2: getSystemContext probe failure (application !== 'Dunia_Kampus')
    const originalGetSystemContext = aiService.getSystemContext;
    try {
      aiService.getSystemContext = async () => ({ system: { application: 'MALICIOUS_IMPOSTOR' } });
      const diagProbeFail2 = await aiService.runDoctorDiagnostics();
      record('1.6.2 Invalidation: Contract probe failure (application !== Dunia_Kampus) fails Layer 2 and marks DEGRADED',
        diagProbeFail2.status === 'DEGRADED' &&
        diagProbeFail2.layers.layer2_api.status === 'FAIL' &&
        diagProbeFail2.layers.layer2_api.missingRoutes.includes('GET /api/v1/ai/context'),
        {
          status: diagProbeFail2.status,
          missing: diagProbeFail2.layers.layer2_api.missingRoutes,
          probeDetails: diagProbeFail2.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/v1/ai/context')
        }
      );
    } finally {
      aiService.getSystemContext = originalGetSystemContext;
    }

    // Test 1.6.3: getActionCatalog probe failure (length < 5)
    const originalGetActionCatalog = aiService.getActionCatalog;
    try {
      aiService.getActionCatalog = () => []; // Empty action catalog!
      const diagProbeFail3 = await aiService.runDoctorDiagnostics();
      record('1.6.3 Invalidation: Contract probe failure (action catalog < 5) fails Layer 2 and marks DEGRADED',
        diagProbeFail3.status === 'DEGRADED' &&
        diagProbeFail3.layers.layer2_api.status === 'FAIL' &&
        diagProbeFail3.layers.layer2_api.missingRoutes.includes('GET /api/v1/ai/actions/catalog'),
        {
          status: diagProbeFail3.status,
          missing: diagProbeFail3.layers.layer2_api.missingRoutes,
          probeDetails: diagProbeFail3.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/v1/ai/actions/catalog')
        }
      );
    } finally {
      aiService.getActionCatalog = originalGetActionCatalog;
    }

    // Test 1.6.4: learningService.getRules probe failure (throws error)
    const originalGetRules = learningService.getRules;
    try {
      learningService.getRules = async () => { throw new Error('Database connection severed'); };
      const diagProbeFail4 = await aiService.runDoctorDiagnostics();
      record('1.6.4 Invalidation: Contract probe failure (learningService.getRules throws) fails Layer 2 and marks DEGRADED',
        diagProbeFail4.status === 'DEGRADED' &&
        diagProbeFail4.layers.layer2_api.status === 'FAIL' &&
        diagProbeFail4.layers.layer2_api.missingRoutes.includes('GET /api/v1/ai/learning/rules'),
        {
          status: diagProbeFail4.status,
          missing: diagProbeFail4.layers.layer2_api.missingRoutes,
          probeDetails: diagProbeFail4.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/v1/ai/learning/rules')
        }
      );
    } finally {
      learningService.getRules = originalGetRules;
    }

    // Restore real app state
    aiService.setApp(serverApp);
    const diagRestored = await aiService.runDoctorDiagnostics();
    record('1.7 Restoration: Real app and probes restored to HEALTHY and PASS',
      diagRestored.status === 'HEALTHY' && diagRestored.layers.layer2_api.status === 'PASS',
      { status: diagRestored.status }
    );

    // -------------------------------------------------------------
    // SECTION 2: Telemetry Trace Correlation Probes
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: TELEMETRY TRACE CORRELATION PROBES ---');

    // 2.1 Header X-Trace-Id propagation on successful action
    const traceSuccessHeader = `header-trace-succ-${randomUUID()}`;
    const resSuccHeader = await makeRequest('POST', '/api/v1/ai/actions/execute', {
      'x-agent-key': 'kampus-ai-agent-key-dev',
      'x-trace-id': traceSuccessHeader,
    }, {
      action: 'system.ping',
      parameters: {},
    });

    const agentLogContent1 = fs.readFileSync(agentLogPath, 'utf-8');
    const succFoundInAgent = agentLogContent1.includes(traceSuccessHeader);
    record('2.1 Header Trace ID on SUCCESS action: Appears identically in ai-agent.jsonl',
      resSuccHeader.status === 200 && resSuccHeader.body.traceId === traceSuccessHeader && succFoundInAgent,
      { httpStatus: resSuccHeader.status, respTraceId: resSuccHeader.body.traceId, foundInFile: succFoundInAgent }
    );

    // 2.2 Header X-Trace-Id propagation on FAILED action (correlation between ai-agent.jsonl and ai-errors.jsonl)
    const traceFailHeader = `header-trace-fail-${randomUUID()}`;
    const resFailHeader = await makeRequest('POST', '/api/v1/ai/actions/execute', {
      'x-agent-key': 'kampus-ai-agent-key-dev',
      'x-trace-id': traceFailHeader,
    }, {
      action: 'rps.export_docx',
      parameters: { id: `non-existent-uuid-${randomUUID()}` },
    });

    // Small delay to ensure flush
    await new Promise(r => setTimeout(r, 100));

    const agentLogContent2 = fs.readFileSync(agentLogPath, 'utf-8');
    const errorLogContent2 = fs.readFileSync(errorLogPath, 'utf-8');

    const failInAgent = agentLogContent2.includes(traceFailHeader);
    const failInErrors = errorLogContent2.includes(traceFailHeader);

    // Find the exact JSON lines
    const agentLine = agentLogContent2.trim().split('\n').map(l => JSON.parse(l)).reverse().find(l => l.traceId === traceFailHeader);
    const errorLine = errorLogContent2.trim().split('\n').map(l => JSON.parse(l)).reverse().find(l => l.traceId === traceFailHeader);

    record('2.2 Header Trace ID on FAILED action: Appears identically in BOTH ai-agent.jsonl and ai-errors.jsonl',
      failInAgent && failInErrors && agentLine && errorLine && agentLine.traceId === errorLine.traceId,
      {
        traceId: traceFailHeader,
        inAgentLog: failInAgent,
        inErrorLog: failInErrors,
        agentLineStatus: agentLine?.status,
        errorLineError: errorLine?.error || errorLine?.message,
      }
    );

    // 2.3 Header X-Correlation-Id alternative header propagation on FAILED action
    const corrFailHeader = `corr-trace-fail-${randomUUID()}`;
    const resCorrHeader = await makeRequest('POST', '/api/v1/ai/actions/execute', {
      'x-agent-key': 'kampus-ai-agent-key-dev',
      'x-correlation-id': corrFailHeader,
    }, {
      action: 'rps.get',
      parameters: { id: `non-existent-uuid-${randomUUID()}` },
    });

    await new Promise(r => setTimeout(r, 100));

    const agentLogContent3 = fs.readFileSync(agentLogPath, 'utf-8');
    const errorLogContent3 = fs.readFileSync(errorLogPath, 'utf-8');

    const corrInAgent = agentLogContent3.includes(corrFailHeader);
    const corrInErrors = errorLogContent3.includes(corrFailHeader);

    record('2.3 Header X-Correlation-Id on FAILED action: Appears identically in BOTH ai-agent.jsonl and ai-errors.jsonl',
      corrInAgent && corrInErrors,
      { traceId: corrFailHeader, inAgentLog: corrInAgent, inErrorLog: corrInErrors }
    );

    // 2.4 Trace ID passed in action parameters (HTTP request WITHOUT trace headers)
    const traceInParams = `param-trace-http-${randomUUID()}`;
    console.log(`\nProbing traceId passed in action parameters (HTTP): ${traceInParams}...`);
    const resParamHttp = await makeRequest('POST', '/api/v1/ai/actions/execute', {
      'x-agent-key': 'kampus-ai-agent-key-dev',
      // Explicitly NO X-Trace-Id or X-Correlation-Id header!
    }, {
      action: 'rps.get',
      parameters: {
        id: `non-existent-uuid-${randomUUID()}`,
        traceId: traceInParams, // Passed inside parameters!
      },
    });

    await new Promise(r => setTimeout(r, 100));

    const agentLogContent4 = fs.readFileSync(agentLogPath, 'utf-8');
    const errorLogContent4 = fs.readFileSync(errorLogPath, 'utf-8');

    const paramInAgent = agentLogContent4.includes(traceInParams);
    const paramInErrors = errorLogContent4.includes(traceInParams);

    record('2.4 Action Parameter traceId via HTTP: Appears in ai-agent.jsonl and ai-errors.jsonl',
      paramInAgent && paramInErrors,
      {
        traceId: traceInParams,
        httpStatus: resParamHttp.status,
        responseTraceId: resParamHttp.body.traceId,
        inAgentLog: paramInAgent,
        inErrorLog: paramInErrors,
        note: paramInAgent ? 'Supported' : 'NOT supported: req.traceId generated in agentAuth overrides parameter'
      }
    );

    // 2.5 Trace ID passed in action parameters directly to aiService.executeAction (Service level)
    const traceInParamsDirect = `param-trace-direct-${randomUUID()}`;
    console.log(`Probing traceId passed in action parameters (Direct Service call): ${traceInParamsDirect}...`);
    try {
      await aiService.executeAction(
        'rps.get',
        {
          id: `non-existent-uuid-${randomUUID()}`,
          traceId: traceInParamsDirect, // Passed inside parameters!
        }
      );
    } catch (e) {
      // Expected error
    }

    await new Promise(r => setTimeout(r, 100));

    const agentLogContent5 = fs.readFileSync(agentLogPath, 'utf-8');
    const errorLogContent5 = fs.readFileSync(errorLogPath, 'utf-8');

    const directInAgent = agentLogContent5.includes(traceInParamsDirect);
    const directInErrors = errorLogContent5.includes(traceInParamsDirect);

    record('2.5 Action Parameter traceId via Direct Service Call: Appears in ai-agent.jsonl and ai-errors.jsonl',
      directInAgent && directInErrors,
      {
        traceId: traceInParamsDirect,
        inAgentLog: directInAgent,
        inErrorLog: directInErrors,
        note: directInAgent ? 'Supported' : 'NOT supported: executeAction only accepts traceId as 4th parameter'
      }
    );

    // 2.6 Direct Service Call with traceId as 4th parameter on FAILED action
    const traceDirect4th = `direct-trace-4th-${randomUUID()}`;
    console.log(`Probing direct call with 4th parameter traceId: ${traceDirect4th}...`);
    try {
      await aiService.executeAction(
        'rps.export_docx',
        { id: `non-existent-uuid-${randomUUID()}` },
        { id: 'challenger-agent', name: 'Challenger', platform: 'test', role: 'AUDITOR' },
        traceDirect4th
      );
    } catch (e) {
      // Expected error
    }

    await new Promise(r => setTimeout(r, 100));

    const agentLogContent6 = fs.readFileSync(agentLogPath, 'utf-8');
    const errorLogContent6 = fs.readFileSync(errorLogPath, 'utf-8');

    const direct4thInAgent = agentLogContent6.includes(traceDirect4th);
    const direct4thInErrors = errorLogContent6.includes(traceDirect4th);

    record('2.6 Direct Service Call with 4th parameter traceId on FAILED action: Appears in BOTH logs identically',
      direct4thInAgent && direct4thInErrors,
      {
        traceId: traceDirect4th,
        inAgentLog: direct4thInAgent,
        inErrorLog: direct4thInErrors,
      }
    );

    // -------------------------------------------------------------
    // SECTION 3: Backdoors, Facades & Golden Rule Integrity Checks
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: BACKDOOR & GOLDEN RULE INTEGRITY CHECKS ---');

    // 3.1 Check for hardcoded shortcuts or skip_auth flags in agentAuth
    const agentAuthSource = fs.readFileSync(path.join(appRoot, 'apps/api/src/middleware/agentAuth.ts'), 'utf-8');
    const hasSkipAuth = agentAuthSource.includes('skip_auth') ||
                        agentAuthSource.includes('bypass') ||
                        agentAuthSource.includes('SKIP_AUTH');
    record('3.1 Golden Rule: No skip_auth or bypass flags in agentAuth.ts',
      !hasSkipAuth,
      { hasSkipAuth }
    );

    // 3.2 Check static allowed keys in agentAuth.ts
    const hasHardcodedAdmin = agentAuthSource.includes('admin-token') || agentAuthSource.includes('root-key');
    record('3.2 Golden Rule: No backdoor admin tokens in agentAuth.ts',
      !hasHardcodedAdmin,
      { hasHardcodedAdmin }
    );

    // 3.3 Check runDoctorDiagnostics in ai.service.ts for static status constants (Facade check)
    const aiServiceSource = fs.readFileSync(path.join(appRoot, 'apps/api/src/services/ai.service.ts'), 'utf-8');
    // Check if layer 2 has static status: 'PASS'
    const doctorFuncBody = aiServiceSource.slice(aiServiceSource.indexOf('runDoctorDiagnostics()'));
    const layer2Definition = doctorFuncBody.slice(doctorFuncBody.indexOf('const layer2 = {'), doctorFuncBody.indexOf('const layer3 = {'));
    const hasStaticLayer2Pass = /status:\s*['"]PASS['"]/.test(layer2Definition);
    record('3.3 Golden Rule: No static facade status in Layer 2 of runDoctorDiagnostics',
      !hasStaticLayer2Pass,
      { hasStaticLayer2Pass, codeSnippet: layer2Definition.trim().split('\n').slice(0, 4).join(' ') }
    );

    // 3.4 Check Layer 3 schema check: Does it physically read schema.prisma or is it static?
    const layer3Definition = doctorFuncBody.slice(doctorFuncBody.indexOf('const layer3 = {'), doctorFuncBody.indexOf('const overall ='));
    const checksPhysicalPrisma = doctorFuncBody.includes('fs.readFileSync(schemaPath') && doctorFuncBody.includes('model RpsDocument');
    record('3.4 Golden Rule: Layer 3 verifies physical schema.prisma definition',
      checksPhysicalPrisma,
      { checksPhysicalPrisma }
    );

  } finally {
    stopServer();
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log('            EMPIRICAL TEST SUMMARY REPORT             ');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(` Total Probes Executed : ${total}`);
  console.log(` Passed                : ${passed}`);
  console.log(` Failed                : ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.log('FAILED PROBES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(` - ${r.testName}:`, r.details);
    });
  }

  return { total, passed, failed, results };
}

runAdversarialProbes()
  .then(res => {
    process.exit(res.failed === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error('Adversarial probe execution failed:', err);
    process.exit(1);
  });
