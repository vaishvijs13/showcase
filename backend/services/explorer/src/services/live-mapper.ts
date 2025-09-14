import { chromium, Browser, Page } from 'playwright';
import { URL } from 'url';
import { logger, createStorageClient, retry } from '@takeone/utils';
import { AuthConfig, CrawlSummary, CrawledPage, PageElement, Locator } from '@takeone/types';
import { HttpError } from '../middleware/error-handler';
import { AuthHandler } from './auth-handler';

export class LiveMapper {
  private storage = createStorageClient();
  private authHandler = new AuthHandler();
  private browser?: Browser;
  private visitedUrls = new Set<string>();
  private crawlQueue: Array<{ url: string; depth: number }> = [];

  async crawl(
    appUrl: string, 
    jobId: string, 
    auth?: AuthConfig
  ): Promise<{ crawlPath: string }> {
    const jobLogger = logger.child({ jobId, appUrl });
    jobLogger.info('Starting live crawl');

    const startTime = Date.now();
    const maxDepth = parseInt(process.env.CRAWL_MAX_DEPTH || '2'); // Reduce depth to prevent stalling
    const maxPages = parseInt(process.env.CRAWL_MAX_PAGES || '10'); // Reduce pages to prevent stalling
    const maxCrawlTime = parseInt(process.env.CRAWL_MAX_TIME || '60000'); // 1 minute max

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'TakeOne-Crawler/1.0 (Educational Demo Recording)',
      });

      const page = await context.newPage();

      // Handle authentication if provided
      if (auth) {
        await this.authHandler.authenticate(page, auth, appUrl);
      }

      // Initialize crawl
      const baseUrl = new URL(appUrl);
      this.visitedUrls.clear();
      this.crawlQueue = [{ url: appUrl, depth: 0 }];
      
      const crawledPages: CrawledPage[] = [];

      // BFS crawl with timeout protection
      while (this.crawlQueue.length > 0 && crawledPages.length < maxPages) {
        // Check if we've exceeded max crawl time
        if (Date.now() - startTime > maxCrawlTime) {
          jobLogger.warn('Crawl timeout reached, stopping', { 
            elapsed: Date.now() - startTime,
            maxTime: maxCrawlTime,
            pagesFound: crawledPages.length 
          });
          break;
        }

        const { url, depth } = this.crawlQueue.shift()!;
        
        if (this.visitedUrls.has(url) || depth > maxDepth) {
          continue;
        }

        try {
          // Add timeout to individual page crawling
          const crawledPage = await Promise.race([
            this.crawlPage(page, url, depth, baseUrl),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Page crawl timeout')), 10000)
            )
          ]);
          
          crawledPages.push(crawledPage);
          this.visitedUrls.add(url);

          // Add new URLs to queue (but limit to prevent explosion)
          const newUrls = this.extractUrls(crawledPage, baseUrl, depth);
          this.crawlQueue.push(...newUrls.slice(0, 5)); // Limit to 5 new URLs per page

          jobLogger.debug('Crawled page', { 
            url, 
            depth, 
            elementsCount: crawledPage.elements.length,
            queueLength: this.crawlQueue.length 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          jobLogger.warn('Failed to crawl page', { url, error: errorMessage });
        }
      }

      // Create crawl summary
      const crawlSummary: CrawlSummary = {
        baseUrl: appUrl,
        pages: crawledPages,
        totalPages: crawledPages.length,
        maxDepth,
        crawlDuration: Date.now() - startTime,
      };

      // Save crawl results
      const crawlPath = `${jobId}/crawlSummary.json`;
      await this.storage.writeFile(crawlPath, JSON.stringify(crawlSummary, null, 2));

      jobLogger.info('Live crawl completed', {
        pagesCount: crawledPages.length,
        duration: crawlSummary.crawlDuration,
        maxDepthReached: Math.max(...crawledPages.map(p => p.depth)),
      });

      return { crawlPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      jobLogger.error('Live crawl failed', { error: errorMessage });
      throw new HttpError(`Failed to crawl application: ${errorMessage}`, 500);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async crawlPage(
    page: Page, 
    url: string, 
    depth: number, 
    baseUrl: URL
  ): Promise<CrawledPage> {
    // Navigate to page with timeout (use faster load strategy)
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: parseInt(process.env.CRAWL_TIMEOUT || '10000')
    });

    // Wait for page to be ready (simplified)
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Simple 1 second wait

    // Extract page information
    const title = await page.title();
    const elements = await this.extractPageElements(page);

    return {
      url,
      title,
      elements,
      depth,
      timestamp: new Date().toISOString(),
    };
  }

  private async waitForStability(page: Page, timeout: number = 3000): Promise<void> {
    // Wait for no network activity for a short period
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Continue if timeout - page might still be loading
    }

    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label*="loading" i]',
    ];

    for (const selector of loadingSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'hidden', timeout: 1000 });
      } catch {
        // Selector not found or still visible - continue
      }
    }
  }

  private async extractPageElements(page: Page): Promise<PageElement[]> {
    const elements: PageElement[] = [];

    try {
      // Extract headings
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) =>
        els.map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim() || '',
          id: el.id,
          className: el.className,
        }))
      );

      for (const heading of headings) {
        if (heading.text) {
          elements.push({
            type: 'heading',
            text: heading.text,
            locator: this.createStableLocator(heading.tag, heading.text, heading.id),
          });
        }
      }

      // Extract navigation elements
      const navElements = await page.$$eval('nav a, [role="navigation"] a', (els) =>
        els.map(el => ({
          text: el.textContent?.trim() || '',
          href: el.getAttribute('href'),
          id: el.id,
          className: el.className,
          ariaLabel: el.getAttribute('aria-label'),
        }))
      );

      for (const nav of navElements) {
        if (nav.text || nav.ariaLabel) {
          elements.push({
            type: 'nav',
            text: nav.text || nav.ariaLabel || undefined,
            url: nav.href || undefined,
            locator: this.createStableLocator('a', nav.text || nav.ariaLabel!, nav.id),
          });
        }
      }

      // Extract buttons
      const buttons = await page.$$eval('button, [role="button"], input[type="button"], input[type="submit"]', (els) =>
        els.map(el => ({
          text: el.textContent?.trim() || (el as HTMLInputElement).value || '',
          id: el.id,
          className: el.className,
          ariaLabel: el.getAttribute('aria-label'),
          type: el.getAttribute('type'),
        }))
      );

      for (const button of buttons) {
        if (button.text || button.ariaLabel) {
          elements.push({
            type: 'button',
            text: button.text || button.ariaLabel || undefined,
            locator: this.createStableLocator('button', button.text || button.ariaLabel!, button.id),
          });
        }
      }

      // Extract links
      const links = await page.$$eval('a:not(nav a):not([role="navigation"] a)', (els) =>
        els.map(el => ({
          text: el.textContent?.trim() || '',
          href: el.getAttribute('href'),
          id: el.id,
          className: el.className,
          ariaLabel: el.getAttribute('aria-label'),
        }))
      );

      for (const link of links) {
        if (link.text || link.ariaLabel) {
          elements.push({
            type: 'link',
            text: link.text || link.ariaLabel || undefined,
            url: link.href || undefined,
            locator: this.createStableLocator('a', link.text || link.ariaLabel!, link.id),
          });
        }
      }

      // Extract form inputs
      const inputs = await page.$$eval('input:not([type="button"]):not([type="submit"]), textarea, select', (els) =>
        els.map(el => ({
          type: el.getAttribute('type') || el.tagName.toLowerCase(),
          name: el.getAttribute('name'),
          id: el.id,
          placeholder: el.getAttribute('placeholder'),
          ariaLabel: el.getAttribute('aria-label'),
          label: '', // Will be filled by finding associated label
        }))
      );

      for (const input of inputs) {
        let labelText = input.ariaLabel || input.placeholder || '';
        
        // Try to find associated label
        if (input.id) {
          try {
            const labelEl = await page.$(`label[for="${input.id}"]`);
            if (labelEl) {
              labelText = await labelEl.textContent() || labelText;
            }
          } catch {
            // Label not found
          }
        }

        if (labelText || input.name) {
          elements.push({
            type: 'input',
            text: labelText || input.name || undefined,
            locator: this.createStableLocator('input', labelText || input.name!, input.id),
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Error extracting page elements', { error: errorMessage });
    }

    return elements;
  }

  private createStableLocator(tag: string, text: string, id?: string): Locator {
    const fallbacks: string[] = [];
    
    // Primary locator strategy
    let primary: Locator;
    
    if (id) {
      primary = { type: 'testId', value: id };
      fallbacks.push(`#${id}`);
    } else if (tag === 'button' || tag === 'a') {
      primary = { type: 'role', value: `${tag}[name="${text}"]` };
      fallbacks.push(`${tag}:has-text("${text}")`);
    } else {
      primary = { type: 'text', value: text };
    }

    // Add CSS selector fallback
    if (text) {
      fallbacks.push(`${tag}:has-text("${text.substring(0, 30)}")`);
    }

    return {
      ...primary,
      fallbacks: fallbacks.length > 0 ? fallbacks : undefined,
    };
  }

  private extractUrls(page: CrawledPage, baseUrl: URL, currentDepth: number): Array<{ url: string; depth: number }> {
    const urls: Array<{ url: string; depth: number }> = [];
    
    for (const element of page.elements) {
      if (element.url && (element.type === 'link' || element.type === 'nav')) {
        try {
          const fullUrl = new URL(element.url, baseUrl.origin);
          
          // Only include URLs from the same origin
          if (fullUrl.origin === baseUrl.origin && !this.visitedUrls.has(fullUrl.href)) {
            urls.push({
              url: fullUrl.href,
              depth: currentDepth + 1,
            });
          }
        } catch {
          // Invalid URL, skip
        }
      }
    }
    
    return urls;
  }
} 