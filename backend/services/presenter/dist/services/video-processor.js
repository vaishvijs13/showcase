import { logger } from '@takeone/utils';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
export class VideoProcessor {
    tempDir;
    ffmpegPath;
    constructor() {
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
        // Ensure temp directory exists
        fs.ensureDirSync(this.tempDir);
    }
    async processPresenterVideo(sourceUrl, outputPath, options = {}) {
        const { addCaptions = false, normalizeAudio = true, targetDuration, outputFormat = 'mp4', quality = 'high' } = options;
        logger.info('Starting video processing', {
            sourceUrl,
            outputPath,
            options
        });
        try {
            // Download source video
            const tempVideoPath = await this.downloadVideo(sourceUrl);
            // Build FFmpeg command
            const ffmpegArgs = this.buildFFmpegArgs(tempVideoPath, outputPath, {
                normalizeAudio,
                targetDuration,
                outputFormat,
                quality
            });
            // Execute FFmpeg
            await this.executeFFmpeg(ffmpegArgs);
            // Add captions if requested
            if (addCaptions && targetDuration) {
                // Note: This is a placeholder. Real caption generation would require
                // extracting audio, sending to speech-to-text, then burning subtitles
                logger.info('Caption generation requested but not implemented yet');
            }
            // Clean up temp files
            await fs.remove(tempVideoPath);
            // Verify output file
            const outputExists = await fs.pathExists(outputPath);
            if (!outputExists) {
                throw new Error('FFmpeg processing failed - output file not created');
            }
            const stats = await fs.stat(outputPath);
            logger.info('Video processing completed', {
                outputPath,
                fileSize: stats.size,
                duration: targetDuration
            });
            return outputPath;
        }
        catch (error) {
            logger.error('Video processing failed', { error });
            throw new Error(`Video processing failed: ${error}`);
        }
    }
    async downloadVideo(url) {
        const tempFileName = `temp-${Date.now()}.mp4`;
        const tempFilePath = path.join(this.tempDir, tempFileName);
        try {
            logger.info('Downloading video', { url, tempFilePath });
            const response = await axios({
                method: 'GET',
                url,
                responseType: 'stream',
                timeout: 300000, // 5 minutes
            });
            const writer = fs.createWriteStream(tempFilePath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info('Video download completed', { tempFilePath });
                    resolve(tempFilePath);
                });
                writer.on('error', reject);
            });
        }
        catch (error) {
            logger.error('Video download failed', { url, error });
            throw new Error(`Failed to download video: ${error}`);
        }
    }
    buildFFmpegArgs(inputPath, outputPath, options) {
        const args = ['-y', '-i', inputPath]; // -y to overwrite output
        // Video encoding settings based on quality
        const qualitySettings = {
            high: ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium'],
            medium: ['-c:v', 'libx264', '-crf', '23', '-preset', 'fast'],
            low: ['-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast']
        };
        args.push(...qualitySettings[options.quality]);
        // Audio settings
        if (options.normalizeAudio) {
            args.push('-af', 'loudnorm=I=-16:LRA=11:TP=-1.5');
        }
        args.push('-c:a', 'aac', '-b:a', '128k');
        // Duration adjustment
        if (options.targetDuration) {
            args.push('-t', options.targetDuration.toString());
        }
        // Output format
        args.push('-f', options.outputFormat);
        // Output path
        args.push(outputPath);
        return args;
    }
    async executeFFmpeg(args) {
        return new Promise((resolve, reject) => {
            logger.info('Executing FFmpeg', { command: `${this.ffmpegPath} ${args.join(' ')}` });
            const process = spawn(this.ffmpegPath, args);
            let stderr = '';
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    logger.info('FFmpeg completed successfully');
                    resolve();
                }
                else {
                    logger.error('FFmpeg failed', { code, stderr });
                    reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
                }
            });
            process.on('error', (error) => {
                logger.error('FFmpeg process error', { error });
                reject(new Error(`FFmpeg process error: ${error.message}`));
            });
        });
    }
    async validateVideo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            // Use ffprobe to get video metadata
            const probeArgs = [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ];
            return new Promise((resolve, reject) => {
                const process = spawn('ffprobe', probeArgs);
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
                            const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
                            resolve({
                                duration: parseFloat(metadata.format.duration),
                                width: videoStream.width,
                                height: videoStream.height,
                                codec: videoStream.codec_name,
                                fileSize: stats.size
                            });
                        }
                        catch (parseError) {
                            reject(new Error(`Failed to parse ffprobe output: ${parseError}`));
                        }
                    }
                    else {
                        reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
                    }
                });
            });
        }
        catch (error) {
            throw new Error(`Video validation failed: ${error}`);
        }
    }
}
