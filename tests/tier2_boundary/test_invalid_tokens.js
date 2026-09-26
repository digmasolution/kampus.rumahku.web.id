/**
 * Tier 2: Boundary & Corner Cases - Invalid Authentication Tokens
 * Tests missing, empty, malformed, SQL-injected, and tampered tokens on AI endpoints.
 */

const {
  createSuite,
  apiGet,
  apiPost,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 2: Invalid Authentication Tokens');

// Test 1: Completely missing authentication header
suite.test('GET /api/v1/ai/context without any auth header should return 401', async () => {
  const res = await apiGet('/api/v1/ai/context');
  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): AI router not yet attached');
  }
  assertEqual(res.status, 401, 'Should reject with 401 Unauthorized');
});

// Test 2: Whitespace-only token header
suite.test('GET /api/v1/ai/context with whitespace token should return 401', async () => {
  const res = await apiGet('/api/v1/ai/context', {
    'X-Agent-Key': '     '
  });
  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): AI router not yet attached');
  }
  assertEqual(res.status, 401, 'Should reject whitespace token with 401');
});

// Test 3: Arbitrary invalid token string
suite.test('GET /api/v1/ai/context with invalid token string should return 401', async () => {
  const res = await apiGet('/api/v1/ai/context', {
    'X-Agent-Key': 'random_invalid_token_xyz_999'
  });
  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): AI router not yet attached');
  }
  assertEqual(res.status, 401, 'Should reject invalid token with 401');
});

// Test 4: SQL injection payload in token header
suite.test('GET /api/v1/ai/context with SQL injection token should return 401 without 500 error', async () => {
  const res = await apiGet('/api/v1/ai/context', {
    'X-Agent-Key': "' OR 1=1; DROP TABLE AiAgent; --"
  });
  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): AI router not yet attached');
  }
  assertEqual(res.status, 401, 'SQL injection in token header should be rejected with 401');
});

// Test 5: Action execute endpoint with tampered Bearer token
suite.test('POST /api/v1/ai/actions/execute with invalid Bearer token should return 401', async () => {
  const res = await apiPost('/api/v1/ai/actions/execute', { action: 'system.ping' }, {
    'Authorization': 'Bearer fake.invalid.jwt.token'
  });
  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): AI router not yet attached');
  }
  assertEqual(res.status, 401, 'Should reject invalid Bearer token with 401');
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
