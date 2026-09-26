import { Request, Response, NextFunction } from 'express';
import { rpsService } from '../services/rps.service';
import { docxService } from '../services/docx.service';
import { pdfService } from '../services/pdf.service';
import { rpsCreateSchema, rpsUpdateSchema } from '../validators/rps.validator';

export class RpsController {
  async listDocs(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const docs = await rpsService.getAll(search, status);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }

  async getDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await rpsService.getById(req.params.id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }

  async createDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = rpsCreateSchema.parse(req.body);
      const doc = await rpsService.create(validated);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  }

  async updateDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = rpsUpdateSchema.parse(req.body);
      const doc = await rpsService.update(req.params.id, validated);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }

  async deleteDoc(req: Request, res: Response, next: NextFunction) {
    try {
      await rpsService.delete(req.params.id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async exportDocx(req: Request, res: Response, next: NextFunction) {
    try {
      const docData = await rpsService.getById(req.params.id);
      const { filePath, fileName } = docxService.generateDocx(docData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const docData = await rpsService.getById(req.params.id);
      const { filePath, fileName } = await pdfService.convertToPdf(docData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }
}

export const rpsController = new RpsController();
