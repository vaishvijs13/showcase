import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

export interface StorageClient {
  ensureDir(dirPath: string): Promise<void>;
  writeFile(filePath: string, content: string | Buffer): Promise<void>;
  readFile(filePath: string): Promise<string>;
  exists(filePath: string): Promise<boolean>;
  copy(src: string, dest: string): Promise<void>;
  listFiles(dirPath: string): Promise<string[]>;
  getFullPath(relativePath: string): string;
}

export class LocalStorageClient implements StorageClient {
  constructor(private baseDir: string = './storage') {}

  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, dirPath);
    await fs.ensureDir(fullPath);
    logger.debug(`Ensured directory: ${fullPath}`);
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content);
    logger.debug(`Wrote file: ${fullPath}`);
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    logger.debug(`Read file: ${fullPath}`);
    return content;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    return fs.pathExists(fullPath);
  }

  async copy(src: string, dest: string): Promise<void> {
    const srcPath = path.join(this.baseDir, src);
    const destPath = path.join(this.baseDir, dest);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
    logger.debug(`Copied ${srcPath} to ${destPath}`);
  }

  async listFiles(dirPath: string): Promise<string[]> {
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

  getFullPath(relativePath: string): string {
    return path.join(this.baseDir, relativePath);
  }
}

// TODO: Add S3StorageClient for production
export class S3StorageClient implements StorageClient {
  constructor(private bucket: string, private region: string) {}

  async ensureDir(dirPath: string): Promise<void> {
    // S3 doesn't need directory creation
    logger.debug(`S3 dir path noted: ${dirPath}`);
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    throw new Error('S3 storage not implemented yet');
  }

  async readFile(filePath: string): Promise<string> {
    throw new Error('S3 storage not implemented yet');
  }

  async exists(filePath: string): Promise<boolean> {
    throw new Error('S3 storage not implemented yet');
  }

  async copy(src: string, dest: string): Promise<void> {
    throw new Error('S3 storage not implemented yet');
  }

  async listFiles(dirPath: string): Promise<string[]> {
    throw new Error('S3 storage not implemented yet');
  }

  getFullPath(relativePath: string): string {
    throw new Error('S3 storage not implemented yet');
  }
}

export const createStorageClient = (): StorageClient => {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 'local':
      return new LocalStorageClient(process.env.STORAGE_DIR || './storage');
    case 's3':
      return new S3StorageClient(
        process.env.S3_BUCKET!,
        process.env.S3_REGION!
      );
    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }
}; 