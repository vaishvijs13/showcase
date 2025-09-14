import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@takeone/utils';
import { JobConfigSchema, PersonaConfigSchema, MusicConfigSchema } from '@takeone/types';
import { HttpError } from '../middleware/error-handler';
export const jobsRouter = Router();
// Create a new job
jobsRouter.post('/', async (req, res) => {
    try {
        const body = req.body;
        // Validate required fields
        if (!body.repoUrl || !body.persona) {
            throw new HttpError('Missing required fields: repoUrl, persona', 400);
        }
        // Use provided appUrl or leave undefined
        const appUrl = body.appUrl;
        // Validate persona config
        const persona = PersonaConfigSchema.parse(body.persona);
        // Validate music config if provided
        const music = body.music ? MusicConfigSchema.parse(body.music) : MusicConfigSchema.parse({});
        const jobId = uuidv4();
        const jobConfig = JobConfigSchema.parse({
            id: jobId,
            repoUrl: body.repoUrl,
            appUrl: appUrl,
            persona,
            music,
            auth: body.auth,
            outputDir: `storage/${jobId}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        // Add job to queue
        const jobQueue = req.app.locals.jobQueue;
        await jobQueue.addJob(jobConfig);
        logger.info('Created new job', { jobId, repoUrl: body.repoUrl, appUrl: appUrl });
        const response = {
            jobId,
            status: 'pending',
            createdAt: jobConfig.createdAt,
            estimatedDuration: persona.length === 'short' ? 30 : persona.length === 'long' ? 120 : 60
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new HttpError(`Failed to create job: ${error.message}`, 400);
        }
        throw error;
    }
});
// Get job status
jobsRouter.get('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const jobQueue = req.app.locals.jobQueue;
        const jobStatus = await jobQueue.getJobStatus(jobId);
        if (!jobStatus) {
            throw new HttpError('Job not found', 404);
        }
        res.json(jobStatus);
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to get job status', 500);
    }
});
// Get job results/artifacts
jobsRouter.get('/:jobId/results', async (req, res) => {
    try {
        const { jobId } = req.params;
        const jobQueue = req.app.locals.jobQueue;
        const results = await jobQueue.getJobResults(jobId);
        if (!results) {
            throw new HttpError('Job results not found', 404);
        }
        res.json(results);
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to get job results', 500);
    }
});
// Cancel a job
jobsRouter.delete('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const jobQueue = req.app.locals.jobQueue;
        const cancelled = await jobQueue.cancelJob(jobId);
        if (!cancelled) {
            throw new HttpError('Job not found or cannot be cancelled', 404);
        }
        res.json({ message: 'Job cancelled successfully' });
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to cancel job', 500);
    }
});
