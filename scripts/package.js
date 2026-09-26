/**
 * Production Packaging Script for Dunia_Kampus
 * Generates web_build.zip with strict exclusion of node_modules, .git, and .env.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('../rps-form-app/node_modules/pizzip');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RPS_DIR = path.join(PROJECT_ROOT, 'rps-form-app');
const OUTPUT_ZIP = path.join(PROJECT_ROOT, 'web_build.zip');

function addDirectoryToZip(zip, srcDir, zipPrefix = '') {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const zipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;

    // Strict exclusion filters
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.env')) {
      continue;
    }
    if (entry.name === 'backups') {
      continue;
    }

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, srcPath, zipPath);
    } else if (entry.isFile()) {
      const fileData = fs.readFileSync(srcPath);
      zip.file(zipPath, fileData);
    }
  }
}

function packageProduction() {
  console.log('Packaging production bundle into web_build.zip...');
  const zip = new PizZip();

  // 1. Web frontend dist
  const webDist = path.join(RPS_DIR, 'apps/web/dist');
  if (fs.existsSync(webDist)) {
    addDirectoryToZip(zip, webDist, 'apps/web/dist');
    console.log('  + Added apps/web/dist');
  } else {
    console.warn('  ! Warning: apps/web/dist does not exist. Run npm run build first!');
  }

  // 2. API backend dist & package.json
  const apiDist = path.join(RPS_DIR, 'apps/api/dist');
  if (fs.existsSync(apiDist)) {
    addDirectoryToZip(zip, apiDist, 'apps/api/dist');
    console.log('  + Added apps/api/dist');
  } else {
    console.warn('  ! Warning: apps/api/dist does not exist. Run npm run build first!');
  }

  const apiPkg = path.join(RPS_DIR, 'apps/api/package.json');
  if (fs.existsSync(apiPkg)) {
    zip.file('apps/api/package.json', fs.readFileSync(apiPkg));
    console.log('  + Added apps/api/package.json');
  }

  // 3. Root package.json & Prisma schema
  const rootPkg = path.join(RPS_DIR, 'package.json');
  if (fs.existsSync(rootPkg)) {
    zip.file('package.json', fs.readFileSync(rootPkg));
    console.log('  + Added package.json');
  }

  const prismaSchema = path.join(RPS_DIR, 'prisma/schema.prisma');
  if (fs.existsSync(prismaSchema)) {
    zip.file('prisma/schema.prisma', fs.readFileSync(prismaSchema));
    console.log('  + Added prisma/schema.prisma');
  }

  // 4. Templates
  const templatesDir = path.join(RPS_DIR, 'templates');
  if (fs.existsSync(templatesDir)) {
    addDirectoryToZip(zip, templatesDir, 'templates');
    console.log('  + Added templates');
  }

  // 5. Storage / Logs / Summaries
  const logsDir = path.join(RPS_DIR, 'storage/logs');
  if (fs.existsSync(logsDir)) {
    addDirectoryToZip(zip, logsDir, 'storage/logs');
    console.log('  + Added storage/logs');
  }

  // 6. Server configs & recovery script
  const configs = ['kampus.conf', 'kampus-api.service', 'fix_server.php'];
  for (const cfg of configs) {
    const cfgPath = path.join(PROJECT_ROOT, cfg);
    if (fs.existsSync(cfgPath)) {
      zip.file(cfg, fs.readFileSync(cfgPath));
      console.log(`  + Added ${cfg}`);
    }
  }

  console.log('Generating ZIP buffer...');
  const buffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(OUTPUT_ZIP, buffer);
  const sizeMb = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`Successfully generated ${OUTPUT_ZIP} (${sizeMb} MB)`);
}

if (require.main === module) {
  packageProduction();
}

module.exports = { packageProduction };
