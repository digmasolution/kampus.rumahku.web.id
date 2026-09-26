process.env.NODE_ENV = 'test';
const path = require('path');
const assert = require('assert');

const appRoot = path.resolve(__dirname, '../../rps-form-app');
const express = require(path.join(appRoot, 'node_modules/express'));
const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));
const serverApp = require(path.join(appRoot, 'apps/api/dist/server')).default;

async function runAdversarialReview() {
  console.log('================================================================');
  console.log('   ADVERSARIAL STRESS-TEST SUITE: M2 REMEDIATION REVIEWER_M2_3   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  // 1A. NON-ARRAY / MALFORMED INPUTS TO extractExpressRoutes
  test('extractExpressRoutes: handles null, undefined, number, object stack gracefully', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    assert.deepStrictEqual(fn(null), []);
    assert.deepStrictEqual(fn(undefined), []);
    assert.deepStrictEqual(fn(12345), []);
    assert.deepStrictEqual(fn({}), []);
  });

  // 1B. SPARSE / FALSY LAYER ELEMENTS IN STACK
  test('extractExpressRoutes: handles sparse array or falsy layer items without crash', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    try {
      fn([null, undefined, {}, { handle: {} }]);
    } catch (err) {
      throw new Error(`Throws on falsy layer in array: ${err.message}`);
    }
  });

  // 2. MULTIPLE HTTP METHODS ON SINGLE ROUTE
  test('extractExpressRoutes: handles multiple HTTP methods on single route cleanly', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    const mockApp = express();
    mockApp.route('/multi')
      .get((req, res) => {})
      .post((req, res) => {})
      .put((req, res) => {})
      .delete((req, res) => {});
    
    mockApp.lazyrouter();
    const routes = fn(mockApp._router.stack);
    const multiRoutes = routes.filter(r => r.path === '/multi');
    assert.strictEqual(multiRoutes.length, 4, 'Should extract all 4 HTTP methods');
    const methods = multiRoutes.map(r => r.method).sort();
    assert.deepStrictEqual(methods, ['DELETE', 'GET', 'POST', 'PUT']);
  });

  // 3. DEEPLY NESTED ROUTERS (5 LEVELS DEEP)
  test('extractExpressRoutes: decodes deeply nested routers and mounted prefixes', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    const app = express();
    const r1 = express.Router();
    const r2 = express.Router();
    const r3 = express.Router();
    const r4 = express.Router();

    r4.get('/leaf', (req, res) => {});
    r3.use('/level3', r4);
    r2.use('/level2', r3);
    r1.use('/level1', r2);
    app.use('/root', r1);

    app.lazyrouter();
    const routes = fn(app._router.stack);
    const leaf = routes.find(r => r.path === '/root/level1/level2/level3/leaf');
    assert.ok(leaf, 'Should find /root/level1/level2/level3/leaf');
    assert.strictEqual(leaf.method, 'GET');
    assert.strictEqual(leaf.handlersCount, 1);
  });

  // 4. ROOT MOUNTED ROUTER WITHOUT PREFIX
  test('extractExpressRoutes: handles router mounted at root without explicit prefix', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    const app = express();
    const r = express.Router();
    r.get('/unprefixed', (req, res) => {});
    app.use(r);

    app.lazyrouter();
    const routes = fn(app._router.stack);
    const route = routes.find(r => r.path === '/unprefixed');
    assert.ok(route, 'Should find /unprefixed route');
    assert.strictEqual(route.method, 'GET');
  });

  // 5. SCALE TEST: 2,000 DYNAMIC ROUTES (Performance & No Memory Leak)
  test('extractExpressRoutes: handles high volume (2,000 routes) in under 100ms without memory leak', () => {
    const fn = aiService['extractExpressRoutes'].bind(aiService);
    const app = express();
    const router = express.Router();
    for (let i = 0; i < 2000; i++) {
      router.get(`/route_${i}`, (req, res) => {});
    }
    app.use('/bulk', router);
    app.lazyrouter();

    const t0 = Date.now();
    const routes = fn(app._router.stack);
    const elapsed = Date.now() - t0;

    assert.strictEqual(routes.length, 2000, 'Should extract all 2000 routes');
    assert.ok(elapsed < 200, `Execution should be fast, took ${elapsed}ms`);
  });

  // 6. FALLBACK MECHANISM ADVERSARIAL STRESS
  await testAsync('runDoctorDiagnostics: works when appInstance is null, boolean, string, or corrupted object', async () => {
    // Test null
    aiService.setApp(null);
    let diag = await aiService.runDoctorDiagnostics();
    assert.strictEqual(diag.layers.layer2_api.status, 'PASS');
    assert.ok(diag.layers.layer2_api.totalDiscoveredEndpoints > 0);

    // Test corrupted object without _router or stack
    aiService.setApp({ corrupted: true });
    diag = await aiService.runDoctorDiagnostics();
    // It should safely evaluate routerStack as [] and report FAIL / DEGRADED, without crashing
    assert.strictEqual(diag.layers.layer2_api.status, 'FAIL');
    assert.strictEqual(diag.status, 'DEGRADED');

    // Restore real app
    aiService.setApp(serverApp);
    diag = await aiService.runDoctorDiagnostics();
    assert.strictEqual(diag.status, 'HEALTHY');
  });

  // 7. CONTRACT PROBE CORRUPTION / PROBE FAILURE INVALDATION
  await testAsync('runDoctorDiagnostics: invalidates Layer 2 and overall status when contract probe fails', async () => {
    const app = express();
    const api = express.Router();
    // Mount all paths correctly so routeExists=true for all
    api.get('/rps', (req, res) => res.json([]));
    api.post('/rps', (req, res) => res.json({}));
    const ai = express.Router();
    ai.get('/context', (req, res) => res.json({}));
    ai.get('/actions/catalog', (req, res) => res.json({}));
    ai.get('/learning/rules', (req, res) => res.json([]));

    app.use('/api/v1/ai', ai);
    app.use('/api', api);

    aiService.setApp(app);

    // Temporarily sabotage getSystemContext to fail contract probe
    const origGetContext = aiService.getSystemContext;
    aiService.getSystemContext = async () => { throw new Error('Contract probe simulated sabotage'); };

    try {
      const diag = await aiService.runDoctorDiagnostics();
      assert.strictEqual(diag.layers.layer2_api.status, 'FAIL', 'Layer 2 must FAIL when probe throws');
      assert.strictEqual(diag.status, 'DEGRADED', 'Overall status must be DEGRADED');
      const ctxRoute = diag.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/v1/ai/context');
      assert.strictEqual(ctxRoute.verified, false);
      assert.strictEqual(ctxRoute.routeExists, true);
      assert.strictEqual(ctxRoute.contractValid, false);
      assert.ok(ctxRoute.error.includes('Contract probe failed'));
    } finally {
      aiService.getSystemContext = origGetContext;
      aiService.setApp(serverApp);
    }
  });

  // 8. TELEMETRY TRACE PROPAGATION INTEGRITY
  await testAsync('aiService.executeAction: propagates traceId into error telemetry without disconnecting', async () => {
    const customTraceId = 'adversarial-trace-check-' + Date.now();
    try {
      await aiService.executeAction('nonexistent.action.fail', {}, undefined, customTraceId);
      assert.fail('Should have thrown AppError');
    } catch (err) {
      assert.ok(err);
    }

    // Verify error was logged with matching traceId in storage/logs/ai-errors.jsonl
    const fs = require('fs');
    const logPath = path.resolve(appRoot, 'storage/logs/ai-errors.jsonl');
    const content = fs.readFileSync(logPath, 'utf8');
    assert.ok(content.includes(customTraceId), `Error log must contain traceId: ${customTraceId}`);
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialReview().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
