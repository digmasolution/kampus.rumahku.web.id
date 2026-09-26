import { Router } from 'express';
import { rpsController } from '../controllers/rps.controller';

const router = Router();

// GET /api/rps - List all documents
router.get('/', (req, res, next) => rpsController.listDocs(req, res, next));

// POST /api/rps - Create document
router.post('/', (req, res, next) => rpsController.createDoc(req, res, next));

// GET /api/rps/:id - Get document details
router.get('/:id', (req, res, next) => rpsController.getDoc(req, res, next));

// PUT /api/rps/:id - Update document
router.put('/:id', (req, res, next) => rpsController.updateDoc(req, res, next));

// DELETE /api/rps/:id - Delete document
router.delete('/:id', (req, res, next) => rpsController.deleteDoc(req, res, next));

// GET /api/rps/:id/export/docx - Stream DOCX export
router.get('/:id/export/docx', (req, res, next) => rpsController.exportDocx(req, res, next));

// GET /api/rps/:id/export/pdf - Stream PDF export
router.get('/:id/export/pdf', (req, res, next) => rpsController.exportPdf(req, res, next));

export default router;
