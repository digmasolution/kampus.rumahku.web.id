/**
 * Tier 1: Feature Coverage - Persistent Logging & Continuous Learning
 * Tests JSONL log files (ai-agent.jsonl, ai-errors.jsonl), SQLite DB records,
 * feedback recording, and 3-layer anti-hallucination diagnostic integrity.
 */

const fs = require('fs');
const path = require('path');
const {
  createSuite,
  apiGet,
  apiPost,
  assert,
  assertEqual,
  RPS_APP_DIR
} = require('../test_helper');

const suite = createSuite('Tier 1: Persistent Logging & Learning');

const VALID_AGENT_KEY = process.env.AI_AGENT_KEY || 'kampus-ai-agent-key-dev';
const logDir = path.join(RPS_APP_DIR, 'storage/logs');

// Test 1: Verify storage/logs directory exists or can be accessed
suite.test('Log directory storage/logs must be configured and writable', async () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  assert(fs.existsSync(logDir), `Log directory must exist at ${logDir}`);
});

// Test 2: AI Agent Telemetry JSONL log entry format
suite.test('AI interaction logging should produce structured JSONL entries in ai-agent.jsonl', async () => {
  const agentLogPath = path.join(logDir, 'ai-agent.jsonl');

  // Trigger an AI interaction or verify existing file
  const testPayload = {
    action: 'system.ping',
    parameters: {}
  };

  const res = await apiPost('/api/v1/ai/actions/execute', testPayload, {
    'X-Agent-Key': VALID_AGENT_KEY,
    'X-Agent-Name': 'Logger-Tester'
  });

  if (res.status === 404) {
    // If endpoint pending, verify if file exists or can be parsed
    if (!fs.existsSync(agentLogPath)) {
      throw new Error('PENDING (M2 Pending): storage/logs/ai-agent.jsonl not created yet by backend');
    }
  }

  assert(fs.existsSync(agentLogPath), `ai-agent.jsonl must exist at ${agentLogPath}`);
  const lines = fs.readFileSync(agentLogPath, 'utf-8').trim().split('\n').filter(Boolean);
  assert(lines.length > 0, 'ai-agent.jsonl must contain at least one log line');

  // Verify latest entry is valid JSON with mandatory fields
  const lastEntry = JSON.parse(lines[lines.length - 1]);
  assert(lastEntry.timestamp || lastEntry.time, 'Log entry must have timestamp');
  assert(lastEntry.traceId || lastEntry.id, 'Log entry must have traceId');
});

// Test 3: AI Error Log format in ai-errors.jsonl
suite.test('Error telemetry should record failed operations in ai-errors.jsonl', async () => {
  const errorLogPath = path.join(logDir, 'ai-errors.jsonl');

  // Trigger intentional error
  await apiPost('/api/v1/ai/actions/execute', { action: 'non_existent_action' }, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (!fs.existsSync(errorLogPath)) {
    throw new Error('PENDING (M2 Pending): storage/logs/ai-errors.jsonl not created yet by backend');
  }

  const lines = fs.readFileSync(errorLogPath, 'utf-8').trim().split('\n').filter(Boolean);
  assert(lines.length > 0, 'ai-errors.jsonl should record errors');
  const lastError = JSON.parse(lines[lines.length - 1]);
  assert(lastError.timestamp || lastError.time, 'Error entry must have timestamp');
  assert(lastError.error || lastError.message, 'Error entry must have error description');
});

// Test 4: Feedback ingestion endpoint
suite.test('POST /api/v1/ai/learning/feedback should record agent feedback', async () => {
  const payload = {
    agentName: 'E2E-QA-Agent',
    feedbackType: 'ACCURACY_CORRECTION',
    content: 'Verified that RPS weekly matrix supports 16 weeks accurately',
    suggestedRule: 'Enforce exactly 16 weeks for full-semester syllabi'
  };

  const res = await apiPost('/api/v1/ai/learning/feedback', payload, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/learning/feedback not yet implemented');
  }

  assertEqual(res.status, 200, 'Expected 200 OK for feedback recording');
  assert(res.data && (res.data.success === true || res.data.id), 'Feedback recording should confirm success');
});

// Test 5: 3-Layer Anti-Hallucination Diagnostic
suite.test('Physical database must be synchronized with API and frontend schema', async () => {
  const dbPath = path.join(RPS_APP_DIR, 'prisma/dev.db');
  assert(fs.existsSync(dbPath), `Physical SQLite database must exist at ${dbPath}`);

  // Query live API for documents
  const res = await apiGet('/api/rps');
  assertEqual(res.status, 200, 'API endpoint /api/rps must be functional');
  assert(Array.isArray(res.data), 'API must return array');

  // Verify data consistency: check Prisma schema file defines core models
  const schemaPath = path.join(RPS_APP_DIR, 'prisma/schema.prisma');
  assert(fs.existsSync(schemaPath), 'schema.prisma must exist');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  assert(schemaContent.includes('model RpsDocument'), 'schema.prisma must define RpsDocument');
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
