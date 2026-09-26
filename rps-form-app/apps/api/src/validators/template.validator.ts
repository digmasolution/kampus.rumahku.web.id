import fs from 'fs';
import PizZip from 'pizzip';
import { AppError } from '../middleware/errorHandler';

export function validateUploadedDocx(file: Express.Multer.File | undefined) {
  if (!file) {
    throw new AppError('No template file uploaded', 400, 'FILE_MISSING');
  }

  // Check extension
  const originalName = file.originalname || '';
  if (!originalName.toLowerCase().endsWith('.docx')) {
    // Clean up temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError('Invalid file type. Only .docx files are permitted', 400, 'INVALID_FILE_TYPE');
  }

  // Check maximum file size (10 MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError('File size exceeds 10MB limit', 400, 'FILE_TOO_LARGE');
  }

  // Verify DOCX structure (must be a valid ZIP containing word/document.xml)
  try {
    const content = fs.readFileSync(file.path, 'binary');
    const zip = new PizZip(content);
    const docXml = zip.file('word/document.xml');
    if (!docXml) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError('Invalid DOCX template: missing word/document.xml structure', 400, 'CORRUPTED_TEMPLATE');
    }
  } catch (err: any) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    if (err instanceof AppError) throw err;
    throw new AppError(`Malformed DOCX file: ${err.message}`, 400, 'MALFORMED_TEMPLATE');
  }
}
