import { Router, Request, Response } from 'express';
import { logger } from '@takeone/utils';
import { JobConfig, FeatureCandidates, CrawlSummary, EnhancedStoryboard } from '@takeone/types';
import { HttpError } from '../middleware/error-handler';
import { CerebrasClient } from '../services/cerebras-client';
import { StoryboardGenerator } from '../services/storyboard-generator';
import fs from 'fs-extra';
import path from 'path';

export const plannerRouter = Router();

interface GenerateRequest {
  jobConfig: JobConfig;
  featuresPath: string;
  crawlPath: string | null;
}

interface GenerateResponse {
  success: boolean;
  data: EnhancedStoryboard;
  path: string;
  error?: string;
}

// Generate storyboard
plannerRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { jobConfig, featuresPath, crawlPath } = req.body as GenerateRequest;
    
    if (!jobConfig || !featuresPath) {
      throw new HttpError('Missing required fields: jobConfig, featuresPath', 400);
    }

    logger.info('Starting storyboard generation', { 
      jobId: jobConfig.id, 
      persona: jobConfig.persona 
    });

    // Initialize services
    const cerebrasClient = new CerebrasClient(process.env.CEREBRAS_API_KEY!);
    const storyboardGenerator = new StoryboardGenerator(cerebrasClient);

    // Load feature candidates and crawl summary
    const features = await loadFeatureCandidates(featuresPath);
    const crawlSummary = crawlPath ? await loadCrawlSummary(crawlPath) : createEmptyCrawlSummary();

    // Generate storyboard
    const storyboard = await storyboardGenerator.generateStoryboard(
      jobConfig,
      features,
      crawlSummary
    );

    // Save storyboard to storage
    const outputPath = path.join(jobConfig.outputDir, 'storyboard.json');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJSON(outputPath, storyboard, { spaces: 2 });

    logger.info('Storyboard generation completed', { 
      jobId: jobConfig.id, 
      scenesCount: storyboard.scenes.length,
      totalDuration: storyboard.totalDuration
    });

    const response: GenerateResponse = {
      success: true,
      data: storyboard,
      path: outputPath
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Storyboard generation failed', { error: errorMessage });
    
    const response: GenerateResponse = {
      success: false,
      data: {} as any,
      path: '',
      error: errorMessage
    };

    res.status(500).json(response);
  }
});

// Test endpoint for validating Cerebras connection
plannerRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const cerebrasClient = new CerebrasClient(process.env.CEREBRAS_API_KEY!);
    const testResult = await cerebrasClient.testConnection();
    
    res.json({
      success: true,
      message: 'Cerebras connection successful',
      model: testResult.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Cerebras test failed', { error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

async function loadFeatureCandidates(featuresPath: string): Promise<FeatureCandidates> {
  try {
    // Check if path is absolute, if not make it relative to explorer storage
    let fullPath = featuresPath;
    if (!path.isAbsolute(featuresPath)) {
      // Assume it's relative to explorer service storage
      fullPath = path.resolve('../explorer/storage/', featuresPath);
    }
    
    logger.debug('Loading feature candidates', { featuresPath, fullPath });
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Features file not found: ${fullPath}`);
    }
    
    const data = await fs.readJSON(fullPath);
    return data as FeatureCandidates;
  } catch (error) {
    throw new Error(`Failed to load feature candidates from ${featuresPath}: ${error}`);
  }
}

async function loadCrawlSummary(crawlPath: string): Promise<CrawlSummary> {
  try {
    // Check if path is absolute, if not make it relative to explorer storage
    let fullPath = crawlPath;
    if (!path.isAbsolute(crawlPath)) {
      // Assume it's relative to explorer service storage
      fullPath = path.resolve('../explorer/storage/', crawlPath);
    }
    
    logger.debug('Loading crawl summary', { crawlPath, fullPath });
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Crawl summary file not found: ${fullPath}`);
    }
    
    const data = await fs.readJSON(fullPath);
    return data as CrawlSummary;
  } catch (error) {
    throw new Error(`Failed to load crawl summary from ${crawlPath}: ${error}`);
  }
}

function createEmptyCrawlSummary(): CrawlSummary {
  return {
    baseUrl: '',
    pages: [],
    totalPages: 0,
    maxDepth: 0,
    crawlDuration: 0,
  };
}
