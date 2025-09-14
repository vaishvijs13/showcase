import { logger } from '@takeone/utils';
import { ZodError } from 'zod';
export class HttpError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'HttpError';
    }
}
export const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details = undefined;
    if (err instanceof HttpError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation error';
        details = err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
        }));
    }
    else if (err instanceof Error) {
        message = err.message;
        logger.error('Unhandled error', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
        });
    }
    else {
        logger.error('Unknown error', {
            error: String(err),
            url: req.url,
            method: req.method,
        });
    }
    const response = {
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path,
    };
    if (details) {
        response.details = details;
    }
    if (process.env.NODE_ENV === 'development' && err instanceof Error) {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
