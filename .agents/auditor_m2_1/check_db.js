const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../../rps-form-app/node_modules/@prisma/client'));

const dbPath = path.resolve(__dirname, '../../rps-form-app/prisma/dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function main() {
  console.log('Target DB path:', dbPath);
  const counts = {
    users: await prisma.user.count(),
    rps: await prisma.rpsDocument.count(),
    templates: await prisma.template.count(),
    agents: await prisma.aiAgent.count(),
    interactions: await prisma.aiInteractionLog.count(),
    errors: await prisma.aiErrorLog.count(),
    feedbacks: await prisma.aiFeedback.count(),
    rules: await prisma.aiLearnedRule.count()
  };
  console.log('TABLE COUNTS:');
  console.log(JSON.stringify(counts, null, 2));

  console.log('\nAI AGENTS:');
  const agents = await prisma.aiAgent.findMany();
  console.log(JSON.stringify(agents, null, 2));

  console.log('\nLEARNED RULES:');
  const rules = await prisma.aiLearnedRule.findMany();
  console.log(JSON.stringify(rules.map(r => ({
    ruleCode: r.ruleCode,
    category: r.category,
    title: r.title,
    confidenceScore: r.confidenceScore,
    isActive: r.isActive
  })), null, 2));

  console.log('\nLATEST 3 INTERACTIONS:');
  const interactions = await prisma.aiInteractionLog.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(interactions, null, 2));

  console.log('\nLATEST 3 ERRORS:');
  const errors = await prisma.aiErrorLog.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(errors, null, 2));

  console.log('\nFEEDBACK ENTRIES:');
  const feedbacks = await prisma.aiFeedback.findMany();
  console.log(JSON.stringify(feedbacks, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
