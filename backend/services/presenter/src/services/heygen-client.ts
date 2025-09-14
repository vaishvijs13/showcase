import axios, { AxiosInstance } from 'axios';
import { logger } from '@takeone/utils';

export interface HeyGenVideoRequest {
  text: string;
  avatarId?: string;
  voiceId?: string;
  speed?: number;
  style?: string;
  background?: string;
}

export interface HeyGenVideoResponse {
  videoId: string;
  videoUrl?: string;
  duration?: number;
  status: 'waiting' | 'pending' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  error?: string;
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
}

export interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
  preview_audio: string;
  support_pause: boolean;
  emotion_support: boolean;
  support_interactive_avatar: boolean;
}

export class HeyGenClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('HeyGen API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = 'https://api.heygen.com';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TakeOne/1.0',
      },
      timeout: 300000, // 5 minutes timeout for video generation
    });

    logger.debug('HeyGenClient initialized', {
      baseUrl: this.baseUrl,
      hasApiKey: !!apiKey
    });
  }

  async generatePresenterVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse> {
    try {
      logger.info('Starting HeyGen video generation', {
        textLength: request.text.length,
        avatarId: request.avatarId,
        voiceId: request.voiceId
      });

      // Get default avatar and voice if not specified
      // Try June_HR_public avatar which might be available on free tier
      const avatarId = request.avatarId || 'June_HR_public';
      const voiceId = request.voiceId || '119caed25533477ba63822d5d1552d25';

      // Create video generation request (matching working example format)
      const videoData = {
        dimension: {
          width: 720,
          height: 480
        },
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              scale: 1.0
            },
            voice: {
              type: 'text',
              voice_id: voiceId,
              input_text: request.text
            },
            background: {
              type: 'color',
              value: '#f6f6fc'
            }
          }
        ]
      };

      const response = await this.client.post('/v2/video/generate', videoData);

      const videoId = response.data.data?.video_id;
      if (!videoId) {
        throw new Error('No video ID received from HeyGen API');
      }

      logger.info('HeyGen video generation started', { videoId });

      // Poll for completion
      const result = await this.waitForCompletion(videoId);
      
      if (result.status === 'failed') {
        throw new Error(`HeyGen video generation failed: ${result.error}`);
      }

      logger.info('HeyGen video generation completed', {
        videoId,
        videoUrl: result.videoUrl,
        duration: result.duration
      });

      return {
        videoId,
        videoUrl: result.videoUrl!,
        duration: result.duration,
        status: 'completed'
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('HeyGen API error', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });
        
        if (error.response?.status === 401) {
          throw new Error('Invalid HeyGen API key');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded for HeyGen API');
        } else if (error.response?.status === 402) {
          throw new Error('HeyGen API quota exceeded');
        }
        
        throw new Error(`HeyGen API error: ${error.response?.data?.message || error.message}`);
      }
      
      throw new Error(`Failed to generate presenter video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async waitForCompletion(videoId: string): Promise<HeyGenVideoResponse> {
    const maxAttempts = 60; // 10 minutes with 10s intervals
    const pollInterval = 10000; // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.client.get(`/v1/video_status.get?video_id=${videoId}`);
        const data = response.data.data;

        const status: HeyGenVideoResponse = {
          videoId: data.id,
          status: data.status,
          videoUrl: data.video_url || undefined,
          duration: data.duration || undefined,
          thumbnailUrl: data.thumbnail_url || undefined,
          error: data.error?.message || undefined
        };

        logger.info('HeyGen video status', { 
          videoId, 
          status: status.status, 
          attempt,
          hasVideoUrl: !!status.videoUrl
        });

        if (status.status === 'completed' && status.videoUrl) {
          return status;
        } else if (status.status === 'failed') {
          return status;
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        logger.warn('Failed to check HeyGen video status', { videoId, attempt, error });
        
        if (attempt === maxAttempts) {
          throw new Error(`Timeout waiting for HeyGen video generation after ${maxAttempts} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Timeout waiting for HeyGen video generation');
  }

  async getAvailableAvatars(): Promise<HeyGenAvatar[]> {
    try {
      const response = await this.client.get('/v2/avatars');
      return response.data.data?.avatars || [];
    } catch (error) {
      logger.warn('Failed to fetch HeyGen avatars', { error });
      // Return default avatars as fallback
      return [
        {
          avatar_id: 'Lina_Dress_Sitting_Side_public',
          avatar_name: 'Lina in Dress (Professional)',
          gender: 'female',
          preview_image_url: '',
          preview_video_url: ''
        }
      ];
    }
  }

  async getAvailableVoices(): Promise<HeyGenVoice[]> {
    try {
      const response = await this.client.get('/v2/voices');
      return response.data.data?.voices || [];
    } catch (error) {
      logger.warn('Failed to fetch HeyGen voices', { error });
      // Return default voices as fallback
      return [
        {
          voice_id: '119caed25533477ba63822d5d1552d25',
          language: 'English',
          gender: 'female',
          name: 'Professional Female',
          preview_audio: '',
          support_pause: false,
          emotion_support: true,
          support_interactive_avatar: true
        }
      ];
    }
  }

  async testConnection(): Promise<{ success: boolean; model: string }> {
    try {
      // Just test the API connection, don't actually generate

      // Just test the API connection, don't actually generate
      await this.client.get('/v2/avatars'); // Simple test endpoint

      return {
        success: true,
        model: 'heygen-avatar-v2'
      };
    } catch (error) {
      logger.error('HeyGen connection test failed', { error });
      throw error;
    }
  }
}

