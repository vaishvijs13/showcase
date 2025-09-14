import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import { logger, createStorageClient, retry, sanitizeFilename } from '@takeone/utils';
import { Storyboard, Scene, Action, AuthConfig, RecordingResult, RepairRequest, CrawlSummary, CrawledPage, PageElement } from '@takeone/types';
import { HttpError } from '../middleware/error-handler';
import { AuthHandler } from './auth-handler';
import axios from 'axios';
import fs from 'fs-extra';

/**
 * Intelligent Navigator that uses actual crawl data to determine real URLs and pages
 */
class IntelligentNavigator {
  private crawlPages: CrawledPage[] = [];
  private pageMap: Map<string, CrawledPage> = new Map();
  private urlMap: Map<string, string> = new Map(); // path -> full URL

  constructor(
    private crawlData: CrawlSummary | null,
    private storyboard: Storyboard,
    private logger: any
  ) {
    if (crawlData) {
      this.crawlPages = crawlData.pages;
      this.buildMaps();
    }
  }

  private buildMaps() {
    for (const page of this.crawlPages) {
      // Map by URL path (e.g., "/", "/about", "/pricing")
      const urlPath = new URL(page.url).pathname;
      this.pageMap.set(urlPath, page);
      this.urlMap.set(urlPath, page.url);
      
      // Also map by title for fuzzy matching
      this.pageMap.set(page.title.toLowerCase(), page);
    }
    
    this.logger.info('Built navigation maps', {
      pagesCount: this.crawlPages.length,
      pathsAvailable: Array.from(this.urlMap.keys()),
      titlesAvailable: this.crawlPages.map(p => p.title)
    });
  }

  /**
   * Intelligently resolve a navigation action to a real URL
   */
  resolveNavigationUrl(action: Action, baseUrl: string): string {
    // If it's already a full URL, use it
    if (action.value?.startsWith('http')) {
      return action.value;
    }

    // If no crawl data, fall back to basic URL construction
    if (!this.crawlData || this.crawlPages.length === 0) {
      if (action.value?.startsWith('http')) {
        return action.value;
      }
      
      const targetPath = action.value || '/';
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      
      if (targetPath === '/') {
        return cleanBaseUrl;
      }
      
      const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      return `${cleanBaseUrl}${cleanPath}`;
    }

    const targetPath = action.value || '/';
    
    // Strategy 1: Direct path match
    if (this.urlMap.has(targetPath)) {
      const resolvedUrl = this.urlMap.get(targetPath)!;
      this.logger.info('Direct path match found', { targetPath, resolvedUrl });
      return resolvedUrl;
    }

    // Strategy 2: Fuzzy match by action description or title
    const fuzzyMatch = this.findPageByDescription(action);
    if (fuzzyMatch) {
      this.logger.info('Fuzzy match found', { 
        actionDescription: action.description,
        matchedPage: fuzzyMatch.title,
        resolvedUrl: fuzzyMatch.url 
      });
      return fuzzyMatch.url;
    }

    // Strategy 3: Smart guessing based on common patterns
    const smartGuess = this.smartGuessUrl(action, baseUrl);
    if (smartGuess) {
      this.logger.info('Smart guess navigation', { action: action.value, guessedUrl: smartGuess });
      return smartGuess;
    }

    // Strategy 4: STRICT FAILURE - NO FALLBACKS ALLOWED
    const availablePaths = Array.from(this.urlMap.keys());
    this.logger.error('❌ FATAL: No valid navigation target found', { 
      targetPath, 
      actionDescription: action.description,
      availablePaths,
      crawlPagesCount: this.crawlPages.length
    });
    
    throw new Error(`FATAL NAVIGATION ERROR: Cannot resolve navigation for "${action.description}" (value: "${targetPath}"). Available paths in crawl data: [${availablePaths.join(', ')}]. This indicates the storyboard contains invalid navigation or crawl data is incomplete.`);
  }

