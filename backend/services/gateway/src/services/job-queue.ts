import Bull from 'bull';
import Redis from 'ioredis';
import { logger } from '@takeone/utils';
import { JobConfig } from '@takeone/types';
import { PipelineOrchestrator } from './pipeline-orchestrator';

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'ingesting' | 'crawling' | 'planning' | 'generating' | 'recording' | 'composing' | 'complete' | 'error';
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  artifacts?: {
    storyboard?: string;
    scenes?: string[];
    finalVideo?: string;
  };
}

export class JobQueue {
  private queue: Bull.Queue;
  private redis: Redis;
  private orchestrator: PipelineOrchestrator;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
    });

    // Initialize Bull queue
    this.queue = new Bull('video-pipeline', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: 0,
        timeout: 300000, // 5 minutes
      },
    });

    this.orchestrator = new PipelineOrchestrator();

    // Set up job processing
    this.setupJobProcessing();
  }

  private setupJobProcessing(): void {
    // Process jobs one at a time to avoid overwhelming services
    this.queue.process('pipeline', 1, async (job) => {
      const jobConfig: JobConfig = job.data;
      logger.info('Starting pipeline job', { jobId: jobConfig.id });

      try {
        // Update job status
        await this.updateJobStatus(jobConfig.id, 'ingesting', 0, 'Starting repository ingestion');

        // Execute the full pipeline
        const result = await this.orchestrator.executePipeline(jobConfig, {
          onProgress: async (step: string, progress: number) => {
            const statusMap: Record<string, JobStatus['status']> = {
              'ingest': 'ingesting',
              'crawl': 'crawling', 
              'plan': 'planning',
              'generate': 'generating',
              'record': 'recording',
              'compose': 'composing'
            };
            
            await this.updateJobStatus(
              jobConfig.id, 
              statusMap[step] || 'processing' as any, 
              progress, 
              step
            );
          }
        });

        // Mark as complete
        await this.updateJobStatus(jobConfig.id, 'complete', 100, 'Pipeline completed', undefined, result.artifacts);
        
        logger.info('Pipeline job completed', { jobId: jobConfig.id, artifacts: result.artifacts });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Pipeline job failed', { jobId: jobConfig.id, error: errorMessage });
        
        await this.updateJobStatus(jobConfig.id, 'error', 0, 'Pipeline failed', errorMessage);
        throw error;
      }
    });

    // Handle job events
    this.queue.on('completed', (job) => {
      logger.info('Job completed', { jobId: job.data.id });
    });

    this.queue.on('failed', (job, err) => {
      logger.error('Job failed', { jobId: job.data.id, error: err.message });
    });
  }

  async addJob(jobConfig: JobConfig): Promise<Bull.Job> {
    // Store initial job status
    await this.updateJobStatus(jobConfig.id, 'pending', 0, 'Job queued');
    
    // Add to Bull queue
    const job = await this.queue.add('pipeline', jobConfig, {
      jobId: jobConfig.id,
    });

    return job;
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const statusKey = `job:${jobId}:status`;
    
    try {
      const statusData = await this.redis.get(statusKey);
      
      if (!statusData) {
        logger.warn('Job status not found in Redis', { jobId, statusKey });
        return null;
      }

      const parsed = JSON.parse(statusData) as JobStatus;
      logger.debug('Retrieved job status', { jobId, status: parsed.status });
      return parsed;
    } catch (error) {
      logger.error('Failed to get job status', { jobId, error });
      return null;
    }
  }

  async getJobResults(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const status = await this.getJobStatus(jobId);
    if (!status || status.status !== 'complete') {
      return { status: 'not_ready', message: 'Job not completed yet' };
    }

    return {
      jobId,
      status: 'complete',
      artifacts: status.artifacts,
      completedAt: status.completedAt,
    };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }

    try {
      await job.remove();
      await this.updateJobStatus(jobId, 'error', 0, 'Job cancelled', 'Cancelled by user');
      return true;
    } catch (error) {
      logger.error('Failed to cancel job', { jobId, error });
      return false;
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: JobStatus['status'], 
    progress: number, 
    currentStep?: string, 
    error?: string,
    artifacts?: JobStatus['artifacts']
  ): Promise<void> {
    const statusKey = `job:${jobId}:status`;
    const now = new Date().toISOString();
    
    // Get existing status to preserve createdAt
    const existing = await this.getJobStatus(jobId);
    
    const jobStatus: JobStatus = {
      jobId,
      status,
      progress,
      currentStep,
      error,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      completedAt: status === 'complete' || status === 'error' ? now : existing?.completedAt,
      artifacts: artifacts || existing?.artifacts,
    };

    try {
      await this.redis.setex(statusKey, 3600 * 24, JSON.stringify(jobStatus)); // 24 hour TTL
      logger.debug('Updated job status', { jobId, status, statusKey });
    } catch (error) {
      logger.error('Failed to update job status', { jobId, status, error });
      throw error;
    }
  }
}
