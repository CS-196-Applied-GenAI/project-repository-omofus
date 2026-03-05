import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: ApiResponse<null> = {
    success: false,
    error: message,
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
}

/**
 * Success response middleware
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
}

/**
 * Error response middleware
 */
export function sendError(res: Response, error: string, statusCode: number = 400) {
  const response: ApiResponse<null> = {
    success: false,
    error,
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Route ${req.path} not found`, 404);
}
