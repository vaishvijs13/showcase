import { Router } from 'express';
import { logger } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';
import { SunoClient } from '../services/suno-client';
import { VideoComposer } from '../services/video-composer';
import fs from 'fs-extra';
import path from 'path';
export const composerRouter = Router();
// Generate background music
composerRouter.post('/music', async (req, res) => {
    try {
        const { jobId, style, duration, outputPath } = req.body;
        if (!jobId || !style || !duration) {
            throw new HttpError('Missing required fields: jobId, style, duration', 400);
        }
        logger.info('Starting music generation', {
            jobId,
            style,
            duration
        });
        // Initialize Suno client
        const sunoClient = new SunoClient(process.env.SUNO_API_KEY);
        // Generate music
        const musicResult = await sunoClient.generateMusic({
            prompt: style,
            duration,
            genre: 'background',
            mood: 'professional',
            instruments: ['synth', 'ambient']
        });
        // Save music to storage
        const finalPath = outputPath || path.join('storage', jobId, 'music.mp3');
        await fs.ensureDir(path.dirname(finalPath));
        // Download and save the generated music
        await sunoClient.downloadAudio(musicResult.audioUrl, finalPath);
        logger.info('Music generation completed', {
            jobId,
            outputPath: finalPath,
            duration: musicResult.duration
        });
        const response = {
            success: true,
            audioPath: finalPath,
            duration: musicResult.duration
        };
        res.json(response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Music generation failed', { error: errorMessage });
        const response = {
            success: false,
            audioPath: '',
            duration: 0,
            error: errorMessage
        };
        res.status(500).json(response);
    }
});
// Compose final video
composerRouter.post('/compose', async (req, res) => {
    try {
        const { jobId, storyboardPath, scenePaths, musicPath, config } = req.body;
        if (!jobId || !storyboardPath || !scenePaths) {
            throw new HttpError('Missing required fields: jobId, storyboardPath, scenePaths', 400);
        }
        logger.info('Starting video composition', {
            jobId,
            scenesCount: scenePaths.length,
            hasMusic: !!musicPath,
            config
        });
        // Initialize video composer
        const videoComposer = new VideoComposer();
        // Load storyboard - handle cross-service paths
        let resolvedStoryboardPath = storyboardPath;
        // If path doesn't exist locally, try to resolve it from other services
        if (!await fs.pathExists(storyboardPath)) {
            // Try planner service storage
            const plannerPath = path.resolve('../planner', storyboardPath);
            if (await fs.pathExists(plannerPath)) {
                resolvedStoryboardPath = plannerPath;
                logger.info('Found storyboard in planner service', {
                    originalPath: storyboardPath,
                    resolvedPath: plannerPath
                });
            }
            else {
                // Try explorer service storage  
                const explorerPath = path.resolve('../explorer', storyboardPath);
                if (await fs.pathExists(explorerPath)) {
                    resolvedStoryboardPath = explorerPath;
                    logger.info('Found storyboard in explorer service', {
                        originalPath: storyboardPath,
                        resolvedPath: explorerPath
                    });
                }
                else {
                    logger.error('Storyboard not found in any service', {
                        originalPath: storyboardPath,
                        checkedPaths: [storyboardPath, plannerPath, explorerPath]
                    });
                    throw new Error(`Storyboard not found: ${storyboardPath}`);
                }
            }
        }
        const storyboard = await fs.readJSON(resolvedStoryboardPath);
        // Resolve scene paths - handle cross-service paths
        const resolvedScenePaths = [];
        for (const scenePath of scenePaths) {
            let resolvedPath = scenePath;
            if (!await fs.pathExists(scenePath)) {
                // Try multiple path combinations for cross-service resolution
                const pathsToTry = [
                    // Presenter service paths
                    path.resolve('../presenter', scenePath),
                    path.resolve('../presenter/storage', scenePath),
                    // Explorer service paths  
                    path.resolve('../explorer', scenePath),
                    path.resolve('../explorer/storage', scenePath),
                    // Current service paths
                    path.resolve('.', scenePath),
                    path.resolve('./storage', scenePath),
                ];
                let found = false;
                for (const testPath of pathsToTry) {
                    if (await fs.pathExists(testPath)) {
                        resolvedPath = testPath;
                        logger.debug('Found scene file', {
                            originalPath: scenePath,
                            resolvedPath: testPath,
                            strategy: 'cross-service-resolution'
                        });
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    logger.warn('Scene file not found in any location', {
                        originalPath: scenePath,
                        checkedPaths: pathsToTry
                    });
                    // Continue with original path, let video composer handle the error
                }
            }
            resolvedScenePaths.push(resolvedPath);
        }
        logger.info('Resolved all paths', {
            storyboardPath: resolvedStoryboardPath,
            scenesCount: resolvedScenePaths.length,
            musicPath
        });
        // Compose final video
        const compositionResult = await videoComposer.composeVideo({
            jobId,
            storyboard,
            scenePaths: resolvedScenePaths,
            musicPath,
            outputDir: path.resolve('storage', jobId),
            config: {
                musicVolume: config.volume,
                includeMusic: config.includeMusic,
                quality: config.quality || 'high',
                resolution: config.resolution || '1920x1080',
                addTransitions: true,
                addIntro: false,
                addOutro: false
            }
        });
        // Get file stats
        const stats = await fs.stat(compositionResult.videoPath);
        logger.info('Video composition completed', {
            jobId,
            outputPath: compositionResult.videoPath,
            duration: compositionResult.duration,
            fileSize: stats.size
        });
        const response = {
            success: true,
            videoPath: compositionResult.videoPath,
            duration: compositionResult.duration,
            fileSize: stats.size
        };
        res.json(response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Video composition failed', { error: errorMessage });
        const response = {
            success: false,
            videoPath: '',
            duration: 0,
            fileSize: 0,
            error: errorMessage
        };
        res.status(500).json(response);
    }
});
// Test endpoint for validating Suno connection
composerRouter.post('/test', async (req, res) => {
    try {
        const sunoClient = new SunoClient(process.env.SUNO_API_KEY);
        const testResult = await sunoClient.testConnection();
        res.json({
            success: true,
            message: 'Suno connection successful',
            model: testResult.model,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Suno test failed', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
// Get available music styles
composerRouter.get('/styles', async (req, res) => {
    try {
        const sunoClient = new SunoClient(process.env.SUNO_API_KEY);
        const styles = await sunoClient.getAvailableStyles();
        res.json({
            success: true,
            styles
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to get music styles', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
