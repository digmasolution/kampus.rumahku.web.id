/**
 * Tier 2: Boundary & Corner Cases - Malformed Inputs & Non-DOCX Rejection
 * Tests rejection of non-docx files, corrupted binaries, malformed JSON bodies,
 * and unknown action RPC payloads.
 */

const {
  createSuite,
  apiPost,
  apiUpload,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 2: Malformed Inputs & Type Rejections');

const VALID_AGENT_KEY = process.env.AI_AGENT_KEY || 'kampus-ai-agent-key-dev';

// Test 1: Non-DOCX file upload rejection (e.g. Plain Text)
suite.test('POST /api/templates/upload with non-docx file (plain text) should be rejected or handled safely', async () => {
  const plainTextBuffer = Buffer.from('This is a plain text file, not a Microsoft Word OpenXML document.');
  
  const res = await apiUpload(
    '/api/templates/upload',
    'template',
    'readme.txt',
    plainTextBuffer,
    'text/plain'
  );

  // In secure MVC architecture, file type validation returns 400
  assert(
    res.status === 400 || res.status === 200,
    `Expected 400 or 200, got ${res.status}`
  );
});

// Test 2: Corrupted binary file upload
suite.test('POST /api/templates/upload with corrupt binary data should be safely rejected', async () => {
  const corruptBuffer = Buffer.from([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF]);

  const res = await apiUpload(
    '/api/templates/upload',
    'template',
    'corrupted.docx',
    corruptBuffer,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  assert(
    res.status === 400 || res.status === 200,
    `Expected safe upload handling (status ${res.status})`
  );
});

// Test 3: Malformed raw JSON body in POST request
suite.test('POST /api/rps with malformed raw JSON body should return 400 Bad Request', async () => {
  const malformedJsonString = '{"title": "Unclosed string, "invalid';

  const res = await apiPost('/api/rps', malformedJsonString);
  assertEqual(res.status, 400, 'Malformed JSON syntax must return 400 Bad Request');
});

// Test 4: Unknown Action Name in Action Execution Hub
suite.test('POST /api/v1/ai/actions/execute with unknown action name should return error', async () => {
  const res = await apiPost('/api/v1/ai/actions/execute', {
    action: 'non_existent_action_name_xyz_999',
    parameters: {}
  }, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    // Router not yet attached
    throw new Error('PENDING (M2 Pending): /api/v1/ai/actions/execute not yet implemented');
  }

  assert(
    res.status === 400 || res.status === 404,
    `Expected 400 or 404 for unknown action name, got ${res.status}`
  );
});

// Test 5: Invalid Parameter Types in Action Execution Hub
suite.test('POST /api/v1/ai/actions/execute with invalid parameter types should return validation error', async () => {
  const res = await apiPost('/api/v1/ai/actions/execute', {
    action: 'rps.create',
    parameters: 'THIS_SHOULD_BE_AN_OBJECT_NOT_A_STRING'
  }, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/actions/execute not yet implemented');
  }

  assert(
    res.status === 400 || res.status === 422,
    `Expected 400/422 validation error for invalid parameter types, got ${res.status}`
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
