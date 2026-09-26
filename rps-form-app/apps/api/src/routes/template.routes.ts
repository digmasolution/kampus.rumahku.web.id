import fs from 'fs';
import { Router } from 'express';
import multer from 'multer';
import { templateController } from '../controllers/template.controller';
import { config } from '../config';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const upload = multer({
  dest: config.uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// GET /api/templates - Get active template metadata
router.get('/', (req, res, next) => templateController.getTemplateInfo(req, res, next));

// POST /api/templates/upload - Secure upload of DOCX template
router.post('/upload', upload.single('template'), (req, res, next) =>
  templateController.uploadTemplate(req, res, next)
);

export default router;