  private findPageByDescription(action: Action): CrawledPage | null {
    const description = action.description.toLowerCase();
    
    // Look for key phrases in action description
    const keywords = [
      'home', 'main', 'landing', 'index',
      'about', 'pricing', 'features', 'demo',
      'contact', 'support', 'help', 'docs',
      'login', 'signin', 'signup', 'register'
    ];

    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        // Find page that matches this keyword
        for (const page of this.crawlPages) {
          if (page.url.toLowerCase().includes(keyword) || 
              page.title.toLowerCase().includes(keyword)) {
            return page;
          }
        }
      }
    }

    return null;
  }

  private smartGuessUrl(action: Action, baseUrl: string): string | null {
    const targetPath = action.value || '/';
    const description = action.description.toLowerCase();

    // If description mentions specific page types, try to find them
    if (description.includes('dashboard') || description.includes('app')) {
      const dashboardPage = this.crawlPages.find(p => 
        p.url.includes('/dashboard') || p.url.includes('/app') || p.title.toLowerCase().includes('dashboard')
      );
      if (dashboardPage) return dashboardPage.url;
    }

    if (description.includes('getting started') || description.includes('get started')) {
      const startPage = this.crawlPages.find(p => 
        p.url.includes('/start') || p.url.includes('/getting-started') || 
        p.title.toLowerCase().includes('getting started')
      );
      if (startPage) return startPage.url;
    }

    // Use the first non-root page if trying to navigate somewhere specific
    if (targetPath !== '/' && this.crawlPages.length > 1) {
      const nonRootPages = this.crawlPages.filter(p => new URL(p.url).pathname !== '/');
      if (nonRootPages.length > 0) {
        return nonRootPages[0].url;
      }
    }

    return null;
  }


  /**
   * Find the best matching element for a click action
   */
  findBestElement(action: Action, currentPageUrl: string): { locator?: any; strategy: string } {
    if (!this.crawlData) {
      return { strategy: 'fallback - no crawl data' };
    }

    // Find the current page in crawl data
    const currentPage = this.crawlPages.find(p => p.url === currentPageUrl);
    if (!currentPage) {
      return { strategy: 'fallback - page not in crawl data' };
    }

    // Look for matching elements on this page
    const actionText = action.locator?.value || action.description;
    const matchingElements = this.findMatchingElements(currentPage, actionText);

    if (matchingElements.length > 0) {
      const bestMatch = matchingElements[0]; // Take the first/best match
      return {
        locator: bestMatch.locator,
        strategy: `crawl data match - found "${bestMatch.text}" element`
      };
    }

    return { strategy: 'fallback - no matching elements found' };
  }

  private findMatchingElements(page: CrawledPage, searchText: string): PageElement[] {
    const searchLower = searchText.toLowerCase();
    const matches: PageElement[] = [];

    for (const element of page.elements) {
      if (element.text && element.text.toLowerCase().includes(searchLower)) {
        matches.push(element);
      }
    }

    // Sort by relevance (exact match first, then partial matches)
    return matches.sort((a, b) => {
      const aExact = a.text?.toLowerCase() === searchLower ? 1 : 0;
      const bExact = b.text?.toLowerCase() === searchLower ? 1 : 0;
      return bExact - aExact;
    });
  }
}

export class RecorderEngine {
  private storage = createStorageClient();
  private authHandler = new AuthHandler();
  private browser?: Browser;
  private context?: BrowserContext;
  private intelligentNavigator?: IntelligentNavigator;

