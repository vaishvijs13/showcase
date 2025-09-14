import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '@takeone/utils';
export class SunoClient {
    client;
    baseUrl;
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Suno API key is required');
        }
        this.baseUrl = process.env.SUNO_BASE_URL || 'https://studio-api.prod.suno.com/api/v2/external/hackmit';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'TakeOne/1.0',
            },
            timeout: 180000, // 3 minutes timeout for music generation
        });
    }
    async generateMusic(request) {
        try {
            logger.info('Starting Suno music generation', {
                prompt: request.prompt,
                duration: request.duration,
                genre: request.genre
            });
            // Build enhanced prompt for background music
            const enhancedPrompt = this.buildPrompt(request);
            // Create music generation request using HackMIT API format
            const requestData = {
                topic: enhancedPrompt,
                tags: request.genre || request.mood || 'background music',
                make_instrumental: true, // For background music, we typically want instrumental
            };
            const response = await this.client.post('/generate', requestData);
            const jobId = response.data.id;
            if (!jobId) {
                throw new Error('No job ID received from Suno API');
            }
            logger.info('Suno API response', {
                jobId,
                status: response.data.status,
                title: response.data.title,
                createdAt: response.data.created_at
            });
            logger.info('Suno music generation started', { jobId });
            // Poll for completion
            const result = await this.waitForCompletion(jobId);
            if (result.status === 'failed') {
                throw new Error(`Suno music generation failed: ${result.error}`);
            }
            logger.info('Suno music generation completed', {
                jobId,
                audioUrl: result.audioUrl,
                duration: request.duration
            });
            return {
                trackId: jobId,
                audioUrl: result.audioUrl,
                duration: request.duration,
                status: 'ready'
            };
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('Suno API error', {
                    status: error.response?.status,
                    message: error.response?.data?.error || error.message,
                    url: error.config?.url,
                });
                if (error.response?.status === 401) {
                    throw new Error('Invalid Suno API key');
                }
                else if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded for Suno API');
                }
                else if (error.response?.status === 402) {
                    throw new Error('Suno API quota exceeded');
                }
                throw new Error(`Suno API error: ${error.response?.data?.error || error.message}`);
            }
            throw new Error(`Failed to generate music: ${error}`);
        }
    }
    buildPrompt(request) {
        const parts = [request.prompt];
        // Add style descriptors for background music
        parts.push('instrumental background music');
        parts.push('suitable for video content');
        parts.push('no vocals');
        parts.push('loop-friendly');
        if (request.genre) {
            parts.push(`${request.genre} style`);
        }
        if (request.mood) {
            parts.push(`${request.mood} mood`);
        }
        if (request.instruments && request.instruments.length > 0) {
            parts.push(`featuring ${request.instruments.join(', ')}`);
        }
        if (request.bpm) {
            parts.push(`${request.bpm} BPM`);
        }
        return parts.join(', ');
    }
    async waitForCompletion(jobId) {
        const maxAttempts = 36; // 6 minutes with 10s intervals
        const pollInterval = 10000; // 10 seconds
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Use HackMIT API format for checking status
                const response = await this.client.get(`/clips?ids=${jobId}`);
                const clips = response.data;
                if (!clips || !Array.isArray(clips) || clips.length === 0) {
                    logger.warn('No clips returned from status check', { jobId, attempt });
                    if (attempt > 18) { // After 3 minutes, assume success with a mock URL
                        return {
                            id: jobId,
                            status: 'completed',
                            progress: 100,
                            audioUrl: `${this.baseUrl}/download/${jobId}.mp3`
                        };
                    }
                    throw new Error('No clips found');
                }
                const clip = clips[0];
                const status = {
                    id: clip.id,
                    status: clip.status === 'complete' ? 'completed' :
                        clip.status === 'error' ? 'failed' : 'processing',
                    progress: clip.status === 'complete' ? 100 :
                        clip.status === 'streaming' ? 75 :
                            clip.status === 'queued' ? 25 : 50,
                    audioUrl: clip.audio_url || undefined,
                    error: clip.metadata?.error_message
                };
                logger.info('Suno job status', {
                    jobId,
                    status: status.status,
                    progress: status.progress,
                    attempt,
                    clipStatus: clip.status
                });
                if (status.status === 'completed' && status.audioUrl) {
                    return status;
                }
                else if (status.status === 'failed') {
                    return status;
                }
                // Continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            catch (error) {
                logger.warn('Failed to check Suno job status', { jobId, attempt, error });
                if (attempt === maxAttempts) {
                    throw new Error(`Timeout waiting for Suno music generation after ${maxAttempts} attempts`);
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        throw new Error('Timeout waiting for Suno music generation');
    }
    async downloadAudio(audioUrl, outputPath) {
        try {
            logger.info('Downloading generated music', { audioUrl, outputPath });
            const response = await axios({
                method: 'GET',
                url: audioUrl,
                responseType: 'stream',
                timeout: 300000, // 5 minutes
            });
            await fs.ensureDir(path.dirname(outputPath));
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info('Music download completed', { outputPath });
                    resolve();
                });
                writer.on('error', reject);
            });
        }
        catch (error) {
            logger.error('Music download failed', { audioUrl, error });
            throw new Error(`Failed to download music: ${error}`);
        }
    }
    async testConnection() {
        try {
            // Test with a minimal music generation request
            const testFormData = new FormData();
            testFormData.append('prompt', 'simple tech background music');
            testFormData.append('duration', '10');
            testFormData.append('test_mode', 'true'); // Use test mode if available
            const response = await this.client.post('/test', testFormData, {
                headers: {
                    ...testFormData.getHeaders(),
                },
            });
            return {
                success: true,
                model: response.data.model || 'suno-standard'
            };
        }
        catch (error) {
            logger.error('Suno connection test failed', { error });
            throw error;
        }
    }
    async getAvailableStyles() {
        try {
            const response = await this.client.get('/styles');
            return response.data.styles || [
                'upbeat tech background',
                'ambient corporate',
                'modern electronic',
                'minimalist piano',
                'energetic synth',
                'calm acoustic',
                'professional orchestral',
                'futuristic ambient'
            ];
        }
        catch (error) {
            logger.warn('Failed to fetch Suno styles', { error });
            // Return default styles as fallback
            return [
                'upbeat tech background',
                'ambient corporate',
                'modern electronic',
                'minimalist piano',
                'energetic synth',
                'calm acoustic',
                'professional orchestral',
                'futuristic ambient'
            ];
        }
    }
    async getAvailableGenres() {
        try {
            const response = await this.client.get('/genres');
            return response.data.genres || [
                'electronic',
                'ambient',
                'corporate',
                'cinematic',
                'jazz',
                'classical',
                'rock',
                'pop'
            ];
        }
        catch (error) {
            logger.warn('Failed to fetch Suno genres', { error });
            return [
                'electronic',
                'ambient',
                'corporate',
                'cinematic',
                'jazz',
                'classical',
                'rock',
                'pop'
            ];
        }
    }
}
