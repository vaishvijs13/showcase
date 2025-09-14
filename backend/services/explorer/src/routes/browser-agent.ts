import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';
import axios from 'axios';

export const browserAgentRouter = Router();

interface BrowserAgentRequest {
  task: string;
  appUrl?: string;
  headless?: boolean;
  maxTurns?: number;
  jobId?: string;
}

interface BrowserAgentResponse {
  success: boolean;
  result: string;
  error?: string;
  taskId: string;
}


browserAgentRouter.post('/browse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task, appUrl, headless = true, maxTurns = 10, jobId = randomUUID() }: BrowserAgentRequest = req.body;

    if (!task) {
      throw new HttpError('task is required', 400);
    }

    logger.info('Starting browser agent task', { jobId, task, appUrl, headless, maxTurns });

    // Call the Python browser agent service
    const browserAgentUrl = process.env.BROWSER_AGENT_URL || 'http://localhost:3005';
    
    const response = await axios.post(`${browserAgentUrl}/browse`, {
      task,
      app_url: appUrl,
      headless,
      max_turns: maxTurns
    }, {
      timeout: 300000, // 5 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result: BrowserAgentResponse = response.data;

    res.json({
      success: true,
      jobId,
      task,
      appUrl,
      result: result.result,
      taskId: result.taskId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});


browserAgentRouter.post('/scroll-app', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appUrl, headless = false, maxTurns = 20, jobId = randomUUID() }: BrowserAgentRequest = req.body;

    if (!appUrl) {
      throw new HttpError('appUrl is required for scrolling', 400);
    }

    logger.info('Starting app scrolling task', { jobId, appUrl, headless, maxTurns });

    const browserAgentUrl = process.env.BROWSER_AGENT_URL || 'http://localhost:3005';
    
    const response = await axios.post(`${browserAgentUrl}/scroll-app`, {
      task: 'Scroll through the entire application',
      app_url: appUrl,
      headless,
      max_turns: maxTurns
    }, {
      timeout: 600000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result: BrowserAgentResponse = response.data;

    res.json({
      success: true,
      jobId,
      appUrl,
      result: result.result,
      taskId: result.taskId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});


browserAgentRouter.post('/search-document', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task, appUrl, headless = true, maxTurns = 15, jobId = randomUUID() }: BrowserAgentRequest = req.body;

    if (!task) {
      throw new HttpError('task is required for document search', 400);
    }

    if (!appUrl) {
      throw new HttpError('appUrl is required for document search', 400);
    }

    logger.info('Starting document search task', { jobId, task, appUrl, headless, maxTurns });

    // call the py browser agent service
    const browserAgentUrl = process.env.BROWSER_AGENT_URL || 'http://localhost:3005';
    
    const response = await axios.post(`${browserAgentUrl}/search-document`, {
      task,
      app_url: appUrl,
      headless,
      max_turns: maxTurns
    }, {
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result: BrowserAgentResponse = response.data;

    res.json({
      success: true,
      jobId,
      task,
      appUrl,
      result: result.result,
      taskId: result.taskId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});


browserAgentRouter.get('/status/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      throw new HttpError('jobId is required', 400);
    }

    res.json({
      jobId,
      status: 'unknown',
      message: 'Job status tracking not implemented yet',
    });
  } catch (error) {
    next(error);
  }
});