  async record(
    storyboard: Storyboard,
    jobId: string,
    auth?: AuthConfig
  ): Promise<{ sceneDir: string; traceDir: string; recordings: RecordingResult[] }> {
    const jobLogger = logger.child({ jobId, storyboardTitle: storyboard.title });
    jobLogger.info('Starting storyboard recording');

    // Load crawl data for intelligent navigation
    const crawlData = await this.loadCrawlData(jobId);
    this.intelligentNavigator = new IntelligentNavigator(crawlData, storyboard, jobLogger);

    const recordings: RecordingResult[] = [];
    const sceneDir = `${jobId}/scenes`;
    const traceDir = `${jobId}/traces`;

    try {
      // Ensure output directories exist
      await this.storage.ensureDir(sceneDir);
      await this.storage.ensureDir(traceDir);

      // Launch browser with recording capabilities
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      // Record each scene
      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i];
        const sceneNumber = i + 1;
        
        try {
          const result = await this.recordScene(
            scene,
            sceneNumber,
            storyboard.baseUrl,
            sceneDir,
            traceDir,
            auth,
            storyboard.globalBlurSelectors
          );
          recordings.push(result);
          
          jobLogger.info('Scene recorded successfully', {
            sceneId: scene.id,
            sceneNumber,
            duration: result.duration,
            retries: result.retryCount,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          jobLogger.error('❌ FATAL: Scene recording failed - TERMINATING JOB IMMEDIATELY', {
            sceneId: scene.id,
            sceneNumber,
            error: errorMessage,
          });
          
          // IMMEDIATELY FAIL THE ENTIRE JOB - NO RECOVERY
          throw new Error(`FATAL SCENE FAILURE: Scene ${scene.id} (${sceneNumber}) failed: ${errorMessage}. Job terminated immediately to prevent resource waste.`);
        }
      }

      jobLogger.info('Storyboard recording completed', {
        totalScenes: storyboard.scenes.length,
        successfulScenes: recordings.filter(r => r.success).length,
        failedScenes: recordings.filter(r => !r.success).length,
      });

      return { sceneDir, traceDir, recordings };
    } catch (error) {
      jobLogger.error('Storyboard recording failed', { error: (error instanceof Error ? error.message : String(error)) });
      throw new HttpError(`Failed to record storyboard: ${(error instanceof Error ? error.message : String(error))}`, 500);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async recordScene(
    scene: Scene,
    sceneNumber: number,
    baseUrl: string,
    sceneDir: string,
    traceDir: string,
    auth?: AuthConfig,
    globalBlurSelectors?: string[]
  ): Promise<RecordingResult> {
    const sceneLogger = logger.child({ sceneId: scene.id, sceneNumber });
    const startTime = Date.now();

    // NO RETRIES - FAIL IMMEDIATELY ON ANY ERROR
    try {
      // Create fresh context for each scene
      this.context = await this.browser!.newContext({
        viewport: { 
          width: parseInt(process.env.VIDEO_WIDTH || '1920'), 
          height: parseInt(process.env.VIDEO_HEIGHT || '1080') 
        },
        recordVideo: {
          dir: this.storage.getFullPath(sceneDir),
          size: { 
            width: parseInt(process.env.VIDEO_WIDTH || '1920'), 
            height: parseInt(process.env.VIDEO_HEIGHT || '1080') 
          }
        },
      });

      // Start tracing
      const traceFileName = `scene-${sceneNumber.toString().padStart(2, '0')}.trace.zip`;
      const tracePath = `${traceDir}/${traceFileName}`;
      await this.context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

      const page = await this.context.newPage();

      // Handle authentication if provided
      if (auth) {
        await this.authHandler.authenticate(page, auth, baseUrl);
      }

      // Execute scene actions
      await this.executeScene(page, scene, baseUrl, sceneLogger);

      // Stop tracing and save
      await this.context.tracing.stop({
        path: this.storage.getFullPath(tracePath),
      });

      // Close context to finalize video
      await this.context.close();

      // Find and rename the recorded video
      const videoPath = await this.findAndRenameVideo(sceneDir, sceneNumber);

      const duration = Date.now() - startTime;
      sceneLogger.info('✅ Scene recorded successfully', { duration });

      return {
        sceneId: scene.id,
        videoPath,
        tracePath,
        success: true,
        retryCount: 0,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      sceneLogger.error('❌ FATAL: Scene recording failed - NO RETRIES', {
        error: errorMessage
      });

      // Clean up failed context
      if (this.context) {
        try {
          await this.context.close();
        } catch {
          // Ignore cleanup errors
        }
      }

      // IMMEDIATELY THROW - NO RETRIES OR REPAIRS
      throw new Error(`SCENE RECORDING FATAL ERROR: ${errorMessage}`);
    }
  }

  private async executeScene(page: Page, scene: Scene, baseUrl: string, logger: any): Promise<void> {
    logger.info('Executing scene', { title: scene.title, actionsCount: scene.actions.length });

    // CRITICAL SAFETY CHECK: Ensure we have a way to navigate
    const hasNavigateAction = scene.actions.some(action => action.type === 'navigate');
    
    if (!this.intelligentNavigator && !hasNavigateAction) {
      throw new Error(`FATAL SCENE ERROR: Scene "${scene.id}" has no navigation action and no crawl data available. Cannot perform screen recording without knowing where to navigate. Scene actions: ${scene.actions.map(a => a.type).join(', ')}`);
    }
    
    // If no intelligent navigator but we have a navigate action, that's OK
    // If we have intelligent navigator but no navigate action, add one at the start
    if (this.intelligentNavigator && !hasNavigateAction) {
      logger.info('🚀 Adding automatic navigation to start of scene', {
        sceneId: scene.id,
        baseUrl: baseUrl
      });
      
      // Insert a navigate action at the beginning
      const navigateAction = {
        type: 'navigate' as const,
        value: '/',
        description: 'Navigate to the main page',
        timeout: 15000
      };
      
      scene.actions.unshift(navigateAction);
    }

    // Apply blur overlays before starting
    if (scene.blurSelectors) {
      await this.applyBlurOverlays(page, scene.blurSelectors);
    }

    // PRE-FILTER ACTIONS: Remove actions for elements that definitely don't exist
    if (this.intelligentNavigator) {
      logger.info('🔍 Pre-filtering scene actions based on available elements', {
        originalActionsCount: scene.actions.length
      });
      
      // Get current page elements after navigation (if any)
      let currentPageElements: string[] = [];
      try {
        // Wait for the page to be ready
        await page.waitForLoadState('domcontentloaded');
        currentPageElements = await page.locator('button, a, [role="button"], input, [onclick]').allTextContents();
        logger.debug('Available page elements', { elements: currentPageElements.slice(0, 10) });
      } catch (error) {
        logger.warn('Could not extract page elements for filtering', { error: (error as Error).message });
      }
      
      // Filter out actions for elements that clearly don't exist
      const originalActionsCount = scene.actions.length;
      scene.actions = scene.actions.filter(action => {
        if (action.type === 'click' && action.locator?.value) {
          const targetText = action.locator.value.toLowerCase();
          const hasMatchingElement = currentPageElements.some(element => 
            element.toLowerCase().includes(targetText) || targetText.includes(element.toLowerCase())
          );
          
          if (!hasMatchingElement && currentPageElements.length > 0) {
            logger.warn('⚠️ REMOVING ACTION: Target element not found on page', {
              action: action.description,
              targetElement: action.locator.value,
              availableElements: currentPageElements.slice(0, 5)
            });
            return false;
          }
        }
        return true;
      });
      
      if (scene.actions.length !== originalActionsCount) {
        logger.info('🧹 Filtered out invalid actions', {
          originalCount: originalActionsCount,
          filteredCount: scene.actions.length,
          removedCount: originalActionsCount - scene.actions.length
        });
      }
    }

    for (let i = 0; i < scene.actions.length; i++) {
      const action = scene.actions[i];
      try {
        await this.executeAction(page, action, baseUrl, logger);
        logger.debug('Action executed successfully', { 
          actionIndex: i, 
          type: action.type, 
          description: action.description 
        });
      } catch (error) {
        logger.error('Action execution failed', {
          actionIndex: i,
          type: action.type,
          description: action.description,
          error: (error instanceof Error ? error.message : String(error)),
        });
        throw error;
      }
    }

    // Wait for final state to stabilize
    await this.waitForStability(page);
    logger.info('Scene execution completed successfully');
  }

  private async executeAction(page: Page, action: Action, baseUrl: string, logger: any): Promise<void> {
    const timeout = action.timeout || parseInt(process.env.RECORD_TIMEOUT || '30000');

    switch (action.type) {
      case 'navigate':
        await this.smartNavigate(page, action, baseUrl, logger, this.intelligentNavigator);
        break;

      case 'click':
        if (!action.locator) {
          throw new Error('Click action requires a locator');
        }
        
        // SMART FALLBACK STRATEGY: If element doesn't exist, skip the action with warning
        try {
          // Try to use intelligent navigator for better element selection
          if (this.intelligentNavigator) {
            const currentUrl = page.url();
            const elementMatch = this.intelligentNavigator.findBestElement(action, currentUrl);
            
            if (elementMatch.locator) {
              logger.info('🎯 Using intelligent element selection', {
                strategy: elementMatch.strategy,
                originalLocator: action.locator,
                intelligentLocator: elementMatch.locator
              });
              
              await this.clickElement(page, elementMatch.locator, timeout);
              break;
            }
          }
          
          // Fallback to original locator
          await this.clickElement(page, action.locator, timeout);
          
        } catch (error) {
          // SMART RECOVERY: Instead of failing, skip non-essential actions
          const errorMessage = (error as Error).message;
          const currentUrl = page.url();
          
          // Check if this is a missing element error
          if (errorMessage.includes('FATAL CLICK FAILURE') || errorMessage.includes('Cannot find element')) {
            logger.warn('⚠️ SKIPPING ACTION: Element not found, continuing with next action', {
              skippedAction: action.description,
              locator: action.locator?.value,
              currentUrl,
              reason: 'Element does not exist on current page'
            });
            
            // Add a small delay to let any potential page state settle
            await page.waitForTimeout(1000);
            break; // Continue to next action instead of failing
          } else {
            // For other types of errors (navigation, network, etc.), still fail
            throw error;
          }
        }
        break;

      case 'type':
        if (!action.locator || !action.value) {
          throw new Error('Type action requires both locator and value');
        }
        await this.typeInElement(page, action.locator, action.value, timeout);
        break;

      case 'wait':
        const waitDuration = action.value ? parseInt(action.value) : 1000;
        await page.waitForTimeout(waitDuration);
        break;

      case 'assert':
        if (!action.locator) {
          throw new Error('Assert action requires a locator');
        }
        await this.assertElement(page, action.locator, action.value, timeout);
        break;

      case 'scroll':
        await this.scrollPage(page, action.value);
        break;

      default:
        logger.warn('Unknown action type', { type: action.type });
    }

    // Wait for any animations or transitions to complete
    await page.waitForTimeout(500);
  }

  private async clickElement(page: Page, locator: any, timeout: number): Promise<void> {
    // FEWER STRATEGIES - FAIL FAST
    const strategies = [
      // Primary locator strategy (most reliable)
      () => this.findElementByLocator(page, locator).click({ timeout: Math.min(timeout, 10000) }),
      
      // Exact text match only (no fuzzy matching to avoid false positives)
      () => page.getByText(locator.value, { exact: true }).first().click({ timeout: Math.min(timeout, 10000) }),
      
      // Button with exact text
      () => page.locator(`button:has-text("${locator.value}")`).first().click({ timeout: Math.min(timeout, 10000) }),
      
      // Link with exact text  
      () => page.locator(`a:has-text("${locator.value}")`).first().click({ timeout: Math.min(timeout, 10000) }),
    ];

    // Add only exact fallback strategies (no guessing)
    if (locator.fallbacks && locator.fallbacks.length > 0) {
      for (const fallback of locator.fallbacks.slice(0, 2)) { // Limit to 2 fallbacks
        strategies.push(() => page.click(fallback, { timeout: Math.min(timeout, 5000) }));
      }
    }

    try {
      await this.tryStrategies(strategies, `click element: ${locator.value}`);
    } catch (error) {
      // ENHANCED ERROR WITH DEBUGGING INFO
      const currentUrl = page.url();
      const pageTitle = await page.title().catch(() => 'Unknown');
      const availableButtons = await page.locator('button, a[role="button"], [role="button"]').allTextContents().catch(() => []);
      
      throw new Error(`FATAL CLICK FAILURE: Cannot find element "${locator.value}" on page "${pageTitle}" (${currentUrl}). Available clickable elements: [${availableButtons.slice(0, 10).join(', ')}]. Original error: ${(error as Error).message}`);
    }
  }

  private async typeInElement(page: Page, locator: any, value: string, timeout: number): Promise<void> {
    const strategies = [
      () => this.findElementByLocator(page, locator).fill(value, { timeout }),
      () => page.fill(`#${locator.value}`, value, { timeout }),
      () => page.fill(locator.value, value, { timeout }),
    ];

    // Add fallback strategies if available
    if (locator.fallbacks) {
      for (const fallback of locator.fallbacks) {
        strategies.push(() => page.fill(fallback, value, { timeout }));
      }
    }

    await this.tryStrategies(strategies, `type in element: ${locator.value}`);
  }

  private async assertElement(page: Page, locator: any, expectedValue?: string, timeout: number = 5000): Promise<void> {
    try {
      const element = await this.findElementByLocator(page, locator);
      await element.waitFor({ state: 'visible', timeout });

      if (expectedValue) {
        const actualValue = await element.textContent();
        if (!actualValue?.includes(expectedValue)) {
          throw new Error(`Assertion failed: expected "${expectedValue}", got "${actualValue}"`);
        }
      }
    } catch (error) {
      throw new Error(`Assertion failed for ${locator.value}: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  private async scrollPage(page: Page, direction?: string): Promise<void> {
    const scrollAmount = 500;
    
    switch (direction) {
      case 'down':
        await page.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);
        break;
      case 'up':
        await page.evaluate((amount) => window.scrollBy(0, -amount), scrollAmount);
        break;
      case 'top':
        await page.evaluate(() => window.scrollTo(0, 0));
        break;
      case 'bottom':
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      default:
        await page.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);
    }

    // Wait for scroll to complete
    await page.waitForTimeout(1000);
  }

  private findElementByLocator(page: Page, locator: any) {
    switch (locator.type) {
      case 'role':
        return page.getByRole(locator.value.split('[')[0], { name: locator.value }).first();
      case 'text':
        return page.getByText(locator.value).first();
      case 'testId':
        return page.getByTestId(locator.value).first();
      case 'selector':
      default:
        return page.locator(locator.value).first();
    }
  }

  private async tryStrategies(strategies: Array<() => Promise<any>>, operation: string): Promise<void> {
    for (const strategy of strategies) {
      try {
        await strategy();
        return;
      } catch {
        // Try next strategy
      }
    }
    throw new Error(`All strategies failed for operation: ${operation}`);
  }

  private async waitForStability(page: Page, timeout: number = 3000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Continue if timeout
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
        // Selector not found or still visible
      }
    }
  }

  private async applyBlurOverlays(page: Page, selectors: string[]): Promise<void> {
    const blurCSS = `
      .takeone-blur-overlay {
        filter: blur(10px) !important;
        transition: filter 0.3s ease !important;
      }
    `;

    await page.addStyleTag({ content: blurCSS });

    for (const selector of selectors) {
      try {
        await page.evaluate((sel) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => el.classList.add('takeone-blur-overlay'));
        }, selector);
      } catch (error) {
        logger.warn('Failed to apply blur to selector', { selector, error: (error instanceof Error ? error.message : String(error)) });
      }
    }
  }

  private async loadCrawlData(jobId: string): Promise<CrawlSummary | null> {
    try {
      // Try both possible filenames to handle different naming conventions
      const possiblePaths = [
        path.join('storage', jobId, 'crawlSummary.json'),    // New format
        path.join('storage', jobId, 'crawl-summary.json'),   // Old format
        path.join(jobId, 'crawlSummary.json'),               // Alternative path
      ];
      
      for (const crawlPath of possiblePaths) {
        const fullPath = this.storage.getFullPath(crawlPath);
        
        if (await fs.pathExists(fullPath)) {
          const crawlData = await fs.readJSON(fullPath);
          logger.info('✅ Successfully loaded crawl data', { 
            jobId,
            crawlPath,
            pagesCount: crawlData.pages?.length || 0,
            baseUrl: crawlData.baseUrl 
          });
          return crawlData;
        }
      }
      
      // If none found, log all attempted paths
      logger.error('❌ FATAL: No crawl data found at any location', { 
        jobId, 
        attemptedPaths: possiblePaths,
        storageRoot: this.storage.getFullPath('')
      });
      return null;
      
    } catch (error) {
      logger.error('Failed to load crawl data', { 
        jobId, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  private async smartNavigate(page: Page, action: Action, baseUrl: string, logger: any, intelligentNavigator?: IntelligentNavigator): Promise<void> {
    const timeout = action.timeout || 15000;
    
    // REQUIRE intelligent navigator - no fallbacks allowed
    if (!intelligentNavigator) {
      throw new Error(`FATAL: No crawl data available for intelligent navigation. Cannot perform navigation action: ${action.description}`);
    }
    
    try {
      const targetUrl = intelligentNavigator.resolveNavigationUrl(action, baseUrl);
        
      logger.info('🧠 Intelligent navigation ONLY', { 
        actionDescription: action.description,
        actionValue: action.value,
        resolvedUrl: targetUrl
      });

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout });
      
      // Verify navigation was successful
      const currentUrl = page.url();
      const title = await page.title();
      
      if (currentUrl === 'about:blank' || title.toLowerCase().includes('error') || currentUrl.includes('about:blank')) {
        throw new Error(`FATAL NAVIGATION FAILURE: Ended up at ${currentUrl} with title: "${title}". This indicates crawl data is invalid or navigation logic failed.`);
      }
      
      logger.info('✅ Navigation successful', { 
        targetUrl, 
        actualUrl: currentUrl,
        title 
      });
      
    } catch (error) {
      logger.error('❌ FATAL: Smart navigation failed - FAILING JOB', { 
        actionDescription: action.description,
        actionValue: action.value,
        baseUrl, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  private async findAndRenameVideo(sceneDir: string, sceneNumber: number): Promise<string> {
    const sceneDirPath = this.storage.getFullPath(sceneDir);
    const files = await this.storage.listFiles(sceneDir);
    
    // Find the video file (Playwright creates videos with random names)
    const videoFile = files.find(file => file.endsWith('.webm'));
    
    if (!videoFile) {
      throw new Error('Video file not found after recording');
    }

    const newFileName = `scene-${sceneNumber.toString().padStart(2, '0')}.webm`;
    const oldPath = `${sceneDir}/${videoFile}`;
    const newPath = `${sceneDir}/${newFileName}`;
    
    await this.storage.copy(oldPath, newPath);
    
    return newPath;
  }

} 