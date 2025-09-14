import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RecorderEngine } from '../services/recorder-engine';
import { StoryboardSchema, AuthConfigSchema } from '@takeone/types';
import { logger } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';

export const recordRouter = Router();
const recorderEngine = new RecorderEngine();

interface RecordRequest {
  storyboard: any; // Will be validated with Zod
  jobId?: string;
  auth?: any; // Will be validated with Zod
  appUrl?: string; // Use this instead of storyboard.baseUrl
}

/**
 * POST /record
 * Record a storyboard and generate scene videos
 */
recordRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyboard, jobId = randomUUID(), auth, appUrl }: RecordRequest = req.body;

    if (!storyboard) {
      throw new HttpError('storyboard is required', 400);
    }

    // Validate storyboard
    const storyboardResult = StoryboardSchema.safeParse(storyboard);
    if (!storyboardResult.success) {
      throw new HttpError('Invalid storyboard format', 400);
    }
    const validatedStoryboard = storyboardResult.data;

    // Validate auth config if provided
    let validatedAuth;
    if (auth) {
      const authResult = AuthConfigSchema.safeParse(auth);
      if (!authResult.success) {
        throw new HttpError('Invalid auth configuration', 400);
      }
      validatedAuth = authResult.data;
    }

    logger.info('Starting storyboard recording', { 
      jobId, 
      storyboardTitle: validatedStoryboard.title,
      scenesCount: validatedStoryboard.scenes.length,
      hasAuth: !!auth 
    });

    const result = await recorderEngine.record(validatedStoryboard, jobId, validatedAuth);

    const successfulRecordings = result.recordings.filter(r => r.success);
    const failedRecordings = result.recordings.filter(r => !r.success);

    res.json({
      success: true,
      jobId,
      storyboard: {
        title: validatedStoryboard.title,
        scenesCount: validatedStoryboard.scenes.length,
      },
      results: {
        sceneDir: result.sceneDir,
        traceDir: result.traceDir,
        totalScenes: result.recordings.length,
        successfulScenes: successfulRecordings.length,
        failedScenes: failedRecordings.length,
        recordings: result.recordings,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /record/status/:jobId
 * Get the status of a recording job
 */
recordRouter.get('/status/:jobId', async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * POST /record/test
 * Test endpoint to validate storyboard format without recording
 */
recordRouter.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyboard } = req.body;

    if (!storyboard) {
      throw new HttpError('storyboard is required', 400);
    }

    // Validate storyboard
    const storyboardResult = StoryboardSchema.safeParse(storyboard);
    if (!storyboardResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid storyboard format',
        details: storyboardResult.error.errors,
      });
    }

    const validatedStoryboard = storyboardResult.data;

    res.json({
      success: true,
      message: 'Storyboard format is valid',
      storyboard: {
        title: validatedStoryboard.title,
        scenesCount: validatedStoryboard.scenes.length,
        scenes: validatedStoryboard.scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          actionsCount: scene.actions.length,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}); 