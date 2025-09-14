import { Request, Response, NextFunction } from 'express';
import { logger } from '@takeone/utils';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  } 
  // Handle custom HTTP errors
  else if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle known operational errors
  else if (err.isOperational) {
    statusCode = err.statusCode || 500;
    message = err.message;
  }

  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}; 