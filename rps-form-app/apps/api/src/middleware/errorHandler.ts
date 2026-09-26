import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message,
      },
    });
  }

  // Default internal server error
  const statusCode = err.status || err.statusCode || 500;
  const is500 = statusCode === 500;
  
  if (is500) {
    // Auto-report 500 errors via BugReportService (fire and forget)
    import('../services/bugReport.service').then(({ bugReportService }) => {
      bugReportService.createBugReport({
        routePath: req.originalUrl,
        description: `Auto-reported 500 Backend Error:\n${err.message}`,
        type: 'bug',
        severity: 'CRITICAL',
        metadata: {
          method: req.method,
          stackTrace: err.stack,
          body: req.body,
          query: req.query
        },
        source: 'backend',
      }).catch(e => console.error('[BugReportService] Failed to auto-report error:', e));
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV !== 'production' && err.stack ? { details: err.stack } : {}),
    },
  });
}
