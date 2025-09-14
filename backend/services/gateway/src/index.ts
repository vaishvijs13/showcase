import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from '@takeone/utils';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { jobsRouter } from './routes/jobs';
import { healthRouter } from './routes/health';
import { JobQueue } from './services/job-queue';

const app = express();
const port = process.env.PORT || 3000;

// Initialize job queue
const jobQueue = new JobQueue();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
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

// Make job queue available to routes
app.locals.jobQueue = jobQueue;

// Direct composer storage access for final videos
app.use('/backend/services/composer/storage', express.static(path.join(__dirname, '../../../services/composer/storage')));

// Static file serving for other assets - Order matters!
// Composer storage (final videos) has highest priority  
app.use('/storage', express.static(path.join(__dirname, '../../../services/composer/storage')));
// Then presenter storage (AI talking head videos)  
app.use('/storage', express.static(path.join(__dirname, '../../../services/presenter/storage')));
// Finally explorer storage (screen recordings)
app.use('/storage', express.static(path.join(__dirname, '../../../services/explorer/storage')));

// API routes
app.use('/health', healthRouter);
app.use('/api/jobs', jobsRouter);
app.use('/jobs', jobsRouter); // Keep backward compatibility

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  logger.info(`Gateway service listening on port ${port}`, {
    environment: process.env.NODE_ENV,
    port,
  });
});

export default app;
