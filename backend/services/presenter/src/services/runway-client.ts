import RunwayML, { TaskFailedError } from '@runwayml/sdk';
import { logger } from '@takeone/utils';
import { AIGeneratedScene } from '@takeone/types';

export interface RunwayVideoRequest {
  text_prompt: string;
  image_prompt?: string;
  duration_seconds?: number;
  aspect_ratio?: string;
  style?: string;
  seed?: number;
}

export interface RunwayVideoResponse {
  taskId: string;
  videoUrl: string;
  duration: number;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
}

export class RunwayClient {
  private client: RunwayML;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Runway ML API key is required');
    }

    this.client = new RunwayML({
      apiKey: apiKey
    });

    logger.info('Runway ML client initialized with official SDK', {
      hasApiKey: !!apiKey
    });
  }

  private convertAspectRatio(aspectRatio: string): '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672' | '1280:768' | '768:1280' {
    // Convert from "16:9" format to exact types that Runway expects for imageToVideo
    const ratioMap: { [key: string]: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672' | '1280:768' | '768:1280' } = {
      '16:9': '1280:720',
      '9:16': '720:1280', 
      '1:1': '960:960',
      '4:3': '1104:832',
      '3:4': '832:1104'
    };
    
    return ratioMap[aspectRatio] || '1280:720';
  }

  private convertTextToVideoRatio(aspectRatio: string): '1280:720' | '720:1280' {
    // Text-to-video only supports these two ratios
    return aspectRatio === '9:16' ? '720:1280' : '1280:720';
  }

  private validateDuration(duration?: number, isImageToVideo: boolean = true): 5 | 8 | 10 {
    if (isImageToVideo) {
      // Image-to-video supports 5, 8, or 10 seconds
      if (duration === 8) return 8;
      if (duration === 10) return 10;
      return 5; // default
    } else {
      // Text-to-video only supports 8 seconds
      return 8;
    }
  }

  async generateVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
    try {
      logger.info('Starting Runway ML video generation', {
        textPromptLength: request.text_prompt.length,
        hasImagePrompt: !!request.image_prompt,
        duration: request.duration_seconds,
        aspectRatio: request.aspect_ratio
      });

      let task;
      
      if (request.image_prompt) {
        // Image-to-video generation
        const ratio = this.convertAspectRatio(request.aspect_ratio || '16:9');
        const duration = this.validateDuration(request.duration_seconds, true);
        
        task = await this.client.imageToVideo
          .create({
            model: 'gen4_turbo',
            promptImage: request.image_prompt,
            promptText: request.text_prompt,
            ratio: ratio,
            duration: duration
          })
          .waitForTaskOutput();
      } else {
        // Text-to-video generation - only supports veo3 model and 8 seconds
        const ratio = this.convertTextToVideoRatio(request.aspect_ratio || '16:9');
        
        task = await this.client.textToVideo
          .create({
            model: 'veo3', // Text-to-video only supports veo3
            promptText: request.text_prompt,
            ratio: ratio,
            duration: 8 // Text-to-video only supports 8 seconds
          })
          .waitForTaskOutput();
      }

      // Handle output format - it's an array of URLs
      const videoUrl = Array.isArray(task.output) ? task.output[0] : task.output;

      logger.info('Runway ML video generation completed', {
        taskId: task.id,
        videoUrl: videoUrl,
        duration: request.duration_seconds
      });

      return {
        taskId: task.id,
        videoUrl: videoUrl || '',
        duration: request.duration_seconds || 5,
        status: 'completed'
      };

    } catch (error) {
      if (error instanceof TaskFailedError) {
        logger.error('Runway ML task failed', {
          error: error.message,
          taskDetails: error.taskDetails
        });
        throw new Error(`Runway ML video generation failed: ${error.message}`);
      } else {
        logger.error('Runway ML video generation failed', { error });
        throw new Error(`Runway ML video generation failed: ${error}`);
      }
    }
  }

  async generateVideoFromScene(scene: AIGeneratedScene): Promise<RunwayVideoResponse> {
    const request: RunwayVideoRequest = {
      text_prompt: scene.text_prompt,
      image_prompt: scene.image_prompt,
      duration_seconds: scene.duration_seconds,
      aspect_ratio: scene.aspect_ratio,
      style: scene.style,
      seed: scene.seed
    };

    return this.generateVideo(request);
  }

  // Simple text-to-video test method
  async generateTestVideo(): Promise<RunwayVideoResponse> {
    logger.info('Generating test video with Runway ML');
    
    const request: RunwayVideoRequest = {
      text_prompt: "A colorful geometric shape rotating slowly, professional lighting, clean background",
      duration_seconds: 3,
      aspect_ratio: "16:9"
    };

    return this.generateVideo(request);
  }

  // Test method to validate API connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to generate a very short test video
      await this.generateTestVideo();
      return true;
    } catch (error) {
      logger.error('Runway ML connection test failed', { error });
      return false;
    }
  }
} 