export interface StorageClient {
    ensureDir(dirPath: string): Promise<void>;
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
    readFile(filePath: string): Promise<string>;
    exists(filePath: string): Promise<boolean>;
    copy(src: string, dest: string): Promise<void>;
    listFiles(dirPath: string): Promise<string[]>;
    getFullPath(relativePath: string): string;
}
export declare class LocalStorageClient implements StorageClient {
    private baseDir;
    constructor(baseDir?: string);
    ensureDir(dirPath: string): Promise<void>;
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
    readFile(filePath: string): Promise<string>;
    exists(filePath: string): Promise<boolean>;
    copy(src: string, dest: string): Promise<void>;
    listFiles(dirPath: string): Promise<string[]>;
    getFullPath(relativePath: string): string;
}
export declare class S3StorageClient implements StorageClient {
    private bucket;
    private region;
    constructor(bucket: string, region: string);
    ensureDir(dirPath: string): Promise<void>;
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
    readFile(filePath: string): Promise<string>;
    exists(filePath: string): Promise<boolean>;
    copy(src: string, dest: string): Promise<void>;
    listFiles(dirPath: string): Promise<string[]>;
    getFullPath(relativePath: string): string;
}
export declare const createStorageClient: () => StorageClient;
//# sourceMappingURL=storage.d.ts.map