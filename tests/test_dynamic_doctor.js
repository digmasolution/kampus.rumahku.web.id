process.env.NODE_ENV = 'test';
const path = require('path');
const appRoot = path.resolve(__dirname, '../rps-form-app');
const express = require(path.join(appRoot, 'node_modules/express'));
const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));
const serverApp = require(path.join(appRoot, 'apps/api/dist/server')).default;

async function runTest() {
  console.log('=== TEST DYNAMIC DOCTOR DIAGNOSTICS & INVALIDATION ===\n');

  // Test 1: Real Server App Inspection
  console.log('[Test 1] Testing with live server app attached...');
  aiService.setApp(serverApp);
  const diag1 = await aiService.runDoctorDiagnostics();

  console.log('Doctor Status:', diag1.status);
  console.log('Layer 2 Status:', diag1.layers.layer2_api.status);
  console.log('Discovered Endpoints:', diag1.layers.layer2_api.totalDiscoveredEndpoints);
  console.log('Router Stack Inspected:', diag1.layers.layer2_api.routerStackInspected);
  console.log('Verified Routes Count:', diag1.layers.layer2_api.verifiedRoutes.length);
  console.log('Missing Routes:', diag1.layers.layer2_api.missingRoutes);

  if (diag1.status !== 'HEALTHY') throw new Error(`Test 1 Failed: Expected HEALTHY, got ${diag1.status}`);
  if (diag1.layers.layer2_api.status !== 'PASS') throw new Error(`Test 1 Failed: Expected Layer 2 PASS, got ${diag1.layers.layer2_api.status}`);
  if (diag1.layers.layer2_api.totalDiscoveredEndpoints < 5) throw new Error('Test 1 Failed: Not enough endpoints discovered');
  if (diag1.layers.layer2_api.missingRoutes.length !== 0) throw new Error('Test 1 Failed: Unexpected missing routes');

  console.log('>> [Test 1] PASSED: Live server app inspected dynamically.\n');

  // Test 2: Invalidation with Empty Express App (No routes mounted)
  console.log('[Test 2] Testing invalidation with empty Express app (routes removed)...');
  const emptyApp = express();
  aiService.setApp(emptyApp);
  const diag2 = await aiService.runDoctorDiagnostics();

  console.log('Doctor Status (empty app):', diag2.status);
  console.log('Layer 2 Status (empty app):', diag2.layers.layer2_api.status);
  console.log('Discovered Endpoints:', diag2.layers.layer2_api.totalDiscoveredEndpoints);
  console.log('Missing Routes:', diag2.layers.layer2_api.missingRoutes);

  if (diag2.status !== 'DEGRADED') throw new Error(`Test 2 Failed: Expected DEGRADED, got ${diag2.status}`);
  if (diag2.layers.layer2_api.status !== 'FAIL') throw new Error(`Test 2 Failed: Expected Layer 2 FAIL, got ${diag2.layers.layer2_api.status}`);
  if (diag2.layers.layer2_api.missingRoutes.length !== 5) throw new Error(`Test 2 Failed: Expected 5 missing routes, got ${diag2.layers.layer2_api.missingRoutes.length}`);

  console.log('>> [Test 2] PASSED: Empty router stack correctly drives status to FAIL and DEGRADED.\n');

  // Test 3: Partial Invalidation (Only 1 route mounted)
  console.log('[Test 3] Testing partial invalidation (only /api/rps GET mounted)...');
  const partialApp = express();
  const partialRouter = express.Router();
  partialRouter.get('/rps', (req, res) => res.json([]));
  partialApp.use('/api', partialRouter);
  aiService.setApp(partialApp);

  const diag3 = await aiService.runDoctorDiagnostics();
  console.log('Doctor Status (partial app):', diag3.status);
  console.log('Layer 2 Status (partial app):', diag3.layers.layer2_api.status);
  console.log('Missing Routes:', diag3.layers.layer2_api.missingRoutes);

  if (diag3.status !== 'DEGRADED') throw new Error(`Test 3 Failed: Expected DEGRADED, got ${diag3.status}`);
  if (diag3.layers.layer2_api.status !== 'FAIL') throw new Error(`Test 3 Failed: Expected Layer 2 FAIL, got ${diag3.layers.layer2_api.status}`);
  if (!diag3.layers.layer2_api.missingRoutes.includes('POST /api/rps')) throw new Error('Test 3 Failed: Missing POST /api/rps was not reported');
  if (!diag3.layers.layer2_api.missingRoutes.includes('GET /api/v1/ai/context')) throw new Error('Test 3 Failed: Missing GET /api/v1/ai/context was not reported');

  console.log('>> [Test 3] PASSED: Partial route coverage correctly drives Layer 2 to FAIL with specific missing routes.\n');

  // Test 4: Restore Real App
  console.log('[Test 4] Restoring real server app...');
  aiService.setApp(serverApp);
  const diag4 = await aiService.runDoctorDiagnostics();

  if (diag4.status !== 'HEALTHY' || diag4.layers.layer2_api.status !== 'PASS') {
    throw new Error('Test 4 Failed: Could not restore to HEALTHY state');
  }

  console.log('>> [Test 4] PASSED: State restored to HEALTHY / PASS.\n');

  // Test 5: Fallback resolution when appInstance is null
  console.log('[Test 5] Testing fallback lazy resolution when appInstance is null...');
  aiService.setApp(null);
  const diag5 = await aiService.runDoctorDiagnostics();

  console.log('Doctor Status (fallback):', diag5.status);
  console.log('Layer 2 Status (fallback):', diag5.layers.layer2_api.status);
  console.log('Discovered Endpoints (fallback):', diag5.layers.layer2_api.totalDiscoveredEndpoints);
  console.log('Missing Routes (fallback):', diag5.layers.layer2_api.missingRoutes);

  if (diag5.status !== 'HEALTHY') throw new Error(`Test 5 Failed: Expected HEALTHY, got ${diag5.status}`);
  if (diag5.layers.layer2_api.status !== 'PASS') throw new Error(`Test 5 Failed: Expected Layer 2 PASS, got ${diag5.layers.layer2_api.status}`);

  console.log('>> [Test 5] PASSED: Fallback lazy resolution cleanly initializes routes.\n');

  console.log('=== ALL DYNAMIC DOCTOR TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
