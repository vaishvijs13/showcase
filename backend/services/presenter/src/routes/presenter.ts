import express, { Request, Response } from 'express';
import path from 'path';
import { logger } from '@takeone/utils';
import fs from 'fs-extra';
import { HeyGenClient } from '../services/heygen-client';
import { VideoProcessor } from '../services/video-processor';
import { RunwayClient } from '../services/runway-client';
import { HttpError } from '../middleware/error-handler';
import { PresenterScene, AIGeneratedScene } from '@takeone/types';

export const presenterRouter = express.Router();

interface GenerateRequest {
  scene: PresenterScene;
  style?: string;
  outputPath?: string;
}

interface GenerateResponse {
  success: boolean;
  videoPath: string;
  duration: number;
  error?: string;
}

interface AIGenerateRequest {
  scene: AIGeneratedScene;
  outputPath?: string;
}

interface AIGenerateResponse {
  success: boolean;
  videoPath: string;
  duration: number;
  error?: string;
}

// Generate presenter video
presenterRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { scene, style, outputPath } = req.body as GenerateRequest;
    
    if (!scene || !scene.voiceover_ssml) {
      throw new HttpError('Missing required fields: scene with voiceover_ssml', 400);
    }

    logger.info('Starting presenter video generation', { 
      sceneId: scene.id,
      duration: scene.duration_seconds,
      style: style || 'default'
    });

    // Initialize services (VIDEO GENERATION DISABLED FOR TESTING)
    // const heygenClient = new HeyGenClient(process.env.HEYGEN_API_KEY!);
    // const videoProcessor = new VideoProcessor();

    // MOCK: Generate video with HeyGen (DISABLED)
    const videoResult = {
      videoUrl: `https://example.com/mock-presenter-${scene.id}.mp4`,
      duration: scene.duration_seconds
    };

    // MOCK: Process and save the video (DISABLED)
    const finalPath = outputPath || path.join('storage', `presenter-${scene.id}.mp4`);
    await fs.ensureDir(path.dirname(finalPath));
    
    // Create a mock video file
    const mockVideoContent = `Mock video for scene ${scene.id}`;
    await fs.writeFile(finalPath, mockVideoContent);
    const processedVideoPath = finalPath;

    logger.info('Presenter video generation completed', { 
      sceneId: scene.id,
      outputPath: processedVideoPath,
      originalDuration: videoResult.duration,
      finalDuration: scene.duration_seconds
    });

    const response: GenerateResponse = {
      success: true,
      videoPath: processedVideoPath,
      duration: scene.duration_seconds
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Presenter video generation failed', { error: errorMessage });
    
    const response: GenerateResponse = {
      success: false,
      videoPath: '',
      duration: 0,
      error: errorMessage
    };

    res.status(500).json(response);
  }
});

