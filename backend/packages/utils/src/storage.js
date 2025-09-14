import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';
export class LocalStorageClient {
    baseDir;
    constructor(baseDir = './storage') {
        this.baseDir = baseDir;
    }
    async ensureDir(dirPath) {
        const fullPath = path.join(this.baseDir, dirPath);
        await fs.ensureDir(fullPath);
        logger.debug(`Ensured directory: ${fullPath}`);
    }
    async writeFile(filePath, content) {
        const fullPath = path.join(this.baseDir, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
        logger.debug(`Wrote file: ${fullPath}`);
    }
    async readFile(filePath) {
        const fullPath = path.join(this.baseDir, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        logger.debug(`Read file: ${fullPath}`);
        return content;
    }
    async exists(filePath) {
        const fullPath = path.join(this.baseDir, filePath);
        return fs.pathExists(fullPath);
    }
    async copy(src, dest) {
        const srcPath = path.join(this.baseDir, src);
        const destPath = path.join(this.baseDir, dest);
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
        logger.debug(`Copied ${srcPath} to ${destPath}`);
    }
    async listFiles(dirPath) {
        const fullPath = path.join(this.baseDir, dirPath);
        if (!(await this.exists(dirPath))) {
            return [];
        }
        const files = await fs.readdir(fullPath);
        return files.filter(async (file) => {
            const stat = await fs.stat(path.join(fullPath, file));
            return stat.isFile();
        });
    }
    getFullPath(relativePath) {
        return path.join(this.baseDir, relativePath);
    }
}
// TODO: Add S3StorageClient for production
export class S3StorageClient {
    bucket;
    region;
    constructor(bucket, region) {
        this.bucket = bucket;
        this.region = region;
    }
    async ensureDir(dirPath) {
        // S3 doesn't need directory creation
        logger.debug(`S3 dir path noted: ${dirPath}`);
    }
    async writeFile(filePath, content) {
        throw new Error('S3 storage not implemented yet');
    }
    async readFile(filePath) {
        throw new Error('S3 storage not implemented yet');
    }
    async exists(filePath) {
        throw new Error('S3 storage not implemented yet');
    }
    async copy(src, dest) {
        throw new Error('S3 storage not implemented yet');
    }
    async listFiles(dirPath) {
        throw new Error('S3 storage not implemented yet');
    }
}
export const createStorageClient = () => {
    const storageType = process.env.STORAGE_TYPE || 'local';
    switch (storageType) {
        case 'local':
            return new LocalStorageClient(process.env.STORAGE_DIR || './storage');
        case 's3':
            return new S3StorageClient(process.env.S3_BUCKET, process.env.S3_REGION);
        default:
            throw new Error(`Unknown storage type: ${storageType}`);
    }
};
