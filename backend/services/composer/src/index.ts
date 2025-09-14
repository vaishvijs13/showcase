import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@takeone/utils';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { composerRouter } from './routes/composer';
import { healthRouter } from './routes/health';

const app = express();
const port = process.env.PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting (more restrictive for video composition)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Very low limit for video composition
  message: 'Too many video composition requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/health', healthRouter);
app.use('/', composerRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  logger.info(`Composer service listening on port ${port}`, {
    environment: process.env.NODE_ENV,
    port,
  });
});

export default app;
