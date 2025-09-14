export * from './logger';
export * from './storage';
// Utility functions
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    }
    catch (error) {
        if (retries <= 0) {
            throw error;
        }
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2); // Exponential backoff
    }
};
export const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-z0-9.-]/gi, '_')
        .toLowerCase()
        .substring(0, 100);
};
export const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
};
