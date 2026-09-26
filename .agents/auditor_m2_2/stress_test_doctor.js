process.env.NODE_ENV = 'test';
const path = require('path');
const appRoot = path.resolve(__dirname, '../../rps-form-app');
const express = require(path.join(appRoot, 'node_modules/express'));
const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));
const { rpsService } = require(path.join(appRoot, 'apps/api/dist/services/rps.service'));
const serverApp = require(path.join(appRoot, 'apps/api/dist/server')).default;

async function runStressTests() {
  console.log('=== AUDITOR M2_2 ADVERSARIAL STRESS TEST FOR DOCTOR DIAGNOSTICS ===\n');

  // Test Case 1: Live app normal state
  aiService.setApp(serverApp);
  const baseline = await aiService.runDoctorDiagnostics();
  console.log('1. Baseline Live Check:');
  console.log('   Overall Status:', baseline.status);
  console.log('   Layer 2 Status:', baseline.layers.layer2_api.status);
  console.log('   Discovered Endpoints:', baseline.layers.layer2_api.totalDiscoveredEndpoints);
  console.log('   Router Stack Inspected:', baseline.layers.layer2_api.routerStackInspected);
  console.log('   All 5 verified:', baseline.layers.layer2_api.verifiedRoutes.every(r => r.verified));
  if (baseline.status !== 'HEALTHY' || baseline.layers.layer2_api.status !== 'PASS') {
    throw new Error('Baseline test failed: Expected HEALTHY / PASS');
  }

  // Test Case 2: Corrupted contract shape probe (e.g., rpsService.getAll returns null or throws)
  console.log('\n2. Corrupted Contract Probe Check (rpsService.getAll returns non-array):');
  const originalGetAll = rpsService.getAll;
  try {
    rpsService.getAll = async () => "CORRUPTED_STRING_NOT_ARRAY";
    const corruptedResult = await aiService.runDoctorDiagnostics();
    console.log('   Overall Status:', corruptedResult.status);
    console.log('   Layer 2 Status:', corruptedResult.layers.layer2_api.status);
    const rpsRoute = corruptedResult.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/rps' && r.method === 'GET');
    console.log('   /api/rps GET routeExists:', rpsRoute.routeExists);
    console.log('   /api/rps GET contractValid:', rpsRoute.contractValid);
    console.log('   /api/rps GET error:', rpsRoute.error);

    if (corruptedResult.status !== 'DEGRADED') throw new Error('Expected status DEGRADED');
    if (corruptedResult.layers.layer2_api.status !== 'FAIL') throw new Error('Expected Layer 2 status FAIL');
    if (rpsRoute.contractValid !== false) throw new Error('Expected contractValid to be false');
    if (rpsRoute.verified !== false) throw new Error('Expected verified to be false');
  } finally {
    rpsService.getAll = originalGetAll;
  }
  console.log('   >> PASSED: Contract corruption properly detected and invalidated.');

  // Test Case 3: Corrupted contract probe throwing an exception
  console.log('\n3. Contract Probe Exception Check (rpsService.getAll throws):');
  try {
    rpsService.getAll = async () => { throw new Error('Database connection dead'); };
    const excResult = await aiService.runDoctorDiagnostics();
    console.log('   Overall Status:', excResult.status);
    console.log('   Layer 2 Status:', excResult.layers.layer2_api.status);
    const rpsRoute = excResult.layers.layer2_api.verifiedRoutes.find(r => r.path === '/api/rps' && r.method === 'GET');
    console.log('   /api/rps GET routeExists:', rpsRoute.routeExists);
    console.log('   /api/rps GET contractValid:', rpsRoute.contractValid);
    console.log('   /api/rps GET error:', rpsRoute.error);

    if (excResult.status !== 'DEGRADED') throw new Error('Expected status DEGRADED on probe exception');
    if (excResult.layers.layer2_api.status !== 'FAIL') throw new Error('Expected Layer 2 status FAIL on probe exception');
    if (rpsRoute.contractValid !== false) throw new Error('Expected contractValid to be false');
  } finally {
    rpsService.getAll = originalGetAll;
  }
  console.log('   >> PASSED: Probe exception properly caught and invalidated without crashing.');

  // Test Case 4: Route method mismatch (e.g. only POST mounted, GET missing)
  console.log('\n4. Method Mismatch Check (Express app with only POST /api/rps, no GET):');
  const methodMismatchApp = express();
  const testRouter = express.Router();
  testRouter.post('/rps', (req, res) => res.json({}));
  methodMismatchApp.use('/api', testRouter);
  aiService.setApp(methodMismatchApp);
  const mismatchResult = await aiService.runDoctorDiagnostics();
  console.log('   Overall Status:', mismatchResult.status);
  console.log('   Layer 2 Status:', mismatchResult.layers.layer2_api.status);
  const missing = mismatchResult.layers.layer2_api.missingRoutes;
  console.log('   Missing Routes:', missing);
  if (!missing.includes('GET /api/rps')) throw new Error('Expected GET /api/rps in missing routes');
  if (missing.includes('POST /api/rps')) throw new Error('Did not expect POST /api/rps in missing routes');
  console.log('   >> PASSED: Method mismatch accurately identified missing method.');

  // Test Case 5: Restoring Real App
  console.log('\n5. Final Restoration Check:');
  aiService.setApp(serverApp);
  const restored = await aiService.runDoctorDiagnostics();
  if (restored.status !== 'HEALTHY' || restored.layers.layer2_api.status !== 'PASS') {
    throw new Error('Restoration failed');
  }
  console.log('   >> PASSED: App restored cleanly to HEALTHY / PASS.');

  console.log('\n=== ALL AUDITOR ADVERSARIAL STRESS TESTS PASSED! ===');
}

runStressTests().catch(err => {
  console.error('Stress test failed:', err);
  process.exit(1);
});
