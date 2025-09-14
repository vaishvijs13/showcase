import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@takeone/utils';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { ingestRouter } from './routes/ingest';
import { crawlRouter } from './routes/crawl';
import { recordRouter } from './routes/record';
const app = express();
const port = process.env.PORT || 3001;
// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(requestLogger);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'explorer',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// API routes
app.use('/ingest', ingestRouter);
app.use('/crawl', crawlRouter);
app.use('/record', recordRouter);
// Error handling
app.use(errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(port, () => {
    logger.info(`Explorer service listening on port ${port}`, {
        environment: process.env.NODE_ENV,
        port,
    });
});
export default app;