// Batch generate multiple scenes
presenterRouter.post('/generate-batch', async (req: Request, res: Response) => {
  try {
    const { scenes, style } = req.body as { scenes: PresenterScene[]; style?: string };
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      throw new HttpError('Missing or empty scenes array', 400);
    }

    logger.info('Starting batch presenter video generation', { 
      scenesCount: scenes.length,
      style: style || 'default'
    });

    // VIDEO GENERATION DISABLED FOR TESTING
    // const heygenClient = new HeyGenClient(process.env.HEYGEN_API_KEY!);
    // const videoProcessor = new VideoProcessor();

    // MOCK: Generate all videos (DISABLED)
    const results = [];

    for (const scene of scenes) {
      try {
        // MOCK: Create mock video file
        const finalPath = path.join('storage', `presenter-${scene.id}.mp4`);
        await fs.ensureDir(path.dirname(finalPath));
        
        const mockVideoContent = `Mock video for scene ${scene.id}`;
        await fs.writeFile(finalPath, mockVideoContent);

        results.push({
          sceneId: scene.id,
          success: true,
          videoPath: finalPath,
          duration: scene.duration_seconds
        });
      } catch (error) {
        logger.error('Failed to create mock video for scene', { 
          sceneId: scene.id, 
          error: error instanceof Error ? error.message : String(error)
        });
        
        results.push({
          sceneId: scene.id,
          success: false,
          videoPath: '',
          duration: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    logger.info('Batch presenter video generation completed', { 
      total: scenes.length,
      successful: successful.length,
      failed: failed.length
    });

    res.json({
      success: failed.length === 0,
      results,
      summary: {
        total: scenes.length,
        successful: successful.length,
        failed: failed.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Batch presenter video generation failed', { error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Generate AI video using Runway ML
presenterRouter.post('/generate-ai', async (req: Request, res: Response) => {
  try {
    const { scene, outputPath } = req.body as AIGenerateRequest;
    
    if (!scene || !scene.text_prompt) {
      throw new HttpError('Missing required fields: scene with text_prompt', 400);
    }

    logger.info('Starting AI video generation', { 
      sceneId: scene.id,
      duration: scene.duration_seconds,
      textPrompt: scene.text_prompt.substring(0, 100) + '...'
    });

    // Initialize Runway ML client
    const runwayClient = new RunwayClient(process.env.RUNWAY_ML_KEY!);

    // Generate video with Runway ML
    const videoResult = await runwayClient.generateVideoFromScene(scene);
    
    // Process and save the video
    const finalPath = outputPath || path.join('storage', `ai-generated-${scene.id}.mp4`);
    await fs.ensureDir(path.dirname(finalPath));
    
    // Download the video from Runway ML URL
    const videoProcessor = new VideoProcessor();
    const processedVideoPath = await videoProcessor.processPresenterVideo(
      videoResult.videoUrl,
      finalPath,
      {
        targetDuration: scene.duration_seconds,
        normalizeAudio: false, // AI videos might not have audio
        quality: 'high'
      }
    );

    logger.info('AI video generation completed', { 
      sceneId: scene.id,
      outputPath: processedVideoPath,
      originalDuration: videoResult.duration,
      finalDuration: scene.duration_seconds
    });

    const response: AIGenerateResponse = {
      success: true,
      videoPath: processedVideoPath,
      duration: scene.duration_seconds
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('AI video generation failed', { error: errorMessage });
    
    const response: AIGenerateResponse = {
      success: false,
      videoPath: '',
      duration: 0,
      error: errorMessage
    };

    res.status(500).json(response);
  }
});

// Get available avatars (MOCKED FOR TESTING)
presenterRouter.get('/avatars', async (req: Request, res: Response) => {
  try {
    // MOCK: HeyGen avatars (DISABLED)
    const avatars = [
      { id: 'mock-avatar-1', name: 'Professional Female', style: 'professional' },
      { id: 'mock-avatar-2', name: 'Casual Male', style: 'casual' },
      { id: 'mock-avatar-3', name: 'Tech Presenter', style: 'tech' }
    ];
    
    res.json({
      success: true,
      avatars,
      count: avatars.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to fetch mock avatars', { error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get available voices (MOCKED FOR TESTING)
presenterRouter.get('/voices', async (req: Request, res: Response) => {
  try {
    // MOCK: HeyGen voices (DISABLED)
    const voices = [
      { id: 'mock-voice-1', name: 'Sarah (US English)', language: 'en-US', gender: 'female' },
      { id: 'mock-voice-2', name: 'David (US English)', language: 'en-US', gender: 'male' },
      { id: 'mock-voice-3', name: 'Emma (UK English)', language: 'en-GB', gender: 'female' }
    ];
    
    res.json({
      success: true,
      voices,
      count: voices.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to fetch mock voices', { error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test endpoint for validating HeyGen connection (DISABLED FOR TESTING)
presenterRouter.post('/test', async (req: Request, res: Response) => {
  try {
    // MOCK: HeyGen connection test (DISABLED)
    const testResult = {
      model: 'mock-heygen-model',
      status: 'connected'
    };
    
    res.json({
      success: true,
      message: 'HeyGen connection successful (MOCK)',
      model: testResult.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Mock test failed', { error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});
