import { logger } from '@takeone/utils';
import { EnhancedStoryboard } from '@takeone/types';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

export interface CompositionConfig {
  musicVolume: number;
  includeMusic: boolean;
  quality: 'high' | 'medium' | 'low';
  resolution: '1920x1080' | '1280x720' | '854x480';
  addTransitions: boolean;
  addIntro: boolean;
  addOutro: boolean;
  fps?: number;
}

export interface CompositionRequest {
  jobId: string;
  storyboard: EnhancedStoryboard;
  scenePaths: string[];
  musicPath?: string;
  outputDir: string;
  config: CompositionConfig;
}

export interface CompositionResult {
  videoPath: string;
  duration: number;
  resolution: string;
  fileSize: number;
}

export class VideoComposer {
  private readonly ffmpegPath: string;
  private readonly tempDir: string;

  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    this.tempDir = process.env.TEMP_DIR || './temp';
    
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  async composeVideo(request: CompositionRequest): Promise<CompositionResult> {
    const { jobId, storyboard, scenePaths, musicPath, outputDir, config } = request;
    
    logger.info('Starting video composition', {
      jobId,
      scenesCount: scenePaths.length,
      hasMusic: !!musicPath,
      config
    });

    try {
      // Prepare output path
      const outputPath = path.join(outputDir, 'final-video.mp4');
      await fs.ensureDir(outputDir);

      // Create video sequence based on storyboard
      const videoSequence = await this.createVideoSequence(storyboard, scenePaths);
      
      // Build FFmpeg command for composition
      const ffmpegArgs = await this.buildCompositionCommand(
        videoSequence,
        musicPath,
        outputPath,
        config
      );

      // Execute FFmpeg composition
      await this.executeFFmpeg(ffmpegArgs);

      // Get result metadata
      const stats = await fs.stat(outputPath);
      const metadata = await this.getVideoMetadata(outputPath);

      const result: CompositionResult = {
        videoPath: outputPath,
        duration: metadata.duration,
        resolution: `${metadata.width}x${metadata.height}`,
        fileSize: stats.size
      };

      logger.info('Video composition completed', {
        jobId,
        ...result
      });

      return result;
    } catch (error) {
      logger.error('Video composition failed', { jobId, error });
      throw new Error(`Video composition failed: ${error}`);
    }
  }

  private async createVideoSequence(
    storyboard: EnhancedStoryboard,
    scenePaths: string[]
  ): Promise<Array<{ path: string; duration: number; type: 'presenter' | 'screen_demo' }>> {
    const sequence = [];
    
    logger.info('Creating video sequence', {
      storyboardScenes: storyboard.scenes.map(s => s.id),
      availableVideos: scenePaths.map(p => p.split('/').pop()),
      totalScenePaths: scenePaths.length
    });
    
    // Filter presenter and screen demo videos separately
    const presenterVideos = scenePaths.filter(path => path.includes('presenter'));
    const screenVideos = scenePaths.filter(path => path.includes('scene-') && path.endsWith('.webm'));
    
    logger.info('Categorized videos', {
      presenterCount: presenterVideos.length,
      screenCount: screenVideos.length,
      presenterVideos: presenterVideos.map(p => p.split('/').pop()),
      screenVideos: screenVideos.map(p => p.split('/').pop())
    });
    
    // Validate and add videos to sequence
    const allVideos = [...presenterVideos, ...screenVideos];
    
    for (let i = 0; i < allVideos.length; i++) {
      const videoPath = allVideos[i];
      
      // Check if file exists and is valid
      if (await this.isValidVideoFile(videoPath)) {
        const isPresenter = videoPath.includes('presenter');
        sequence.push({
          path: videoPath,
          duration: 10, // Default duration
          type: isPresenter ? 'presenter' as const : 'screen_demo' as const
        });
        
        logger.debug('Added validated video to sequence', { 
          index: i,
          path: videoPath.split('/').pop(),
          type: isPresenter ? 'presenter' : 'screen_demo'
        });
      } else {
        logger.warn('Skipping invalid or corrupted video file', { path: videoPath });
      }
    }

    logger.info('Video sequence created', { 
      totalScenes: sequence.length,
      totalDuration: sequence.reduce((sum, s) => sum + s.duration, 0)
    });

    return sequence;
  }

