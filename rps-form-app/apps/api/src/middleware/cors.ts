import cors, { CorsOptions } from 'cors';
import { config } from '../config';

export function createCorsMiddleware() {
  const allowedOrigins = config.corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  // Default allowed local and deployment origins
  const standardOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3005',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3005',
    'http://kampus.rumahku.web.id',
    'https://kampus.rumahku.web.id',
  ];

  const allOrigins = Array.from(new Set([...allowedOrigins, ...standardOrigins]));

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allOrigins.includes(origin) || allOrigins.includes('*')) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Agent-Key'],
    credentials: true,
  };

  return cors(corsOptions);
}
