const path = require('path');
const appRoot = path.resolve(__dirname, '../../rps-form-app');
const { PrismaClient } = require(path.join(appRoot, 'node_modules/@prisma/client'));
const dbPath = path.join(appRoot, 'prisma/dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } }
});

async function main() {
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
  console.log('CURRENT DATABASE TABLE COUNTS:');
  console.log(JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
