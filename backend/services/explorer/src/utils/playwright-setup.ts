import { chromium, Browser, BrowserContext } from 'playwright';
import { logger } from '@takeone/utils';

export class PlaywrightManager {
  private static instance: PlaywrightManager;
  private browser?: Browser;

  private constructor() {}

  static getInstance(): PlaywrightManager {
    if (!PlaywrightManager.instance) {
      PlaywrightManager.instance = new PlaywrightManager();
    }
    return PlaywrightManager.instance;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      
      logger.info('Playwright browser launched');
    }
    
    return this.browser;
  }

  async createContext(options: any = {}): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    
    const defaultOptions = {
      viewport: {
        width: parseInt(process.env.VIDEO_WIDTH || '1920'),
        height: parseInt(process.env.VIDEO_HEIGHT || '1080'),
      },
      userAgent: 'TakeOne-Explorer/1.0 (Educational Demo Recording)',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      locale: 'en-US',
      timezoneId: 'America/New_York',
    };

    return browser.newContext({ ...defaultOptions, ...options });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      logger.info('Playwright browser closed');
    }
  }
}

export const playwrightManager = PlaywrightManager.getInstance(); 