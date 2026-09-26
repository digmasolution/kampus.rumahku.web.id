import { Router } from 'express';
import { bugReportController } from '../controllers/bugReport.controller';

const router = Router();

// Static routes should come before dynamic :id routes
router.get('/', bugReportController.getAll.bind(bugReportController));
router.post('/', bugReportController.create.bind(bugReportController));
router.delete('/bulk/prune', bugReportController.prune.bind(bugReportController));
router.get('/config/developers', bugReportController.getDevelopers.bind(bugReportController));

// Dynamic routes
router.get('/:id', bugReportController.getById.bind(bugReportController));
router.patch('/:id', bugReportController.update.bind(bugReportController));
router.delete('/:id', bugReportController.delete.bind(bugReportController));
router.get('/:id/ai-prompt', bugReportController.generateAiPrompt.bind(bugReportController));
router.post('/:id/approve', bugReportController.approve.bind(bugReportController));
router.post('/:id/merge', bugReportController.merge.bind(bugReportController));
router.patch('/:id/assign', bugReportController.assign.bind(bugReportController));

export default router;
