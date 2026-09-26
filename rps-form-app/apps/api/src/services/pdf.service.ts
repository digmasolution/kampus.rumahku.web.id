import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { RpsDocument } from '@prisma/client';
import { config } from '../config';
import { docxService } from './docx.service';
import { AppError } from '../middleware/errorHandler';

export interface GeneratedPdfResult {
  filePath: string;
  fileName: string;
}

export class PdfService {
  /**
   * Resolves the LibreOffice executable path across Linux and Windows environments
   */
  private findLibreOfficeBinary(): string | null {
    const candidates = [
      'soffice',
      'libreoffice',
      '/usr/bin/soffice',
      '/usr/bin/libreoffice',
      '/usr/local/bin/soffice',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];

    for (const bin of candidates) {
      if (path.isAbsolute(bin)) {
        if (fs.existsSync(bin)) return bin;
      }
    }

    // Fall back to 'soffice' for PATH resolution
    return 'soffice';
  }

  /**
   * Securely converts a document to PDF using execFile without shell interpolation
   */
  public async convertToPdf(docData: RpsDocument): Promise<GeneratedPdfResult> {
    // 1. Generate fresh DOCX on demand to eliminate race conditions
    const docxResult = docxService.generateDocx(docData);
    const docxPath = docxResult.filePath;

    if (!fs.existsSync(docxPath)) {
      throw new AppError('Generated DOCX not found for PDF conversion', 500, 'DOCX_NOT_FOUND');
    }

    const exportDir = config.exportDir;
    const binary = this.findLibreOfficeBinary() || 'soffice';
    const expectedPdfName = path.basename(docxPath, '.docx') + '.pdf';
    const expectedPdfPath = path.join(exportDir, expectedPdfName);

    // 2. Safe arguments array passed directly to OS kernel without shell execution
    const args = [
      '--headless',
      '--convert-to',
      'pdf',
      docxPath,
      '--outdir',
      exportDir,
    ];

    return new Promise<GeneratedPdfResult>((resolve, reject) => {
      execFile(
        binary,
        args,
        { shell: false, timeout: 60000, maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('[PDF CONVERSION ERROR]', error.message, stderr);

            // Handle binary not found gracefully
            if ((error as any).code === 'ENOENT') {
              return reject(
                new AppError(
                  'LibreOffice (soffice) is not installed or not available in the system PATH. Install libreoffice-writer to enable PDF export.',
                  503,
                  'LIBREOFFICE_NOT_FOUND'
                )
              );
            }

            return reject(
              new AppError(
                `PDF conversion failed: ${error.message}`,
                500,
                'PDF_CONVERSION_ERROR',
                stderr || stdout
              )
            );
          }

          if (!fs.existsSync(expectedPdfPath)) {
            return reject(
              new AppError(
                'PDF file was not produced by LibreOffice conversion',
                500,
                'PDF_OUTPUT_MISSING'
              )
            );
          }

          resolve({
            filePath: expectedPdfPath,
            fileName: expectedPdfName,
          });
        }
      );
    });
  }
}

export const pdfService = new PdfService();
