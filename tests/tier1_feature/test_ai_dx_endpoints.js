/**
 * Tier 1: Feature Coverage - AI DX & Agent Scaffolding Endpoints
 * Tests /api/v1/ai/context, /api/v1/ai/actions/catalog, /api/v1/ai/actions/execute,
 * /api/v1/ai/learning/rules, and X-Agent-Key authentication.
 */

const {
  createSuite,
  apiGet,
  apiPost,
  assert,
  assertEqual,
  assertIncludes
} = require('../test_helper');

const suite = createSuite('Tier 1: AI DX & Agent Scaffolding');

const VALID_AGENT_KEY = process.env.AI_AGENT_KEY || 'kampus-ai-agent-key-dev';

// Test 1: AI Context Introspection with Valid Key
suite.test('GET /api/v1/ai/context with valid X-Agent-Key should return system context & template tags', async () => {
  const res = await apiGet('/api/v1/ai/context', {
    'X-Agent-Key': VALID_AGENT_KEY,
    'X-Agent-Id': 'test-agent-e2e',
    'X-Agent-Name': 'E2E-Test-Runner'
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/context endpoint not yet implemented in active backend');
  }

  assertEqual(res.status, 200, 'Expected 200 OK for authenticated context request');
  assert(res.data, 'Response data must not be empty');

  // Verify structure specified in PROJECT.md / explorer survey
  assert(res.data.system || res.data.application || res.data.profile, 'Response must provide system metadata');
  assert(res.data.template || res.data.activeTemplate, 'Response must provide active template metadata');
});

// Test 2: AI Context Introspection without Key returns 401 Unauthorized
suite.test('GET /api/v1/ai/context without authentication should return 401 Unauthorized', async () => {
  const res = await apiGet('/api/v1/ai/context');

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/context not yet routed in backend');
  }

  assertEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated agent request');
  assert(res.data && (res.data.error || res.data.message), 'Error body should explain authentication requirement');
});

// Test 3: Action Catalog returns tool schemas
suite.test('GET /api/v1/ai/actions/catalog should return list of executable actions and schemas', async () => {
  const res = await apiGet('/api/v1/ai/actions/catalog', {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/actions/catalog not yet implemented');
  }

  assertEqual(res.status, 200, 'Expected 200 OK for action catalog');
  const actions = res.data.actions || res.data;
  assert(Array.isArray(actions), 'Catalog should return an array of actions');
  assert(actions.length >= 3, `Expected at least 3 actions in catalog (found ${actions.length})`);

  const actionNames = actions.map(a => a.name || a.action);
  assert(
    actionNames.some(name => name.includes('rps.create') || name.includes('create')),
    'Action catalog must include rps.create action'
  );
});

// Test 4: Action Execution RPC executes rps.create
suite.test('POST /api/v1/ai/actions/execute should execute rps.create and return traceId', async () => {
  const payload = {
    action: 'rps.create',
    parameters: {
      title: 'RPS Created via AI Action',
      courseName: 'Teori Graf dan Otomata',
      courseCode: 'TGO_AI_' + Math.floor(Math.random() * 10000),
      data: {
        sks: '3',
        dosenPengembang: 'Dian Kristanti, M.Pd.'
      }
    }
  };

  const res = await apiPost('/api/v1/ai/actions/execute', payload, {
    'X-Agent-Key': VALID_AGENT_KEY,
    'X-Agent-Name': 'E2E-Action-Tester'
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/actions/execute not yet implemented');
  }

  assertEqual(res.status, 200, 'Expected 200 OK for successful action execution');
  assert(res.data.success === true, 'Response success flag should be true');
  assert(res.data.traceId, 'Response must include a unique traceId for telemetry');
  assert(res.data.result && res.data.result.id, 'Action result must contain the created document ID');
});

// Test 5: AI Learning Rules introspection
suite.test('GET /api/v1/ai/learning/rules should return seeded architectural constraints and rules', async () => {
  const res = await apiGet('/api/v1/ai/learning/rules', {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/learning/rules not yet implemented');
  }

  assertEqual(res.status, 200, 'Expected 200 OK for learned rules endpoint');
  const rules = res.data.rules || res.data;
  assert(Array.isArray(rules), 'Learned rules must return an array');
  assert(rules.length >= 1, 'Expected at least 1 seeded rule in learning registry');
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
