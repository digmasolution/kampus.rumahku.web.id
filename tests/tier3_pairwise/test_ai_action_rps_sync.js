/**
 * Tier 3: Cross-Feature Combinations - AI Action Execution to RPS DB Sync
 * Verifies bidirectional bridge: AI Agent Action RPC -> SQLite DB Persistence ->
 * Context Introspection reflection -> Action RPC Update -> Audit Telemetry.
 */

const {
  createSuite,
  apiGet,
  apiPost,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 3: AI Action RPC <-> RPS DB Sync');

const VALID_AGENT_KEY = process.env.AI_AGENT_KEY || 'kampus-ai-agent-key-dev';
let createdByAiDocId = null;
const aiCourseCode = 'SYNC_' + Math.floor(Math.random() * 10000);

// Step 1: AI Agent triggers rps.create via Action RPC
suite.test('AI action rps.create should persist document in database and return traceId', async () => {
  const payload = {
    action: 'rps.create',
    parameters: {
      title: 'RPS Created by Autonomous Agent',
      courseName: 'Komputasi Numerik',
      courseCode: aiCourseCode,
      data: {
        sks: '3',
        dosenPengembang: 'Agent Alpha',
        penilaian: { uts: 30, uas: 35, tugas: 20, kuis: 10, keaktifan: 5 }
      }
    }
  };

  const res = await apiPost('/api/v1/ai/actions/execute', payload, {
    'X-Agent-Key': VALID_AGENT_KEY,
    'X-Agent-Name': 'Sync-Test-Agent'
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/actions/execute not yet implemented in backend');
  }

  assertEqual(res.status, 200, 'Action execution should return 200 OK');
  assert(res.data.success === true, 'Action response must indicate success');
  assert(res.data.traceId, 'Trace ID must be returned for auditability');

  const result = res.data.result;
  assert(result && result.id, 'Created document ID must be returned');
  createdByAiDocId = result.id;
});

// Step 2: Query Core RPS API to verify physical SQLite DB reflection
suite.test('Created document by AI must be queryable via core GET /api/rps/:id', async () => {
  if (!createdByAiDocId) {
    throw new Error('PENDING (M2 Pending): Step 1 did not produce a createdByAiDocId');
  }

  const res = await apiGet(`/api/rps/${createdByAiDocId}`);
  assertEqual(res.status, 200, 'Document created via AI action must exist in database');
  assertEqual(res.data.courseCode, aiCourseCode, 'Course code must match');
  assertEqual(res.data.courseName, 'Komputasi Numerik');
});

// Step 3: Check System Context Introspection reflects latest state
suite.test('GET /api/v1/ai/context should reflect active system state and storage', async () => {
  const res = await apiGet('/api/v1/ai/context', {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/context not yet implemented');
  }

  assertEqual(res.status, 200, 'Context request must succeed');
  assert(res.data, 'Context data must not be empty');
});

// Step 4: AI Agent triggers rps.update via Action RPC
suite.test('AI action rps.update should update database record', async () => {
  if (!createdByAiDocId) {
    throw new Error('PENDING (M2 Pending): Step 1 required');
  }

  const updatePayload = {
    action: 'rps.update',
    parameters: {
      id: createdByAiDocId,
      title: 'RPS Komputasi Numerik (Updated by AI)',
      status: 'FINAL',
      data: {
        sks: '3',
        dosenPengembang: 'Agent Alpha v2'
      }
    }
  };

  const res = await apiPost('/api/v1/ai/actions/execute', updatePayload, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): Action execution not available');
  }

  assertEqual(res.status, 200, 'Action update should succeed');

  // Verify persistence
  const getRes = await apiGet(`/api/rps/${createdByAiDocId}`);
  assertEqual(getRes.data.status, 'FINAL', 'Status must be updated to FINAL');
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
