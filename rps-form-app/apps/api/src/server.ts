import express from 'express';
import { config } from './config';
import { createCorsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import aiRoutes from './routes/ai.routes';
import { learningService } from './services/learning.service';
import { aiService } from './services/ai.service';

const app = express();

// 1. Global Middlewares
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 2. Mount API Routes
app.use('/api/v1/ai', aiRoutes);
app.use('/api', apiRoutes);

// Register active Express app in AiService for dynamic router introspection
aiService.setApp(app);

// Root greeting / health check
app.get('/', (req, res) => {
  res.json({
    app: 'Dunia Kampus - Portal Dosen API',
    version: '1.0.0',
    status: 'running',
    apiDocs: '/api/health',
  });
});

// 3. Centralized Error Handling Middleware
app.use(errorHandler);

// Auto-seed initial AI learned rules and default users
learningService.seedInitialRules().catch((err) => {
  console.warn(`[API SERVER] Notice: Initial rule seeding deferred: ${err.message}`);
});
import('./services/userSeed.service').then(m => m.seedUsers()).catch((err) => {
  console.warn(`[API SERVER] User seeding note: ${err.message}`);
});

// 4. Start Server if not imported by tests
if (process.env.NODE_ENV !== 'test') {
  const port = config.port;
  app.listen(port, () => {
    console.log(`[API SERVER] Running on port ${port} in ${config.nodeEnv} mode`);
    console.log(`[API SERVER] Allowed CORS origins: ${config.corsOrigin}`);
  });
}

export default app;
