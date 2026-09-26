const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const appRoot = path.resolve(__dirname, '../../rps-form-app');
const { PrismaClient } = require(path.join(appRoot, 'node_modules/@prisma/client'));
const dbPath = path.join(appRoot, 'prisma/dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } }
});

const agentLogPath = path.join(appRoot, 'storage/logs/ai-agent.jsonl');
const errorLogPath = path.join(appRoot, 'storage/logs/ai-errors.jsonl');

async function forensicTest() {
  console.log('=== FORENSIC LIVE MUTATION TEST ===');

  // Baseline counts
  const beforeCounts = {
    interactions: await prisma.aiInteractionLog.count(),
    errors: await prisma.aiErrorLog.count(),
    feedbacks: await prisma.aiFeedback.count(),
    rules: await prisma.aiLearnedRule.count(),
    rps: await prisma.rpsDocument.count(),
  };

  const beforeAgentLogLines = fs.existsSync(agentLogPath)
    ? fs.readFileSync(agentLogPath, 'utf-8').trim().split('\n').filter(Boolean).length
    : 0;
  const beforeErrorLogLines = fs.existsSync(errorLogPath)
    ? fs.readFileSync(errorLogPath, 'utf-8').trim().split('\n').filter(Boolean).length
    : 0;

  console.log('BASELINE COUNTS:', beforeCounts);
  console.log('BASELINE LOG LINES:', { agentLogs: beforeAgentLogLines, errorLogs: beforeErrorLogLines });

  // Load backend services
  const { aiService } = require(path.join(appRoot, 'apps/api/dist/services/ai.service'));
  const { learningService } = require(path.join(appRoot, 'apps/api/dist/services/learning.service'));

  // 1. Execute live rps.create action through aiService
  const testTraceId = `forensic-trace-${randomUUID()}`;
  const testCourseCode = `FORENSIC_${Math.floor(Math.random() * 90000 + 10000)}`;
  console.log(`Executing rps.create with traceId: ${testTraceId}, courseCode: ${testCourseCode}...`);

  const createResult = await aiService.executeAction(
    'rps.create',
    {
      title: 'Forensic Audit Verification Document',
      courseName: 'Metode Formal & Verifikasi Forensik',
      courseCode: testCourseCode,
      data: {
        sks: '3',
        dosenPengembang: 'Auditor M2',
        penilaian: { uts: 30, uas: 35, tugas: 20, kuis: 10, keaktifan: 5 }
      }
    },
    { id: 'default-ai-agent-id', name: 'ForensicAuditor', platform: 'cli', role: 'AUDITOR' },
    testTraceId
  );

  console.log('rps.create success:', createResult.success, 'docId:', createResult.result?.id);

  // 2. Execute an invalid action to trigger live error logging
  const errorTraceId = `forensic-err-${randomUUID()}`;
  console.log(`Executing invalid action with traceId: ${errorTraceId}...`);
  try {
    await aiService.executeAction(
      'forensic.invalid_action_probe',
      { probe: true },
      { id: 'default-ai-agent-id', name: 'ForensicAuditor', platform: 'cli', role: 'AUDITOR' },
      errorTraceId
    );
  } catch (probeErr) {
    console.log('Expected error caught:', probeErr.message);
  }

  // 3. Submit live feedback through learningService
  console.log('Submitting live feedback through learningService...');
  const feedbackRes = await learningService.submitFeedback({
    agentName: 'ForensicAuditor',
    agentId: 'default-ai-agent-id',
    rpsDocumentId: createResult.result?.id,
    rating: 5,
    feedbackType: 'INTEGRITY_AUDIT',
    content: 'Forensic audit verification sample feedback entry',
    suggestedRule: 'Forensic rule: all audit probes must leave verifiable physical traces'
  });
  console.log('Feedback submitted, id:', feedbackRes.id);

  // Small delay to ensure all async DB writes settle
  await new Promise(r => setTimeout(r, 200));

  // Verify DB mutations
  const afterCounts = {
    interactions: await prisma.aiInteractionLog.count(),
    errors: await prisma.aiErrorLog.count(),
    feedbacks: await prisma.aiFeedback.count(),
    rules: await prisma.aiLearnedRule.count(),
    rps: await prisma.rpsDocument.count(),
  };

  const afterAgentLogLines = fs.existsSync(agentLogPath)
    ? fs.readFileSync(agentLogPath, 'utf-8').trim().split('\n').filter(Boolean).length
    : 0;
  const afterErrorLogLines = fs.existsSync(errorLogPath)
    ? fs.readFileSync(errorLogPath, 'utf-8').trim().split('\n').filter(Boolean).length
    : 0;

  console.log('\nAFTER COUNTS:', afterCounts);
  console.log('AFTER LOG LINES:', { agentLogs: afterAgentLogLines, errorLogs: afterErrorLogLines });

  // Verification assertions
  const checks = {
    rpsCreatedInDb: afterCounts.rps === beforeCounts.rps + 1,
    interactionLoggedToDb: afterCounts.interactions >= beforeCounts.interactions + 1,
    errorLoggedToDb: afterCounts.errors >= beforeCounts.errors + 1,
    feedbackLoggedToDb: afterCounts.feedbacks >= beforeCounts.feedbacks + 1,
    ruleLoggedToDb: afterCounts.rules >= beforeCounts.rules + 1,
    agentLogAppendedToFile: afterAgentLogLines >= beforeAgentLogLines + 1,
    errorLogAppendedToFile: afterErrorLogLines >= beforeErrorLogLines + 1,
  };

  console.log('\nVERIFICATION CHECKS:');
  console.log(JSON.stringify(checks, null, 2));

  // Verify that the specific traceId exists in ai-agent.jsonl
  const agentLogContent = fs.readFileSync(agentLogPath, 'utf-8');
  const traceFoundInFile = agentLogContent.includes(testTraceId);
  console.log(`Trace ID ${testTraceId} found in ai-agent.jsonl:`, traceFoundInFile);

  const errorLogContent = fs.readFileSync(errorLogPath, 'utf-8');
  const errTraceFoundInFile = errorLogContent.includes(errorTraceId);
  console.log(`Error Trace ID ${errorTraceId} found in ai-errors.jsonl:`, errTraceFoundInFile);

  // Verify the created RPS document in DB
  const createdDoc = await prisma.rpsDocument.findUnique({
    where: { id: createResult.result?.id }
  });
  console.log('Created doc found in SQLite dev.db:', createdDoc?.id, 'courseCode:', createdDoc?.courseCode);

  await prisma.$disconnect();

  const allPassed = Object.values(checks).every(Boolean) && traceFoundInFile && errTraceFoundInFile && createdDoc !== null;
  console.log('\nOVERALL FORENSIC MUTATION RESULT:', allPassed ? 'PASS' : 'FAIL');
  process.exit(allPassed ? 0 : 1);
}

forensicTest().catch(err => {
  console.error('Forensic test failed with exception:', err);
  process.exit(1);
});
