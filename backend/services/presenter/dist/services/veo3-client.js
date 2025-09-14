import axios from 'axios';
import FormData from 'form-data';
import { logger } from '@takeone/utils';
export class Veo3Client {
    client;
    baseUrl;
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Veo3 API key is required');
        }
        this.baseUrl = process.env.VEO3_BASE_URL || 'https://api.veo3.com/v1';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'TakeOne/1.0',
            },
            timeout: 120000, // 2 minutes timeout for video generation
        });
    }
    async generatePresenterVideo(request) {
        try {
            logger.info('Starting Veo3 video generation', {
                textLength: request.text.length,
                duration: request.duration,
                style: request.style
            });
            // Create video generation request
            const formData = new FormData();
            formData.append('text', request.text);
            formData.append('duration', request.duration.toString());
            formData.append('style', request.style);
            formData.append('background', request.background || 'modern-office');
            formData.append('voice', request.voice || 'professional-male');
            formData.append('format', 'mp4');
            formData.append('resolution', '1920x1080');
            const response = await this.client.post('/generate', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            const jobId = response.data.id;
            if (!jobId) {
                throw new Error('No job ID received from Veo3 API');
            }
            logger.info('Veo3 video generation started', { jobId });
            // Poll for completion
            const result = await this.waitForCompletion(jobId);
            if (result.status === 'failed') {
                throw new Error(`Veo3 video generation failed: ${result.error}`);
            }
            logger.info('Veo3 video generation completed', {
                jobId,
                videoUrl: result.videoUrl,
                duration: request.duration
            });
            return {
                videoId: jobId,
                videoUrl: result.videoUrl,
                duration: request.duration,
                status: 'ready'
            };
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('Veo3 API error', {
                    status: error.response?.status,
                    message: error.response?.data?.error || error.message,
                    url: error.config?.url,
                });
                if (error.response?.status === 401) {
                    throw new Error('Invalid Veo3 API key');
                }
                else if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded for Veo3 API');
                }
                else if (error.response?.status === 402) {
                    throw new Error('Veo3 API quota exceeded');
                }
                throw new Error(`Veo3 API error: ${error.response?.data?.error || error.message}`);
            }
            throw new Error(`Failed to generate presenter video: ${error}`);
        }
    }
    async waitForCompletion(jobId) {
        const maxAttempts = 60; // 10 minutes with 10s intervals
        const pollInterval = 10000; // 10 seconds
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await this.client.get(`/jobs/${jobId}`);
                const status = response.data;
                logger.info('Veo3 job status', {
                    jobId,
                    status: status.status,
                    progress: status.progress,
                    attempt
                });
                if (status.status === 'completed' && status.videoUrl) {
                    return status;
                }
                else if (status.status === 'failed') {
                    return status;
                }
                // Continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            catch (error) {
                logger.warn('Failed to check Veo3 job status', { jobId, attempt, error });
                if (attempt === maxAttempts) {
                    throw new Error(`Timeout waiting for Veo3 video generation after ${maxAttempts} attempts`);
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        throw new Error('Timeout waiting for Veo3 video generation');
    }
    async testConnection() {
        try {
            // Test with a minimal video generation request
            const testFormData = new FormData();
            testFormData.append('text', 'Hello, this is a test.');
            testFormData.append('duration', '3');
            testFormData.append('style', 'professional');
            testFormData.append('test_mode', 'true'); // Use test mode if available
            const response = await this.client.post('/test', testFormData, {
                headers: {
                    ...testFormData.getHeaders(),
                },
            });
            return {
                success: true,
                model: response.data.model || 'veo3-standard'
            };
        }
        catch (error) {
            logger.error('Veo3 connection test failed', { error });
            throw error;
        }
    }
    async getAvailableStyles() {
        try {
            const response = await this.client.get('/styles');
            return response.data.styles || ['professional', 'casual', 'energetic', 'formal'];
        }
        catch (error) {
            logger.warn('Failed to fetch Veo3 styles', { error });
            // Return default styles as fallback
            return ['professional', 'casual', 'energetic', 'formal'];
        }
    }
    async getAvailableVoices() {
        try {
            const response = await this.client.get('/voices');
            return response.data.voices || ['professional-male', 'professional-female', 'friendly-male', 'friendly-female'];
        }
        catch (error) {
            logger.warn('Failed to fetch Veo3 voices', { error });
            // Return default voices as fallback
            return ['professional-male', 'professional-female', 'friendly-male', 'friendly-female'];
        }
    }
}
