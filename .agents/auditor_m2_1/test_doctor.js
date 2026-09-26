const path = require('path');
const fs = require('fs');

const appRoot = path.resolve(__dirname, '../../rps-form-app');
const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));

async function testDoctor() {
  console.log('=== TEST 1: NORMAL RUN_DOCTOR EXECUTION ===');
  const normalResult = await aiService.runDoctorDiagnostics();
  console.log('Normal runDoctor status:', normalResult.status);
  console.log('Normal runDoctor full output:', JSON.stringify(normalResult, null, 2));

  console.log('\n=== TEST 2: STRESS TEST / ADVERSARIAL MUTATION ===');
  // Check Layer 1 logic:
  // In aiService.runDoctorDiagnostics():
  // dbPath is path.resolve(config.appRoot, 'prisma/dev.db')
  // status is dbExists && rpsCount >= 0 ? 'PASS' : 'FAIL'
  console.log('Checking Layer 1 assertions:');
  console.log('Layer 1 status:', normalResult.layers.layer1_database.status);
  console.log('Layer 1 dbExists:', normalResult.layers.layer1_database.exists);
  console.log('Layer 1 tables:', normalResult.layers.layer1_database.tables);

  console.log('\nChecking Layer 2 assertions:');
  console.log('Layer 2 status:', normalResult.layers.layer2_api.status);
  console.log('Layer 2 verifiedRoutes:', normalResult.layers.layer2_api.verifiedRoutes);

  console.log('\nChecking Layer 3 assertions:');
  console.log('Layer 3 status:', normalResult.layers.layer3_models.status);
  console.log('Layer 3 modelsVerified:', normalResult.layers.layer3_models.modelsVerified);
  console.log('Layer 3 zodValidatorsSynced:', normalResult.layers.layer3_models.zodValidatorsSynced);

  console.log('\n=== EVALUATING LAYER 2 REALITY ===');
  // Did Layer 2 actually test or probe any API routes, or is it hardcoded PASS?
  // Let's inspect the AST / function source code of runDoctorDiagnostics
  const fnCode = aiService.runDoctorDiagnostics.toString();
  console.log('runDoctorDiagnostics source code snippet:');
  console.log(fnCode.substring(0, 1500));
}

testDoctor().catch(e => {
  console.error('Doctor test failed:', e);
  process.exit(1);
});
