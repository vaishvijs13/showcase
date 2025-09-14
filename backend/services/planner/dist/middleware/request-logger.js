import { logger } from '@takeone/utils';
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent') || 'unknown',
            ip: req.ip || req.connection.remoteAddress,
        };
        if (res.statusCode >= 400) {
            logger.warn('HTTP request completed with error', logData);
        }
        else {
            logger.info('HTTP request completed', logData);
        }
    });
    next();
};
