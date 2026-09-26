import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { validateUploadedDocx } from '../validators/template.validator';
import { AppError } from '../middleware/errorHandler';

export interface TemplateInfo {
  name: string;
  exists: boolean;
  sizeBytes: number;
  lastModified: string | null;
  isActive: boolean;
}

export class TemplateService {
  public getActiveTemplateInfo(): TemplateInfo {
    const templatePath = config.processedTemplatePath;
    const exists = fs.existsSync(templatePath);

    if (!exists) {
      return {
        name: 'rps-template-processed.docx',
        exists: false,
        sizeBytes: 0,
        lastModified: null,
        isActive: false,
      };
    }

    const stats = fs.statSync(templatePath);
    return {
      name: path.basename(templatePath),
      exists: true,
      sizeBytes: stats.size,
      lastModified: stats.mtime.toISOString(),
      isActive: true,
    };
  }

  public async uploadAndActivateTemplate(file: Express.Multer.File): Promise<{ success: boolean; message: string; backupCreated: string | null }> {
    // 1. Validate uploaded file strictly
    validateUploadedDocx(file);

    const targetPath = config.processedTemplatePath;
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 2. Create automated backup of existing template before overwrite
    let backupPath: string | null = null;
    if (fs.existsSync(targetPath)) {
      if (!fs.existsSync(config.backupTemplateDir)) {
        fs.mkdirSync(config.backupTemplateDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(config.backupTemplateDir, `rps-template-processed.backup_${timestamp}.docx`);
      fs.copyFileSync(targetPath, backupPath);
      console.log(`[TEMPLATE BACKUP] Created backup at ${backupPath}`);
    }

    // 3. Atomically overwrite target template with validated file
    try {
      fs.copyFileSync(file.path, targetPath);
    } catch (err: any) {
      // If overwrite failed and we had a backup, restore
      if (backupPath && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, targetPath);
      }
      throw new AppError(`Failed to update template: ${err.message}`, 500, 'TEMPLATE_UPDATE_FAILED');
    } finally {
      // 4. Always clean up temporary upload file
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          console.warn('[CLEANUP WARNING] Could not remove temp file:', cleanupErr);
        }
      }
    }

    return {
      success: true,
      message: 'Template berhasil divalidasi dan diperbarui.',
      backupCreated: backupPath ? path.basename(backupPath) : null,
    };
  }
}

export const templateService = new TemplateService();
