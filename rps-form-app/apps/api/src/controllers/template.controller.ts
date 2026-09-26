import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services/template.service';
import { AppError } from '../middleware/errorHandler';

export class TemplateController {
  getTemplateInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const info = templateService.getActiveTemplateInfo();
      res.json(info);
    } catch (err) {
      next(err);
    }
  }

  async uploadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'FILE_MISSING');
      }

      const result = await templateService.uploadAndActivateTemplate(req.file);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const templateController = new TemplateController();
