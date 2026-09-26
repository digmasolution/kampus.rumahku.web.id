import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { RpsDocument } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export interface GeneratedDocxResult {
  filePath: string;
  fileName: string;
  buffer: Buffer;
}

export class DocxService {
  public generateDocx(docData: RpsDocument): GeneratedDocxResult {
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(docData.dataJson || '{}');
    } catch {
      parsedData = {};
    }

    // Determine active template path
    let templatePath = config.processedTemplatePath;
    if (!fs.existsSync(templatePath)) {
      // Fallback to clean template if exists
      const cleanPath = path.resolve(config.templatesDir, 'processed/rps-template-processed-clean.docx');
      if (fs.existsSync(cleanPath)) {
        templatePath = cleanPath;
      } else {
        throw new AppError('Template file not found on server', 500, 'TEMPLATE_NOT_FOUND');
      }
    }

    let content: string;
    try {
      content = fs.readFileSync(templatePath, 'binary');
    } catch (err: any) {
      throw new AppError(`Failed to read template: ${err.message}`, 500, 'TEMPLATE_READ_ERROR');
    }

    let zip: PizZip;
    let doc: Docxtemplater;
    try {
      zip = new PizZip(content);
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
      });
    } catch (err: any) {
      throw new AppError(`Failed to parse template zip structure: ${err.message}`, 500, 'TEMPLATE_PARSE_ERROR');
    }

    // Build comprehensive template data
    const templateData: Record<string, any> = {
      INSTITUSI: parsedData.institusi || 'UNIVERSITAS CIPTA MANDIRI',
      PROGRAM_STUDI: parsedData.programStudi || 'PENDIDIKAN MATEMATIKA',
      NAMA_MATA_KULIAH: docData.courseName || parsedData.courseName || parsedData.namaMataKuliah || 'MATA KULIAH',
      KODE_MATA_KULIAH: docData.courseCode || parsedData.courseCode || parsedData.kodeMataKuliah || 'MK001',
      SKS_T: String(parsedData.sksT ?? '2'),
      SKS_P: String(parsedData.sksP ?? '0'),
      SKS: String(parsedData.sks ?? (Number(parsedData.sksT || 2) + Number(parsedData.sksP || 0))),
      SEMESTER: String(parsedData.semester ?? '2'),
      TANGGAL_PENYUSUNAN: parsedData.tanggal || parsedData.tanggalPenyusunan || new Date().toLocaleDateString('id-ID'),
      DOSEN_PENGEMBANG: parsedData.dosenPengembang || 'Dosen Pengembang RPS',
      KOORDINATOR_MATA_KULIAH: parsedData.koordinator || parsedData.koordinatorMk || 'Koordinator Mata Kuliah',
      KETUA_PRODI: parsedData.kaprodi || parsedData.ketuaProdi || 'Ketua Program Studi',
      RUMPUN_MK: parsedData.rumpunMk || 'Mata Kuliah Keahlian',
      BAHAN_KAJIAN: parsedData.bahanKajian || '',
      PUSTAKA_UTAMA: parsedData.pustakaUtama || '',
      PUSTAKA_PENDUKUNG: parsedData.pustakaPendukung || '',
      // Support list iterators if updated in future templates
      cpl: parsedData.cplList || [],
      rencanaMingguan: parsedData.rencanaMingguan || [],
      penilaian: parsedData.penilaian || [],
    };

    try {
      doc.render(templateData);
    } catch (err: any) {
      console.error('Docxtemplater render error:', err);
      if (err.properties && Array.isArray(err.properties.errors)) {
        const errorMessages = err.properties.errors
          .map((e: any) => e.properties?.explanation || e.message)
          .join('; ');
        throw new AppError(`Docxtemplater rendering error: ${errorMessages}`, 500, 'DOCX_RENDER_ERROR', errorMessages);
      }
      throw new AppError(`Failed to render DOCX document: ${err.message}`, 500, 'DOCX_RENDER_ERROR');
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Ensure export directory exists
    if (!fs.existsSync(config.exportDir)) {
      fs.mkdirSync(config.exportDir, { recursive: true });
    }

    // Sanitize file name
    const sanitizedCode = (docData.courseCode || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `RPS_${sanitizedCode}_${Date.now()}.docx`;
    const outPath = path.join(config.exportDir, fileName);

    fs.writeFileSync(outPath, buf);

    return {
      filePath: outPath,
      fileName,
      buffer: buf,
    };
  }
}

export const docxService = new DocxService();
