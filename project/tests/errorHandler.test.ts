import { expect, describe, it, afterEach, beforeEach, jest } from '@jest/globals';
import { errorHandler, sendSuccess, sendError, notFoundHandler } from '../src/middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
    };
    mockResponse = {
      status: jest.fn<(code: number) => Response>().mockReturnThis(),
      json: jest.fn<(body: any) => Response>().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle error with default status code', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle error with custom status code', () => {
      const error = new Error('Not found') as any;
      error.statusCode = 404;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return error message', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Something went wrong',
        })
      );
    });

    it('should include timestamp in response', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });

    it('should log error to console', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should handle error without message', () => {
      const error = new Error() as any;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
        })
      );
    });

    it('should handle error with status code 400', () => {
      const error = new Error('Bad request') as any;
      error.statusCode = 400;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle error with status code 403', () => {
      const error = new Error('Forbidden') as any;
      error.statusCode = 403;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: '123', name: 'Test' };

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
        })
      );
    });

    it('should use default status code 200', () => {
      sendSuccess(mockResponse as Response, { test: true });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should use custom status code', () => {
      sendSuccess(mockResponse as Response, { test: true }, 201);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should include timestamp in response', () => {
      sendSuccess(mockResponse as Response, null);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data,
        })
      );
    });

    it('should handle null data', () => {
      sendSuccess(mockResponse as Response, null);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: null,
        })
      );
    });

    it('should handle different status codes', () => {
      const testCases = [201, 202, 204];

      testCases.forEach((code) => {
        jest.clearAllMocks();
        mockResponse.status = jest.fn<(code: number) => Response>().mockReturnThis();
        mockResponse.json = jest.fn<(body: any) => Response>();

        sendSuccess(mockResponse as Response, {}, code);

        expect(mockResponse.status).toHaveBeenCalledWith(code);
      });
    });
  });

  describe('sendError', () => {
    it('should send error response', () => {
      sendError(mockResponse as Response, 'Test error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
        })
      );
    });

    it('should use default status code 400', () => {
      sendError(mockResponse as Response, 'Bad request');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should use custom status code', () => {
      sendError(mockResponse as Response, 'Not found', 404);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should include timestamp in response', () => {
      sendError(mockResponse as Response, 'Error');

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });

    it('should handle various error messages', () => {
      const messages = [
        'Validation error',
        'Unauthorized',
        'Server error',
        'Resource not found',
      ];

      messages.forEach((msg) => {
        jest.clearAllMocks();
        mockResponse.status = jest.fn<(code: number) => Response>().mockReturnThis();
        mockResponse.json = jest.fn<(body: any) => Response>();

        sendError(mockResponse as Response, msg);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: msg,
          })
        );
      });
    });

    it('should handle 500 status code', () => {
      sendError(mockResponse as Response, 'Internal error', 500);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 error for missing route', () => {
      const reqWithPath = { ...mockRequest, path: '/api/missing' } as any;

      notFoundHandler(reqWithPath as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found'),
        })
      );
    });

    it('should include route path in error message', () => {
      const reqWithPath = { ...mockRequest, path: '/api/users/123' } as any;

      notFoundHandler(reqWithPath as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/\/api\/users\/123/),
        })
      );
    });

    it('should always return 404 status', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return false success flag', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should include timestamp in response', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('API Response Format', () => {
    it('should maintain consistent response structure', () => {
      sendSuccess(mockResponse as Response, { test: true });

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call).toHaveProperty('success');
      expect(call).toHaveProperty('data');
      expect(call).toHaveProperty('timestamp');
    });

    it('should have success true for successful responses', () => {
      sendSuccess(mockResponse as Response, {});

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should have success false for error responses', () => {
      sendError(mockResponse as Response, 'Error');

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('Chain Execution', () => {
    it('should return response for chaining', () => {
      const result = mockResponse.status?.('test' as any);

      expect(result).toBeDefined();
    });
  });
});
