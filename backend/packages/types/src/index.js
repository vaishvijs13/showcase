import { z } from 'zod';
// Auth schemas
export const AuthConfigSchema = z.object({
    type: z.enum(['cookie', 'script', 'magic']),
    cookieData: z.string().optional(),
    loginScript: z.string().optional(),
    magicLinkEmail: z.string().optional(),
});
export const SecretsSchema = z.object({
    token: z.string(),
    encryptedData: z.string(),
});
// Repository and framework detection
export const FrameworkSchema = z.enum([
    'next', 'express', 'django', 'react', 'vue', 'angular', 'other'
]);
export const RouteSchema = z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    description: z.string().optional(),
});
export const FeatureSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
    routes: z.array(RouteSchema).optional(),
    files: z.array(z.string()).optional(),
});
export const RepoAnalysisSchema = z.object({
    framework: FrameworkSchema,
    features: z.array(FeatureSchema),
    routes: z.array(RouteSchema),
    hasOpenAPI: z.boolean(),
    readmeContent: z.string().optional(),
    quickStartPath: z.string().optional(),
});
// Crawling and navigation
export const LocatorSchema = z.object({
    type: z.enum(['role', 'text', 'testId', 'selector']),
    value: z.string(),
    fallbacks: z.array(z.string()).optional(),
});
export const PageElementSchema = z.object({
    type: z.enum(['heading', 'nav', 'button', 'link', 'form', 'input']),
    text: z.string().optional(),
    locator: LocatorSchema,
    url: z.string().optional(),
});
export const CrawledPageSchema = z.object({
    url: z.string(),
    title: z.string(),
    elements: z.array(PageElementSchema),
    depth: z.number(),
    timestamp: z.string(),
});
export const CrawlSummarySchema = z.object({
    baseUrl: z.string(),
    pages: z.array(CrawledPageSchema),
    totalPages: z.number(),
    maxDepth: z.number(),
    crawlDuration: z.number(),
});
// Recording and storyboard
export const ActionSchema = z.object({
    type: z.enum(['click', 'type', 'navigate', 'wait', 'assert', 'scroll']),
    locator: LocatorSchema.optional(),
    value: z.string().optional(),
    timeout: z.number().optional(),
    description: z.string(),
});
export const SceneSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    actions: z.array(ActionSchema),
    expectedOutcome: z.string(),
    blurSelectors: z.array(z.string()).optional(),
});
export const StoryboardSchema = z.object({
    title: z.string(),
    description: z.string(),
    baseUrl: z.string(),
    scenes: z.array(SceneSchema),
    globalBlurSelectors: z.array(z.string()).optional(),
});
// Persona and presentation config
export const PersonaConfigSchema = z.object({
    role: z.string(), // e.g., "Developer", "Product Manager", "Student"
    purpose: z.string(), // e.g., "Learning", "Onboarding", "Demo"
    tone: z.enum(['professional', 'casual', 'educational', 'enthusiastic']).default('educational'),
    length: z.enum(['short', 'medium', 'long']).default('medium'), // 30s, 60s, 120s
});
export const MusicConfigSchema = z.object({
    style: z.string().default('upbeat tech background'), // Prompt for Suno
    volume: z.number().min(0).max(1).default(0.3), // Background music volume
    enabled: z.boolean().default(true),
});
// Enhanced scene types for presenter vs screen demo
export const PresenterSceneSchema = z.object({
    id: z.string(),
    type: z.literal('presenter'),
    title: z.string(),
    description: z.string(),
    voiceover_ssml: z.string(), // SSML text for TTS
    duration_seconds: z.number(),
    avatar_style: z.string().optional(), // Veo3 avatar configuration
});
export const ScreenDemoSceneSchema = z.object({
    id: z.string(),
    type: z.literal('screen_demo'),
    title: z.string(),
    description: z.string(),
    actions: z.array(ActionSchema),
    expectedOutcome: z.string(),
    blurSelectors: z.array(z.string()).optional(),
    duration_seconds: z.number().optional(),
});
export const EnhancedSceneSchema = z.union([PresenterSceneSchema, ScreenDemoSceneSchema]);
export const EnhancedStoryboardSchema = z.object({
    title: z.string(),
    description: z.string(),
    baseUrl: z.string(),
    persona: PersonaConfigSchema,
    music: MusicConfigSchema,
    scenes: z.array(EnhancedSceneSchema),
    totalDuration: z.number(), // Total video length in seconds
    globalBlurSelectors: z.array(z.string()).optional(),
});
// Feature candidates for AI planning
export const FeatureCandidateSchema = z.object({
    name: z.string(),
    description: z.string(),
    rationale: z.string(), // Why this is a key feature
    primaryPath: z.string(), // File path or API route
    category: z.enum(['core', 'user-facing', 'admin', 'api', 'integration']),
    priority: z.number().min(1).max(5), // 1 = highest priority
    demoable: z.boolean(), // Can this be demonstrated in a screen recording?
});
export const FeatureCandidatesSchema = z.object({
    repository: z.string(),
    framework: FrameworkSchema,
    totalFeatures: z.number(),
    features: z.array(FeatureCandidateSchema),
    analysisConfidence: z.number().min(0).max(1), // How confident is the AI analysis
    generatedAt: z.string(),
});
// Job and results
export const JobConfigSchema = z.object({
    id: z.string(),
    repoUrl: z.string().optional(),
    appUrl: z.string().optional(),
    persona: PersonaConfigSchema,
    music: MusicConfigSchema.optional(),
    auth: AuthConfigSchema.optional(),
    storyboard: EnhancedStoryboardSchema.optional(),
    outputDir: z.string(),
    createdAt: z.string(),
    status: z.enum(['pending', 'ingesting', 'crawling', 'planning', 'generating', 'recording', 'composing', 'complete', 'error']).default('pending'),
});
export const RecordingResultSchema = z.object({
    sceneId: z.string(),
    videoPath: z.string(),
    tracePath: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
    retryCount: z.number(),
    duration: z.number(),
});
export const JobResultSchema = z.object({
    jobId: z.string(),
    featuresPath: z.string().optional(),
    quickstartPath: z.string().optional(),
    crawlPath: z.string().optional(),
    recordings: z.array(RecordingResultSchema),
    success: z.boolean(),
    error: z.string().optional(),
});
// Repair requests for Team B integration
export const RepairRequestSchema = z.object({
    sceneId: z.string(),
    failedAction: ActionSchema,
    domSnippet: z.string(),
    error: z.string(),
    retryCount: z.number(),
});
export const RepairResponseSchema = z.object({
    suggestedAction: ActionSchema,
    confidence: z.number(),
    reasoning: z.string(),
});
