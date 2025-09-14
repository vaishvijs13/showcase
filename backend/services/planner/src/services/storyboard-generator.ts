import { logger } from '@takeone/utils';
import { 
  JobConfig, 
  FeatureCandidates, 
  CrawlSummary, 
  EnhancedStoryboard,
  EnhancedStoryboardSchema,
  PresenterScene,
  ScreenDemoScene
} from '@takeone/types';
import { CerebrasClient, CerebrasMessage } from './cerebras-client';

export class StoryboardGenerator {
  constructor(private cerebrasClient: CerebrasClient) {}

  async generateStoryboard(
    jobConfig: JobConfig,
    features: FeatureCandidates,
    crawlSummary: CrawlSummary
  ): Promise<EnhancedStoryboard> {
    logger.info('Generating storyboard with AI', { 
      jobId: jobConfig.id,
      featuresCount: features.features.length,
      pagesCount: crawlSummary.pages.length
    });

    // Build context prompt
    const contextPrompt = this.buildContextPrompt(jobConfig, features, crawlSummary);
    
    // Generate storyboard with Cerebras
    const storyboard = await this.generateWithAI(contextPrompt);
    
    // Validate and enhance the storyboard
    const validatedStoryboard = await this.validateAndEnhance(storyboard, jobConfig, crawlSummary);
    
    return validatedStoryboard;
  }

  private buildContextPrompt(
    jobConfig: JobConfig,
    features: FeatureCandidates,
    crawlSummary: CrawlSummary
  ): string {
    const { persona, appUrl, repoUrl } = jobConfig;
    
    // Calculate target duration
    const durationMap = { short: 30, medium: 60, long: 120 };
    const targetDuration = durationMap[persona.length || 'medium'];
    
    // Select top features for demo
    const topFeatures = features.features
      .filter(f => f.demoable)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);

    // Get key pages from crawl
    const keyPages = crawlSummary.pages
      .filter(p => p.elements.length > 0)
      .slice(0, 8);

