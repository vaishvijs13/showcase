import { logger } from '@takeone/utils';
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            contentLength: res.get('content-length'),
        };
        if (res.statusCode >= 400) {
            logger.warn('Request completed with error', logData);
        }
        else {
            logger.info('Request completed', logData);
        }
    });
    next();
};
