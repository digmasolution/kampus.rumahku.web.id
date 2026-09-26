import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Find root of rps-form-app by searching upwards for templates & storage
function findAppRoot(): string {
  let curr = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, 'templates')) && fs.existsSync(path.join(curr, 'storage'))) {
      return curr;
    }
    curr = path.resolve(curr, '..');
  }
  return path.resolve(__dirname, '../../../..');
}

const appRoot = findAppRoot();

// Load .env from apps/api and root
dotenv.config();
dotenv.config({ path: path.join(appRoot, '.env') });
dotenv.config({ path: path.resolve(appRoot, '../.env') });

export const config = {
  appRoot,
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  storageDir: path.join(appRoot, 'storage'),
  exportDir: path.join(appRoot, 'storage/exports'),
  uploadDir: path.join(appRoot, 'storage/uploads'),
  templatesDir: path.join(appRoot, 'templates'),
  processedTemplatePath: path.join(appRoot, 'templates/processed/rps-template-processed.docx'),
  backupTemplateDir: path.join(appRoot, 'templates/backups'),
};