    return `You are an expert creative director producing educational demo videos for software applications.

**Project Context:**
- Repository: ${repoUrl}
- Live Application: ${appUrl || crawlSummary.baseUrl || 'Not provided'}
- Framework: ${features.framework}
- Target Audience: ${persona.role} for ${persona.purpose}
- Tone: ${persona.tone}
- Target Duration: ${targetDuration} seconds

**Key Features to Demonstrate:**
${topFeatures.map(f => `- ${f.name}: ${f.description} (${f.category}, priority ${f.priority})`).join('\n')}

**Available Pages/Routes:**
${keyPages.length > 0 ? keyPages.map(p => {
  const buttonElements = p.elements.filter(e => e.type === 'button' || (e.type === 'link' && e.text));
  const elementList = buttonElements.length > 0 ? buttonElements.map(e => `"${e.text}"`).join(', ') : 'No interactive elements';
  return `- ${p.url}: "${p.title}" - Available elements: ${elementList}`;
}).join('\n') : '- No crawl data available, focus on presenter explanations'}

**Instructions:**
Create a compelling ${targetDuration}-second demo video that alternates between presenter explanations and live screen demonstrations. The video should:

1. Start with a presenter introduction (10-15 seconds)
2. Alternate between presenter scenes (explaining what we'll see) and screen_demo scenes (showing the actual feature)
3. Focus on the most impactful features that best demonstrate the application's value
4. End with a presenter conclusion highlighting key benefits

**Scene Requirements:**
- Each presenter scene should have engaging SSML voiceover text
- Each screen_demo scene should have precise Playwright actions to demonstrate the feature
- Actions should use stable selectors (prefer role, text, or testId over CSS selectors)
- Include expected outcomes for each demo scene
- Total duration should be approximately ${targetDuration} seconds

**Tone Guidelines for ${persona.tone}:**
${this.getToneGuidelines(persona.tone || 'educational')}`;
  }

  private getToneGuidelines(tone: string): string {
    const guidelines = {
      professional: "Use formal language, focus on business value and efficiency. Speak confidently about ROI and productivity benefits.",
      casual: "Use conversational language, relatable examples. Make it feel like a friend showing you something cool.",
      educational: "Use clear explanations, step-by-step guidance. Focus on learning outcomes and practical understanding.",
      enthusiastic: "Use energetic language, emphasize excitement about features. Show passion for the technology and its possibilities."
    };
    
    return guidelines[tone as keyof typeof guidelines] || guidelines.educational;
  }

  private async generateWithAI(contextPrompt: string): Promise<any> {
    const messages: CerebrasMessage[] = [
      {
        role: 'system',
        content: contextPrompt
      },
      {
        role: 'user',
        content: `Generate a complete storyboard for this demo video. Include both presenter scenes (with voiceover_ssml) and screen_demo scenes (with Playwright actions and voiceover_ssml).

CRITICAL REQUIREMENTS:
- ALL scenes must have "voiceover_ssml" field (both presenter and screen_demo)
- ALL actions must have "description" field - THIS IS MANDATORY
- For navigation: {"type": "navigate", "value": "/path", "description": "Navigate to X page"}
- For clicks: {"type": "click", "locator": {"type": "text", "value": "Button Text"}, "description": "Click the X button"}
- For waits: {"type": "wait", "timeout": 2000, "description": "Wait for page to load"}
- For scroll: {"type": "scroll", "value": "down", "description": "Scroll down the page"}
- NEVER use null values - omit optional fields instead
- Locator types: ONLY "role", "text", "testId", or "selector" (NOT "url")

EXAMPLE ACTION FORMAT:
{
  "type": "click",
  "locator": {"type": "text", "value": "Get Started"}, 
  "description": "Click the Get Started button"
}

CRITICAL: Use ONLY real UI elements from the crawled pages.
- Primary action: "Get Started" (main CTA button)
- Secondary action: "See It In Action" (demo button)
- Navigation links from footer: "Privacy", "Terms", etc.
- Prefer simple actions: scroll, wait, navigate to real pages
- If unsure about an element, use scroll or wait instead of clicking non-existent buttons.`
      }
    ];

    const schema = `{
  "title": "string",
  "description": "string", 
  "baseUrl": "string",
  "persona": {
    "role": "string",
    "purpose": "string", 
    "tone": "professional|casual|educational|enthusiastic",
    "length": "short|medium|long"
  },
  "music": {
    "style": "string",
    "volume": "number (0-1)",
    "enabled": "boolean"
  },
  "scenes": [
    {
      "id": "string",
      "type": "presenter",
      "title": "string",
      "description": "string", 
      "voiceover_ssml": "string",
      "duration_seconds": "number",
      "avatar_style": "string (optional)"
    },
    {
      "id": "string", 
      "type": "screen_demo",
      "title": "string",
      "description": "string",
      "voiceover_ssml": "string",
      "actions": [
        {
          "type": "navigate|click|type|wait|assert|scroll",
          "locator": {"type": "role|text|testId|selector", "value": "string"} (required for click/type/assert only),
          "value": "string (required for navigate/type/scroll, optional for others)",
          "timeout": "number (optional for all)",
          "description": "string (REQUIRED for all)"
        }
      ],
      "expectedOutcome": "string",
      "blurSelectors": ["string (optional)"],
      "duration_seconds": "number"
    }
  ],
  "totalDuration": "number",
  "globalBlurSelectors": ["string (optional)"]
}`;

    return await this.cerebrasClient.generateJSON(messages, schema, {
      temperature: 0.8,
      maxTokens: 6000
    });
  }

  private async validateAndEnhance(
    storyboard: any,
    jobConfig: JobConfig,
    crawlSummary: CrawlSummary
  ): Promise<EnhancedStoryboard> {
    try {
      // Validate with Zod schema
      const validated = EnhancedStoryboardSchema.parse(storyboard);
      
      // Enhance with additional validation and defaults
      const finalBaseUrl = jobConfig.appUrl || crawlSummary.baseUrl || validated.baseUrl || '';
      
      logger.info('Setting storyboard baseUrl', {
        jobConfigAppUrl: jobConfig.appUrl,
        crawlSummaryBaseUrl: crawlSummary.baseUrl,
        validatedBaseUrl: validated.baseUrl,
        finalBaseUrl
      });
      
      const enhanced: EnhancedStoryboard = {
        ...validated,
        baseUrl: finalBaseUrl,
        persona: jobConfig.persona,
        music: jobConfig.music || validated.music,
        scenes: validated.scenes.map((scene, index) => {
          if (scene.type === 'presenter') {
            return {
              ...scene,
              id: scene.id || `presenter-${index + 1}`,
              avatar_style: scene.avatar_style || 'professional',
            } as PresenterScene;
          } else {
            return {
              ...scene,
              id: scene.id || `screen-demo-${index + 1}`,
              actions: scene.actions.map(action => ({
                ...action,
                timeout: action.timeout || 5000, // Default 5s timeout
              })),
            } as ScreenDemoScene;
          }
        }),
      };

      // Calculate total duration if not provided
      if (!enhanced.totalDuration) {
        enhanced.totalDuration = enhanced.scenes.reduce((total, scene) => {
          return total + (scene.duration_seconds || 10);
        }, 0);
      }

      logger.info('Storyboard validated and enhanced', {
        scenesCount: enhanced.scenes.length,
        presenterScenes: enhanced.scenes.filter(s => s.type === 'presenter').length,
        screenDemoScenes: enhanced.scenes.filter(s => s.type === 'screen_demo').length,
        totalDuration: enhanced.totalDuration,
      });

      return enhanced;
    } catch (error) {
      logger.error('Storyboard validation failed', { error, storyboard });
      throw new Error(`Invalid storyboard generated: ${error}`);
    }
  }
}
