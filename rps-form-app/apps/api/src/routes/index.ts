import { Router } from 'express';
import rpsRoutes from './rps.routes';
import templateRoutes from './template.routes';
import aiRoutes from './ai.routes';
import authRoutes from './auth.routes';
import bugReportRoutes from './bugReport.routes';
import meetingRoutes from './meeting.routes';
import todoRoutes from './todo.routes';

const router = Router();

// Mount resources
router.use('/auth', authRoutes);
router.use('/bug-reports', bugReportRoutes);
router.use('/rps', rpsRoutes);
router.use('/templates', templateRoutes);
router.use('/meetings', meetingRoutes);
router.use('/todos', todoRoutes);
router.use('/v1/ai', aiRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
