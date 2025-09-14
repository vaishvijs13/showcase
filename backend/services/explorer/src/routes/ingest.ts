import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RepoIngestor } from '../services/repo-ingestor';
import { logger } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';

export const ingestRouter = Router();
const repoIngestor = new RepoIngestor();

interface IngestRequest {
  repoUrl: string;
  jobId?: string;
  enhanced?: boolean;
}

/**
 * POST /ingest
 * Ingest a repository and extract features and documentation
 */
ingestRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoUrl, jobId = randomUUID(), enhanced = false }: IngestRequest = req.body;

    if (!repoUrl) {
      throw new HttpError('repoUrl is required', 400);
    }

    // Validate URL format
    try {
      new URL(repoUrl);
    } catch {
      throw new HttpError('Invalid repository URL format', 400);
    }

    logger.info('Starting repository ingest', { jobId, repoUrl, enhanced });

    const result = await repoIngestor.ingest(repoUrl, jobId, enhanced);

    res.json({
      success: true,
      jobId,
      repoUrl,
      featuresPath: result.featuresPath,
      quickstartPath: result.quickstartPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ingest/status/:jobId
 * Get the status of an ingest job
 */
ingestRouter.get('/status/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      throw new HttpError('jobId is required', 400);
    }

    // TODO: Implement job status tracking
    // This would check if the job is running, completed, or failed
    res.json({
      jobId,
      status: 'unknown',
      message: 'Job status tracking not implemented yet',
    });
  } catch (error) {
    next(error);
  }
}); 