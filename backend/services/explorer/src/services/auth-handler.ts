import { Page } from 'playwright';
import crypto from 'crypto';
import { logger } from '@takeone/utils';
import { AuthConfig } from '@takeone/types';
import { HttpError } from '../middleware/error-handler';

export class AuthHandler {
  private encryptionKey = process.env.ENCRYPTION_KEY;

  async authenticate(page: Page, auth: AuthConfig, baseUrl: string): Promise<void> {
    const authLogger = logger.child({ authType: auth.type, baseUrl });
    authLogger.info('Starting authentication');

    try {
      switch (auth.type) {
        case 'cookie':
          await this.authenticateWithCookies(page, auth, authLogger);
          break;
        case 'script':
          await this.authenticateWithScript(page, auth, baseUrl, authLogger);
          break;
        case 'magic':
          await this.authenticateWithMagicLink(page, auth, baseUrl, authLogger);
          break;
        default:
          throw new Error(`Unsupported auth type: ${auth.type}`);
      }

      authLogger.info('Authentication completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      authLogger.error('Authentication failed', { error: errorMessage });
      throw new HttpError(`Authentication failed: ${errorMessage}`, 401);
    }
  }

  private async authenticateWithCookies(page: Page, auth: AuthConfig, logger: any): Promise<void> {
    if (!auth.cookieData) {
      throw new Error('Cookie data is required for cookie authentication');
    }

    try {
      // Decrypt cookie data if it's encrypted
      const cookieData = this.isEncrypted(auth.cookieData) 
        ? this.decrypt(auth.cookieData)
        : auth.cookieData;

      const cookies = JSON.parse(cookieData);
      
      // Validate cookie structure
      if (!Array.isArray(cookies)) {
        throw new Error('Cookie data must be an array of cookie objects');
      }

      await page.context().addCookies(cookies);
      logger.debug('Cookies added to browser context', { cookieCount: cookies.length });

      // Verify authentication by checking for auth indicators
      await page.goto(page.url());
      await this.verifyAuthentication(page);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON in cookie data');
      }
      throw error;
    }
  }

  private async authenticateWithScript(page: Page, auth: AuthConfig, baseUrl: string, logger: any): Promise<void> {
    if (!auth.loginScript) {
      throw new Error('Login script is required for script authentication');
    }

    try {
      // Navigate to base URL first
      await page.goto(baseUrl);

      // Execute the login script
      const script = this.isEncrypted(auth.loginScript)
        ? this.decrypt(auth.loginScript)
        : auth.loginScript;

      // Parse and execute login actions
      const actions = JSON.parse(script);
      await this.executeLoginActions(page, actions, logger);

      // Verify authentication
      await this.verifyAuthentication(page);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON in login script');
      }
      throw error;
    }
  }

  private async authenticateWithMagicLink(page: Page, auth: AuthConfig, baseUrl: string, logger: any): Promise<void> {
    if (!auth.magicLinkEmail) {
      throw new Error('Magic link email is required for magic link authentication');
    }

    // This is a placeholder for magic link authentication
    // In a real implementation, this would:
    // 1. Navigate to login page
    // 2. Enter email
    // 3. Wait for magic link in email (would need email integration)
    // 4. Navigate to magic link URL
    
    logger.warn('Magic link authentication not fully implemented - using placeholder');
    throw new Error('Magic link authentication not yet implemented');
  }

  private async executeLoginActions(page: Page, actions: any[], logger: any): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'navigate':
            await page.goto(action.url);
            break;

          case 'click':
            await this.clickElement(page, action.selector);
            break;

          case 'type':
            await this.typeInElement(page, action.selector, action.value);
            break;

          case 'wait':
            await page.waitForTimeout(action.duration || 1000);
            break;

          case 'waitForSelector':
            await page.waitForSelector(action.selector, { 
              timeout: action.timeout || 5000 
            });
            break;

          case 'waitForNavigation':
            await page.waitForNavigation({ 
              timeout: action.timeout || 10000 
            });
            break;

          default:
            logger.warn('Unknown action type', { type: action.type });
        }

        logger.debug('Executed login action', { type: action.type });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to execute login action ${action.type}: ${errorMessage}`);
      }
    }
  }

  private async clickElement(page: Page, selector: string): Promise<void> {
    // Try multiple strategies to find and click the element
    const strategies = [
      () => page.click(selector),
      () => page.click(`[data-testid="${selector}"]`),
      () => page.click(`[aria-label="${selector}"]`),
      () => page.getByRole('button', { name: selector }).click(),
      () => page.getByText(selector).click(),
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        return;
      } catch {
        // Try next strategy
      }
    }

    throw new Error(`Could not find element to click: ${selector}`);
  }

  private async typeInElement(page: Page, selector: string, value: string): Promise<void> {
    // Try multiple strategies to find and type in the element
    const strategies = [
      () => page.fill(selector, value),
      () => page.fill(`[data-testid="${selector}"]`, value),
      () => page.fill(`[name="${selector}"]`, value),
      () => page.fill(`[placeholder="${selector}"]`, value),
      () => page.getByLabel(selector).fill(value),
      () => page.getByPlaceholder(selector).fill(value),
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        return;
      } catch {
        // Try next strategy
      }
    }

    throw new Error(`Could not find input element: ${selector}`);
  }

  private async verifyAuthentication(page: Page): Promise<void> {
    // Common indicators that user is authenticated
    const authIndicators = [
      // Positive indicators (user is logged in)
      '[data-testid="user-menu"]',
      '[data-testid="profile"]',
      '.user-avatar',
      '.user-profile',
      '[aria-label*="user menu" i]',
      '[aria-label*="profile" i]',
      'button:has-text("Sign out")',
      'button:has-text("Logout")',
      'a:has-text("Dashboard")',
      'a:has-text("Profile")',
    ];

    const unauthenticatedIndicators = [
      // Negative indicators (user is not logged in)
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'a:has-text("Sign in")',
      'a:has-text("Login")',
      '.login-form',
      '[data-testid="login"]',
    ];

    // Check for authenticated state
    for (const selector of authIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        logger.debug('Authentication verified - found auth indicator', { selector });
        return;
      } catch {
        // Indicator not found, continue checking
      }
    }

    // Check for unauthenticated state
    for (const selector of unauthenticatedIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          throw new Error('Authentication failed - found unauthenticated indicator');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          throw error;
        }
        // Other errors are fine, continue checking
      }
    }

    // If no clear indicators, check URL patterns
    const currentUrl = page.url();
    const authUrls = ['/dashboard', '/profile', '/app', '/admin'];
    const unauthUrls = ['/login', '/signin', '/auth'];

    if (authUrls.some(path => currentUrl.includes(path))) {
      logger.debug('Authentication verified - URL indicates authenticated state');
      return;
    }

    if (unauthUrls.some(path => currentUrl.includes(path))) {
      throw new Error('Authentication failed - URL indicates unauthenticated state');
    }

    // No clear indicators found - log warning but continue
    logger.warn('Could not verify authentication state - proceeding with assumption that auth succeeded');
  }

  private isEncrypted(data: string): boolean {
    // Simple check - encrypted data typically starts with a specific prefix
    return data.startsWith('encrypted:') || data.length > 100;
  }

  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    try {
      // Remove the 'encrypted:' prefix if present
      const data = encryptedData.replace(/^encrypted:/, '');
      
      // Simple AES decryption (in production, use more secure methods)
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to decrypt data: ${errorMessage}`);
    }
  }

  // Helper method for encrypting data (for testing/setup)
  encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `encrypted:${encrypted}`;
  }
} 