import axios from 'axios';
import { logger } from '@takeone/utils';
export class PipelineOrchestrator {
    explorerUrl;
    plannerUrl;
    presenterUrl;
    composerUrl;
    constructor() {
        this.explorerUrl = process.env.EXPLORER_SERVICE_URL || 'http://localhost:3001';
        this.plannerUrl = process.env.PLANNER_SERVICE_URL || 'http://localhost:3002';
        this.presenterUrl = process.env.PRESENTER_SERVICE_URL || 'http://localhost:3003';
        this.composerUrl = process.env.COMPOSER_SERVICE_URL || 'http://localhost:3004';
    }
    async executePipeline(jobConfig, progress) {
        const artifacts = {};
        try {
            // Step 1: Repository Ingestion (Enhanced with Feature Extraction)
            await progress.onProgress('ingest', 10);
            const ingestResult = await this.callExplorerIngest(jobConfig);
            artifacts.features = ingestResult.featuresPath;
            // Step 2: Live Application Crawling (only if appUrl provided)
            let crawlResult;
            if (jobConfig.appUrl) {
                await progress.onProgress('crawl', 25);
                crawlResult = await this.callExplorerCrawl(jobConfig);
                artifacts.crawlSummary = crawlResult.crawlPath;
            }
            else {
                // Create empty crawl summary for storyboard generation
                crawlResult = { crawlPath: null };
                artifacts.crawlSummary = undefined;
            }
            // Step 3: AI-Powered Storyboard Planning
            await progress.onProgress('plan', 40);
            const storyboard = await this.callPlannerGenerate(jobConfig, artifacts.features, artifacts.crawlSummary || null);
            artifacts.storyboard = storyboard.path;
            // Step 4: Parallel Scene Generation
            await progress.onProgress('generate', 55);
            const presenterScenes = await this.generateScenesInParallel(storyboard.data, progress);
            // Step 5: Screen Recording
            await progress.onProgress('record', 70);
            const screenRecordings = await this.recordScreenDemos(storyboard.data, jobConfig);
            // Combine both presenter videos and screen recordings
            artifacts.scenes = [...presenterScenes, ...screenRecordings];
            // Step 6: Music Generation
            await progress.onProgress('music', 85);
            const music = await this.generateMusic(jobConfig);
            artifacts.music = music;
            // Step 7: Final Composition
            await progress.onProgress('compose', 95);
            const finalVideo = await this.composeVideo(jobConfig, artifacts);
            artifacts.finalVideo = finalVideo;
            await progress.onProgress('complete', 100);
            return {
                success: true,
                artifacts
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Pipeline execution failed', { jobId: jobConfig.id, error: errorMessage });
            return {
                success: false,
                artifacts,
                error: errorMessage
            };
        }
    }
    async callExplorerIngest(jobConfig) {
        const response = await axios.post(`${this.explorerUrl}/ingest`, {
            repoUrl: jobConfig.repoUrl,
            jobId: jobConfig.id,
            enhanced: true // Request enhanced feature extraction
        });
        if (!response.data.success) {
            throw new Error(`Repository ingestion failed: ${response.data.error}`);
        }
        return response.data;
    }
    async callExplorerCrawl(jobConfig) {
        // Add timeout to crawl operation to prevent stalling
        const crawlTimeout = 90000; // 1.5 minutes
        const response = await Promise.race([
            axios.post(`${this.explorerUrl}/crawl`, {
                appUrl: jobConfig.appUrl,
                jobId: jobConfig.id,
                auth: jobConfig.auth
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Crawl operation timed out')), crawlTimeout))
        ]);
        if (!response.data.success) {
            throw new Error(`Application crawling failed: ${response.data.error}`);
        }
        return response.data;
    }
    async callPlannerGenerate(jobConfig, featuresPath, crawlPath) {
        const response = await axios.post(`${this.plannerUrl}/generate`, {
            jobConfig,
            featuresPath,
            crawlPath
        });
        if (!response.data.success) {
            throw new Error(`Storyboard generation failed: ${response.data.error}`);
        }
        return response.data;
    }
    async generateScenesInParallel(storyboard, progress) {
        const presenterScenes = storyboard.scenes.filter(scene => scene.type === 'presenter');
        const scenePromises = presenterScenes.map(async (scene, index) => {
            // Generate presenter video for this scene
            const response = await axios.post(`${this.presenterUrl}/generate`, {
                scene,
                style: 'professional', // Could be derived from persona
            });
            if (!response.data.success) {
                throw new Error(`Presenter generation failed for scene ${scene.id}: ${response.data.error}`);
            }
            // Update progress as each scene completes
            const sceneProgress = 55 + (10 * (index + 1) / presenterScenes.length);
            await progress.onProgress('generate', sceneProgress);
            return response.data.videoPath;
        });
        return Promise.all(scenePromises);
    }
    async recordScreenDemos(storyboard, jobConfig) {
        const screenScenes = storyboard.scenes.filter(scene => scene.type === 'screen_demo');
        if (screenScenes.length === 0) {
            return [];
        }
        // Convert enhanced storyboard back to format expected by recorder
        const recordingStoryboard = {
            title: storyboard.title,
            description: storyboard.description,
            baseUrl: storyboard.baseUrl,
            scenes: screenScenes.map(scene => ({
                id: scene.id,
                title: scene.title,
                description: scene.description,
                actions: scene.type === 'screen_demo' ? scene.actions : [],
                expectedOutcome: scene.type === 'screen_demo' ? scene.expectedOutcome : '',
                blurSelectors: scene.type === 'screen_demo' ? scene.blurSelectors : undefined,
            })),
            globalBlurSelectors: storyboard.globalBlurSelectors,
        };
        const response = await axios.post(`${this.explorerUrl}/record`, {
            storyboard: recordingStoryboard,
            jobId: jobConfig.id,
            auth: jobConfig.auth,
            appUrl: jobConfig.appUrl
        });
        if (!response.data.success) {
            throw new Error(`Screen recording failed: ${response.data.error || 'Unknown recording error'}`);
        }
        // Check if recordings array exists
        if (!response.data.results || !response.data.results.recordings) {
            throw new Error(`Screen recording failed: No recordings returned in response`);
        }
        return response.data.results.recordings
            .filter((r) => r.success)
            .map((r) => r.videoPath);
    }
    async generateMusic(jobConfig) {
        if (!jobConfig.music?.enabled) {
            return '';
        }
        const response = await axios.post(`${this.composerUrl}/music`, {
            jobId: jobConfig.id,
            style: jobConfig.music.style,
            duration: 60, // Will be adjusted during composition
        });
        if (!response.data.success) {
            throw new Error(`Music generation failed: ${response.data.error}`);
        }
        return response.data.audioPath;
    }
    async composeVideo(jobConfig, artifacts) {
        logger.info('Starting video composition', {
            jobId: jobConfig.id,
            storyboardPath: artifacts.storyboard,
            scenesCount: artifacts.scenes?.length || 0,
            scenePaths: artifacts.scenes,
            hasMusicPath: !!artifacts.music,
            musicPath: artifacts.music
        });
        const response = await axios.post(`${this.composerUrl}/compose`, {
            jobId: jobConfig.id,
            storyboardPath: artifacts.storyboard,
            scenePaths: artifacts.scenes || [],
            musicPath: artifacts.music,
            config: {
                volume: jobConfig.music?.volume || 0.3,
                includeMusic: jobConfig.music?.enabled || false,
            }
        });
        if (!response.data.success) {
            throw new Error(`Video composition failed: ${response.data.error}`);
        }
        // Convert absolute path to URL accessible by frontend
        const absolutePath = response.data.videoPath;
        // Return the direct path to composer storage for frontend access
        // Frontend should access: /backend/services/composer/storage/{jobId}/final-video.mp4
        const filename = absolutePath.split('/').pop() || 'final-video.mp4';
        const composerStoragePath = `/backend/services/composer/storage/${jobConfig.id}/${filename}`;
        logger.info('Final video URL constructed (direct composer path)', {
            absolutePath,
            filename,
            composerStoragePath,
            jobId: jobConfig.id
        });
        return composerStoragePath;
    }
}