  private async isValidVideoFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!(await fs.pathExists(filePath))) {
        return false;
      }

      // Check file size (videos should be at least 1KB)
      const stats = await fs.stat(filePath);
      if (stats.size < 1024) {
        logger.warn('Video file too small, likely corrupted', { 
          path: filePath.split('/').pop(), 
          size: stats.size 
        });
        return false;
      }

      // Use ffprobe to validate the video file
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const ffprobe = spawn('ffprobe', [
          '-v', 'quiet',
          '-show_format',
          '-show_streams',
          filePath
        ]);

        let stdout = '';
        let stderr = '';

        ffprobe.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        ffprobe.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        ffprobe.on('close', (code: number) => {
          if (code === 0 && stdout.includes('[FORMAT]') && stdout.includes('[STREAM]')) {
            resolve(true);
          } else {
            logger.warn('Video validation failed', { 
              path: filePath.split('/').pop(), 
              code, 
              error: stderr.substring(0, 200) 
            });
            resolve(false);
          }
        });

        ffprobe.on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      logger.warn('Error validating video file', { 
        path: filePath.split('/').pop(), 
        error: (error as Error).message 
      });
      return false;
    }
  }

  private async hasAudioStream(filePath: string): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const ffprobe = spawn('ffprobe', [
          '-v', 'quiet',
          '-select_streams', 'a',
          '-show_entries', 'stream=codec_type',
          '-of', 'csv=p=0',
          filePath
        ]);

        let stdout = '';
        let stderr = '';

        ffprobe.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        ffprobe.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        ffprobe.on('close', (code: number) => {
          const hasAudio = stdout.trim().includes('audio');
          logger.debug('Audio stream check', { 
            path: filePath.split('/').pop(), 
            hasAudio,
            stdout: stdout.trim()
          });
          resolve(hasAudio);
        });

        ffprobe.on('error', () => {
          logger.warn('Error checking audio stream', { path: filePath });
          resolve(false);
        });
      });
    } catch (error) {
      logger.warn('Error checking audio stream', { 
        path: filePath.split('/').pop(), 
        error: (error as Error).message 
      });
      return false;
    }
  }

  private async buildCompositionCommand(
    videoSequence: Array<{ path: string; duration: number; type: string }>,
    musicPath: string | undefined,
    outputPath: string,
    config: CompositionConfig
  ): Promise<string[]> {
    // Use a simpler, more reliable approach with concat demuxer
    if (videoSequence.length === 0) {
      throw new Error('No valid videos to concatenate');
    }

    // If only one video, use simpler approach
    if (videoSequence.length === 1) {
      return await this.buildSingleVideoCommand(videoSequence[0], musicPath, outputPath, config);
    }

    // For multiple videos, use concat demuxer (more reliable than filter_complex)
    return await this.buildConcatDemuxerCommand(videoSequence, musicPath, outputPath, config);
  }

  private async buildSingleVideoCommand(
    video: { path: string; duration: number; type: string },
    musicPath: string | undefined,
    outputPath: string,
    config: CompositionConfig
  ): Promise<string[]> {
    const args: string[] = ['-y', '-i', video.path];

    // Check if video has audio
    const videoHasAudio = await this.hasAudioStream(video.path);

    // Add music if provided
    if (musicPath && config.includeMusic) {
      args.push('-i', musicPath);
      
      const musicVolume = config.musicVolume || 0.3;
      
      if (videoHasAudio) {
        // Video has audio - mix with music
        const videoVolume = 1.0 - musicVolume * 0.5;
        args.push(
          '-filter_complex',
          `[0:a]volume=${videoVolume}[va];[1:a]volume=${musicVolume}[ma];[va][ma]amix=inputs=2:duration=first[a]`,
          '-map', '0:v',
          '-map', '[a]'
        );
      } else {
        // Video has NO audio - use OPTION A: Just use music as audio track
        args.push(
          '-filter_complex',
          `[1:a]volume=${musicVolume}[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-shortest' // Stop when video ends
        );
      }
    } else {
      // No music
      if (videoHasAudio) {
        // Just copy video audio
        args.push('-map', '0:v', '-map', '0:a');
      } else {
        // No audio at all - video only
        args.push('-map', '0:v', '-an'); // -an = no audio
      }
    }

    // Video scaling
    const scaleFilter = this.getScaleFilter(config.resolution);
    args.push('-vf', `${scaleFilter},setsar=1`);

    // Encoding settings
    const qualitySettings = this.getQualitySettings(config.quality);
    args.push(...qualitySettings);

    // Audio settings (only if we have audio)
    if (musicPath || videoHasAudio) {
      args.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
    }

    // Frame rate
    if (config.fps) {
      args.push('-r', config.fps.toString());
    }

    args.push(outputPath);
    return args;
  }

  private async buildConcatDemuxerCommand(
    videoSequence: Array<{ path: string; duration: number; type: string }>,
    musicPath: string | undefined,
    outputPath: string,
    config: CompositionConfig
  ): Promise<string[]> {
    // Create a temporary concat file list
    const concatFile = path.join(path.dirname(outputPath), 'concat_list.txt');
    const concatContent = videoSequence
      .map(video => `file '${path.resolve(video.path)}'`)
      .join('\n');
    
    await fs.writeFile(concatFile, concatContent);

    const args: string[] = ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile];

    // Check if concatenated video has audio by checking first video
    const firstVideoHasAudio = await this.hasAudioStream(videoSequence[0].path);

    // Add music if provided
    if (musicPath && config.includeMusic) {
      args.push('-i', musicPath);
      
      const musicVolume = config.musicVolume || 0.3;
      
      if (firstVideoHasAudio) {
        // Video has audio - mix with music
        const videoVolume = 1.0 - musicVolume * 0.5;
        args.push(
          '-filter_complex',
          `[0:a]volume=${videoVolume}[va];[1:a]volume=${musicVolume}[ma];[va][ma]amix=inputs=2:duration=first[a]`,
          '-map', '0:v',
          '-map', '[a]'
        );
      } else {
        // Video has NO audio - use OPTION A: Just use music as audio track
        args.push(
          '-filter_complex',
          `[1:a]volume=${musicVolume}[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-shortest' // Stop when video ends
        );
      }
    } else {
      // No music
      if (firstVideoHasAudio) {
        // Just copy video audio
        args.push('-map', '0:v', '-map', '0:a');
      } else {
        // No audio at all - video only
        args.push('-map', '0:v', '-an'); // -an = no audio
      }
    }

    // Video scaling
    const scaleFilter = this.getScaleFilter(config.resolution);
    args.push('-vf', `${scaleFilter},setsar=1`);

    // Encoding settings
    const qualitySettings = this.getQualitySettings(config.quality);
    args.push(...qualitySettings);

    // Audio settings (only if we have audio)
    if (musicPath || firstVideoHasAudio) {
      args.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
    }

    // Frame rate
    if (config.fps) {
      args.push('-r', config.fps.toString());
    }

    args.push(outputPath);
    return args;
  }

  private getScaleFilter(resolution: string): string {
    switch (resolution) {
      case '1920x1080':
        return 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
      case '1280x720':
        return 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2';
      case '854x480':
        return 'scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2';
      default:
        return 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
    }
  }

  private getQualitySettings(quality: string): string[] {
    switch (quality) {
      case 'high':
        return ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium'];
      case 'medium':
        return ['-c:v', 'libx264', '-crf', '23', '-preset', 'fast'];
      case 'low':
        return ['-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast'];
      default:
        return ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium'];
    }
  }

  private async executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Executing FFmpeg composition', { 
        command: `${this.ffmpegPath} ${args.join(' ')}`.substring(0, 200) + '...'
      });

      const process = spawn(this.ffmpegPath, args);
      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log progress if available
        const progressMatch = stderr.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (progressMatch) {
          logger.debug('FFmpeg progress', { time: progressMatch[1] });
        }
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('FFmpeg composition completed successfully');
          resolve();
        } else {
          logger.error('FFmpeg composition failed', { code, stderr: stderr.substring(-1000) });
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        logger.error('FFmpeg process error', { error });
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private async getVideoMetadata(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    codec: string;
  }> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const process = spawn('ffprobe', args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(stdout);
            const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
            
            resolve({
              duration: parseFloat(metadata.format.duration),
              width: videoStream.width,
              height: videoStream.height,
              codec: videoStream.codec_name
            });
          } catch (parseError) {
            reject(new Error(`Failed to parse video metadata: ${parseError}`));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async createPreview(
    request: CompositionRequest,
    previewDuration: number = 30
  ): Promise<string> {
    const previewPath = path.join(request.outputDir, 'preview.mp4');
    
    // Create a shortened version for preview
    const shortRequest = {
      ...request,
      config: {
        ...request.config,
        quality: 'medium' as const
      }
    };

    // Limit video sequence to preview duration
    const originalSequence = await this.createVideoSequence(request.storyboard, request.scenePaths);
    let currentDuration = 0;
    const previewSequence = [];
    
    for (const video of originalSequence) {
      if (currentDuration >= previewDuration) break;
      
      const remainingTime = previewDuration - currentDuration;
      const videoDuration = Math.min(video.duration, remainingTime);
      
      previewSequence.push({
        ...video,
        duration: videoDuration
      });
      
      currentDuration += videoDuration;
    }

    // Build preview-specific FFmpeg command
    const ffmpegArgs = await this.buildCompositionCommand(
      previewSequence,
      request.musicPath,
      previewPath,
      shortRequest.config
    );

    // Add duration limit
    ffmpegArgs.splice(-1, 0, '-t', previewDuration.toString());

    await this.executeFFmpeg(ffmpegArgs);
    
    return previewPath;
  }
}
