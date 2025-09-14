import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { LiveMapper } from '../services/live-mapper';
import { AuthConfigSchema } from '@takeone/types';
import { logger } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';

export const crawlRouter = Router();
const liveMapper = new LiveMapper();

interface CrawlRequest {
  appUrl: string;
  jobId?: string;
  auth?: any; // Will be validated with Zod
}

/**
 * POST /crawl
 * Crawl a live application and map its structure
 */
crawlRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appUrl, jobId = randomUUID(), auth }: CrawlRequest = req.body;

    if (!appUrl) {
      throw new HttpError('appUrl is required', 400);
    }

    // Validate URL format
    try {
      new URL(appUrl);
    } catch {
      throw new HttpError('Invalid application URL format', 400);
    }

    // Validate auth config if provided
    let validatedAuth;
    if (auth) {
      const authResult = AuthConfigSchema.safeParse(auth);
      if (!authResult.success) {
        throw new HttpError('Invalid auth configuration', 400);
      }
      validatedAuth = authResult.data;
    }

    logger.info('Starting live crawl', { jobId, appUrl, hasAuth: !!auth });

    const result = await liveMapper.crawl(appUrl, jobId, validatedAuth);

    res.json({
      success: true,
      jobId,
      appUrl,
      crawlPath: result.crawlPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /crawl/status/:jobId
 * Get the status of a crawl job
 */
crawlRouter.get('/status/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      throw new HttpError('jobId is required', 400);
    }

    // TODO: Implement job status tracking
    res.json({
      jobId,
      status: 'unknown',
      message: 'Job status tracking not implemented yet',
    });
  } catch (error) {
    next(error);
  }
}); 