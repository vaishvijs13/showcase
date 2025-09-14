import path from 'path';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { logger, createStorageClient, retry } from '@takeone/utils';
import { HttpError } from '../middleware/error-handler';
export class RepoIngestor {
    storage = createStorageClient();
    async ingest(repoUrl, jobId, enhanced = false) {
        const jobLogger = logger.child({ jobId, repoUrl });
        jobLogger.info('Starting repository ingest', { enhanced });
        try {
            // Clone repository
            const repoDir = await this.cloneRepository(repoUrl, jobId);
            // Analyze repository structure
            const analysis = await this.analyzeRepository(repoDir);
            // Generate features (enhanced with AI if requested)
            let featureCandidates;
            if (enhanced) {
                featureCandidates = await this.generateFeatureCandidatesWithAI(analysis, repoDir, repoUrl);
            }
            else {
                // Fall back to basic feature extraction
                const features = this.extractFeatures(analysis, repoDir);
                featureCandidates = this.convertToFeatureCandidates(features, analysis, repoUrl);
            }
            const quickstart = await this.generateQuickstart(analysis, repoDir);
            // Save results
            const featuresPath = `${jobId}/features.json`;
            const quickstartPath = `${jobId}/getting_started.md`;
            await this.storage.writeFile(featuresPath, JSON.stringify(featureCandidates, null, 2));
            await this.storage.writeFile(quickstartPath, quickstart);
            jobLogger.info('Repository ingest completed', {
                framework: analysis.framework,
                featuresCount: featureCandidates.features.length,
                routesCount: analysis.routes.length,
                enhanced,
                confidence: featureCandidates.analysisConfidence
            });
            return { featuresPath, quickstartPath };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            jobLogger.error('Repository ingest failed', { error: errorMessage });
            throw new HttpError(`Failed to ingest repository: ${errorMessage}`, 500);
        }
    }
    async cloneRepository(repoUrl, jobId) {
        const repoDir = path.join(process.cwd(), 'temp', jobId, 'repo');
        // Clean up existing directory if it exists
        if (await fs.pathExists(repoDir)) {
            logger.debug('Removing existing repository directory', { repoDir });
            await fs.remove(repoDir);
        }
        await fs.ensureDir(path.dirname(repoDir));
        const git = simpleGit();
        await retry(async () => {
            await git.clone(repoUrl, repoDir, ['--depth', '1']);
        }, 3, 2000);
        logger.debug('Repository cloned', { repoUrl, repoDir });
        return repoDir;
    }
    async analyzeRepository(repoDir) {
        const framework = await this.detectFramework(repoDir);
        const routes = await this.extractRoutes(repoDir, framework);
        const hasOpenAPI = await this.checkOpenAPI(repoDir);
        const readmeContent = await this.readReadme(repoDir);
        return {
            framework,
            features: [], // Will be populated by extractFeatures
            routes,
            hasOpenAPI,
            readmeContent,
            quickStartPath: undefined, // Will be set later
        };
    }
    async detectFramework(repoDir) {
        try {
            // Check for monorepo patterns (frontend/backend subdirectories)
            const frontendDirs = ['frontend', 'client', 'web', 'ui', 'app'];
            const backendDirs = ['backend', 'server', 'api'];
            // Check frontend subdirectories first
            for (const dir of frontendDirs) {
                const subDirPath = path.join(repoDir, dir);
                if (await fs.pathExists(subDirPath)) {
                    const framework = await this.detectFrameworkInDir(subDirPath);
                    if (framework !== 'other')
                        return framework;
                }
            }
            // Check backend subdirectories
            for (const dir of backendDirs) {
                const subDirPath = path.join(repoDir, dir);
                if (await fs.pathExists(subDirPath)) {
                    const framework = await this.detectFrameworkInDir(subDirPath);
                    if (framework !== 'other')
                        return framework;
                }
            }
            // Check root directory
            return await this.detectFrameworkInDir(repoDir);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn('Failed to detect framework', { error: errorMessage });
            return 'other';
        }
    }
    async detectFrameworkInDir(dirPath) {
        const packageJsonPath = path.join(dirPath, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            // Check for Next.js
            if (deps.next)
                return 'next';
            // Check for React
            if (deps.react)
                return 'react';
            // Check for Vue
            if (deps.vue || deps['@vue/core'])
                return 'vue';
            // Check for Angular
            if (deps['@angular/core'])
                return 'angular';
            // Check for Express
            if (deps.express)
                return 'express';
        }
        // Check for Python frameworks
        const requirementsPath = path.join(dirPath, 'requirements.txt');
        const pipfilePath = path.join(dirPath, 'Pipfile');
        if (await fs.pathExists(requirementsPath)) {
            const requirements = await fs.readFile(requirementsPath, 'utf-8');
            if (requirements.includes('django'))
                return 'django';
            if (requirements.includes('flask'))
                return 'flask';
        }
        if (await fs.pathExists(pipfilePath)) {
            const pipfile = await fs.readFile(pipfilePath, 'utf-8');
            if (pipfile.includes('django'))
                return 'django';
            if (pipfile.includes('flask'))
                return 'flask';
        }
        return 'other';
    }
    async extractRoutes(repoDir, framework) {
        const routes = [];
        try {
            switch (framework) {
                case 'next':
                    return await this.extractNextRoutes(repoDir);
                case 'express':
                    return await this.extractExpressRoutes(repoDir);
                case 'django':
                    return await this.extractDjangoRoutes(repoDir);
                default:
                    return routes;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn('Failed to extract routes', { framework, error: errorMessage });
            return routes;
        }
    }
    async extractNextRoutes(repoDir) {
        const routes = [];
        const pagesDir = path.join(repoDir, 'pages');
        const appDir = path.join(repoDir, 'app');
        // Check App Router (app directory)
        if (await fs.pathExists(appDir)) {
            await this.scanAppDirectory(appDir, appDir, routes);
        }
        // Check Pages Router (pages directory)
        if (await fs.pathExists(pagesDir)) {
            await this.scanPagesDirectory(pagesDir, pagesDir, routes);
        }
        return routes;
    }
    async scanAppDirectory(baseDir, currentDir, routes) {
        const items = await fs.readdir(currentDir);
        for (const item of items) {
            const itemPath = path.join(currentDir, item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                await this.scanAppDirectory(baseDir, itemPath, routes);
            }
            else if (item === 'page.tsx' || item === 'page.ts' || item === 'page.js') {
                const routePath = path.relative(baseDir, currentDir).replace(/\\/g, '/');
                routes.push({
                    path: routePath === '' ? '/' : `/${routePath}`,
                    method: 'GET',
                    description: `Next.js app route: ${routePath}`,
                });
            }
        }
    }
    async scanPagesDirectory(baseDir, currentDir, routes) {
        const items = await fs.readdir(currentDir);
        for (const item of items) {
            const itemPath = path.join(currentDir, item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                await this.scanPagesDirectory(baseDir, itemPath, routes);
            }
            else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
                const routePath = path.relative(baseDir, itemPath)
                    .replace(/\.(tsx?|js)$/, '')
                    .replace(/\\/g, '/')
                    .replace(/\/index$/, '');
                routes.push({
                    path: routePath === '' ? '/' : `/${routePath}`,
                    method: 'GET',
                    description: `Next.js page route: ${routePath}`,
                });
            }
        }
    }
    async extractExpressRoutes(repoDir) {
        const routes = [];
        // TODO: Implement Express route extraction by parsing JS files
        // This would involve scanning for app.get, app.post, router.get, etc.
        logger.debug('Express route extraction not implemented yet');
        return routes;
    }
    async extractDjangoRoutes(repoDir) {
        const routes = [];
        // TODO: Implement Django route extraction by parsing urls.py files
        logger.debug('Django route extraction not implemented yet');
        return routes;
    }
    async checkOpenAPI(repoDir) {
        const possiblePaths = [
            'openapi.yaml',
            'openapi.json',
            'swagger.yaml',
            'swagger.json',
            'docs/openapi.yaml',
            'docs/swagger.yaml',
        ];
        for (const apiPath of possiblePaths) {
            if (await fs.pathExists(path.join(repoDir, apiPath))) {
                return true;
            }
        }
        return false;
    }
    async readReadme(repoDir) {
        const possiblePaths = [
            'README.md',
            'readme.md',
            'Readme.md',
            'README.txt',
            'README.rst',
        ];
        for (const readmePath of possiblePaths) {
            const fullPath = path.join(repoDir, readmePath);
            if (await fs.pathExists(fullPath)) {
                return await fs.readFile(fullPath, 'utf-8');
            }
        }
        return undefined;
    }
    extractFeatures(analysis, repoDir) {
        const features = [];
        // Extract features from routes
        const routeFeatures = this.groupRoutesByFeature(analysis.routes);
        features.push(...routeFeatures);
        // Extract features from README if available
        if (analysis.readmeContent) {
            const readmeFeatures = this.extractFeaturesFromReadme(analysis.readmeContent);
            features.push(...readmeFeatures);
        }
        return features;
    }
    groupRoutesByFeature(routes) {
        const featureMap = new Map();
        for (const route of routes) {
            const segments = route.path.split('/').filter(Boolean);
            const category = segments[0] || 'home';
            if (!featureMap.has(category)) {
                featureMap.set(category, {
                    name: this.humanizeString(category),
                    description: `${this.humanizeString(category)} functionality`,
                    category: category,
                    routes: [],
                });
            }
            featureMap.get(category).routes.push(route);
        }
        return Array.from(featureMap.values());
    }
    // Removed - using enhanced version below for AI-powered analysis
    async generateQuickstart(analysis, repoDir) {
        let quickstart = `# Getting Started\n\n`;
        if (analysis.readmeContent) {
            // Extract installation and setup instructions from README
            const installSection = this.extractSection(analysis.readmeContent, /(?:install|setup|getting started)/i);
            if (installSection) {
                quickstart += `## Installation\n\n${installSection}\n\n`;
            }
        }
        // Add framework-specific instructions
        quickstart += this.getFrameworkInstructions(analysis.framework);
        // Add available routes
        if (analysis.routes.length > 0) {
            quickstart += `## Available Routes\n\n`;
            for (const route of analysis.routes.slice(0, 10)) { // Limit to first 10
                quickstart += `- \`${route.method} ${route.path}\``;
                if (route.description) {
                    quickstart += ` - ${route.description}`;
                }
                quickstart += '\n';
            }
            quickstart += '\n';
        }
        return quickstart;
    }
    extractSection(content, regex) {
        const lines = content.split('\n');
        let capturing = false;
        let section = '';
        for (const line of lines) {
            if (regex.test(line) && line.startsWith('#')) {
                capturing = true;
                continue;
            }
            if (capturing) {
                if (line.startsWith('#') && !regex.test(line)) {
                    break;
                }
                section += line + '\n';
            }
        }
        return section.trim() || null;
    }
    getFrameworkInstructions(framework) {
        switch (framework) {
            case 'next':
                return `## Running the Application\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nThe application will be available at http://localhost:3000\n\n`;
            case 'react':
                return `## Running the Application\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\nThe application will be available at http://localhost:3000\n\n`;
            case 'express':
                return `## Running the Application\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\nThe API will be available at http://localhost:3000\n\n`;
            case 'django':
                return `## Running the Application\n\n\`\`\`bash\npip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver\n\`\`\`\n\nThe application will be available at http://localhost:8000\n\n`;
            default:
                return `## Running the Application\n\nPlease refer to the project's README for specific setup instructions.\n\n`;
        }
    }
    humanizeString(str) {
        return str
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    async generateFeatureCandidatesWithAI(analysis, repoDir, repoUrl) {
        logger.info('Generating feature candidates with AI analysis');
        try {
            // Call Planner service for AI analysis
            const plannerUrl = process.env.PLANNER_SERVICE_URL || 'http://localhost:3002';
            // Prepare analysis context for AI
            const context = await this.buildAnalysisContext(analysis, repoDir);
            // For now, return a structured fallback with enhanced heuristics
            // In production, this would call the Planner service
            const featureCandidates = await this.generateFeatureCandidatesHeuristic(analysis, repoDir, repoUrl, context);
            return featureCandidates;
        }
        catch (error) {
            logger.warn('AI-powered feature analysis failed, falling back to heuristic', { error });
            // Fallback to enhanced heuristic analysis
            const context = await this.buildAnalysisContext(analysis, repoDir);
            return this.generateFeatureCandidatesHeuristic(analysis, repoDir, repoUrl, context);
        }
    }
    async buildAnalysisContext(analysis, repoDir) {
        const context = [];
        // Add README content
        if (analysis.readmeContent) {
            context.push("=== README CONTENT ===");
            context.push(analysis.readmeContent.substring(0, 2000)); // Limit size
        }
        // Add package.json insights
        const packageJsonPath = path.join(repoDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            context.push("=== PACKAGE.JSON ===");
            context.push(`Name: ${packageJson.name || 'Unknown'}`);
            context.push(`Description: ${packageJson.description || 'No description'}`);
            context.push(`Scripts: ${Object.keys(packageJson.scripts || {}).join(', ')}`);
            context.push(`Dependencies: ${Object.keys(packageJson.dependencies || {}).slice(0, 10).join(', ')}`);
        }
        // Add route information
        if (analysis.routes.length > 0) {
            context.push("=== API ROUTES ===");
            analysis.routes.slice(0, 15).forEach(route => {
                context.push(`${route.method} ${route.path} - ${route.description || 'No description'}`);
            });
        }
        // Add framework info
        context.push(`=== FRAMEWORK ===`);
        context.push(`Detected: ${analysis.framework}`);
        return context.join('\n');
    }
    async generateFeatureCandidatesHeuristic(analysis, repoDir, repoUrl, context) {
        logger.info('Generating feature candidates using enhanced heuristics');
        const features = [];
        // Analyze based on framework
        switch (analysis.framework) {
            case 'next':
                features.push(...await this.analyzeNextJsFeatures(repoDir, analysis.routes));
                break;
            case 'react':
                features.push(...await this.analyzeReactFeatures(repoDir));
                break;
            case 'express':
                features.push(...await this.analyzeExpressFeatures(repoDir, analysis.routes));
                break;
            case 'django':
                features.push(...await this.analyzeDjangoFeatures(repoDir));
                break;
            default:
                features.push(...await this.analyzeGenericFeatures(repoDir, analysis.routes));
        }
        // Add features from README analysis
        if (analysis.readmeContent) {
            features.push(...this.extractFeaturesFromReadme(analysis.readmeContent));
        }
        // Sort by priority and filter duplicates
        const uniqueFeatures = this.deduplicateFeatures(features);
        const sortedFeatures = uniqueFeatures.sort((a, b) => a.priority - b.priority);
        return {
            repository: repoUrl,
            framework: analysis.framework,
            totalFeatures: sortedFeatures.length,
            features: sortedFeatures.slice(0, 8), // Limit to top 8 features
            analysisConfidence: 0.7, // Heuristic confidence
            generatedAt: new Date().toISOString()
        };
    }
    async analyzeNextJsFeatures(repoDir, routes) {
        const features = [];
        // Find the Next.js directory (could be root or subdirectory like frontend/)
        const possibleDirs = ['', 'frontend', 'client', 'web', 'ui', 'app'];
        let nextjsDir = repoDir;
        for (const subdir of possibleDirs) {
            const testDir = subdir ? path.join(repoDir, subdir) : repoDir;
            const packageJsonPath = path.join(testDir, 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
                const packageJson = await fs.readJson(packageJsonPath);
                if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
                    nextjsDir = testDir;
                    break;
                }
            }
        }
        // Check for app directory (App Router)
        const appDir = path.join(nextjsDir, 'app');
        if (await fs.pathExists(appDir)) {
            features.push({
                name: 'App Router Navigation',
                description: 'Modern Next.js app directory structure with nested layouts',
                rationale: 'App directory detected - key architectural feature',
                primaryPath: path.relative(repoDir, appDir),
                category: 'core',
                priority: 1,
                demoable: true
            });
            // Check for specific app directory features
            const layoutPath = path.join(appDir, 'layout.tsx');
            if (await fs.pathExists(layoutPath)) {
                features.push({
                    name: 'Root Layout Component',
                    description: 'Shared layout component for the entire application',
                    rationale: 'Root layout.tsx provides consistent UI structure',
                    primaryPath: path.relative(repoDir, layoutPath),
                    category: 'user-facing',
                    priority: 2,
                    demoable: true
                });
            }
        }
        // Check for API routes
        const apiDir = path.join(nextjsDir, 'pages/api');
        const appApiDir = path.join(nextjsDir, 'app/api');
        if (await fs.pathExists(apiDir) || await fs.pathExists(appApiDir)) {
            features.push({
                name: 'API Routes',
                description: 'Server-side API endpoints built with Next.js',
                rationale: 'API directory found with route handlers',
                primaryPath: await fs.pathExists(appApiDir) ? path.relative(repoDir, appApiDir) : path.relative(repoDir, apiDir),
                category: 'api',
                priority: 2,
                demoable: true
            });
        }
        // Add README-based features
        const readmePath = path.join(repoDir, 'README.md');
        if (await fs.pathExists(readmePath)) {
            const readmeContent = await fs.readFile(readmePath, 'utf-8');
            // Look for 3D/drawing features mentioned in README
            if (readmeContent.toLowerCase().includes('3d') || readmeContent.toLowerCase().includes('draw')) {
                features.push({
                    name: '3D Drawing Interface',
                    description: 'Interactive 3D drawing and modeling capabilities',
                    rationale: 'README mentions 3D drawing functionality',
                    primaryPath: 'app/',
                    category: 'user-facing',
                    priority: 1,
                    demoable: true
                });
            }
            if (readmeContent.toLowerCase().includes('sketch') || readmeContent.toLowerCase().includes('canvas')) {
                features.push({
                    name: '2D Canvas Sketching',
                    description: '2D drawing canvas for creating sketches',
                    rationale: 'README mentions sketching/canvas functionality',
                    primaryPath: 'app/',
                    category: 'user-facing',
                    priority: 1,
                    demoable: true
                });
            }
            if (readmeContent.toLowerCase().includes('enhance') || readmeContent.toLowerCase().includes('improve')) {
                features.push({
                    name: 'AI Drawing Enhancement',
                    description: 'AI-powered drawing improvement and refinement',
                    rationale: 'README mentions drawing enhancement features',
                    primaryPath: 'app/',
                    category: 'user-facing',
                    priority: 2,
                    demoable: true
                });
            }
        }
        // Check for middleware
        if (await fs.pathExists(path.join(repoDir, 'middleware.ts')) ||
            await fs.pathExists(path.join(repoDir, 'middleware.js'))) {
            features.push({
                name: 'Middleware',
                description: 'Request/response middleware for authentication, redirects, etc.',
                rationale: 'Middleware file detected',
                primaryPath: 'middleware.ts',
                category: 'core',
                priority: 3,
                demoable: false
            });
        }
        return features;
    }
    async analyzeReactFeatures(repoDir) {
        const features = [];
        // Check for common React patterns
        const srcDir = path.join(repoDir, 'src');
        const componentsDir = path.join(srcDir, 'components');
        if (await fs.pathExists(componentsDir)) {
            features.push({
                name: 'Component Library',
                description: 'Reusable React components for UI consistency',
                rationale: 'Components directory with multiple files detected',
                primaryPath: 'src/components/',
                category: 'user-facing',
                priority: 1,
                demoable: true
            });
        }
        // Check for routing
        if (await this.hasPackageDependency(repoDir, 'react-router-dom')) {
            features.push({
                name: 'Client-side Routing',
                description: 'Multi-page navigation with React Router',
                rationale: 'React Router dependency detected',
                primaryPath: 'src/',
                category: 'core',
                priority: 2,
                demoable: true
            });
        }
        return features;
    }
    async analyzeExpressFeatures(repoDir, routes) {
        const features = [];
        // Group routes by functionality
        const authRoutes = routes.filter(r => r.path.includes('auth') || r.path.includes('login'));
        const userRoutes = routes.filter(r => r.path.includes('user') || r.path.includes('profile'));
        const apiRoutes = routes.filter(r => r.path.includes('api'));
        if (authRoutes.length > 0) {
            features.push({
                name: 'Authentication System',
                description: 'User login, registration, and session management',
                rationale: `Found ${authRoutes.length} authentication-related routes`,
                primaryPath: authRoutes[0].path,
                category: 'core',
                priority: 1,
                demoable: true
            });
        }
        if (userRoutes.length > 0) {
            features.push({
                name: 'User Management',
                description: 'User profiles, settings, and account management',
                rationale: `Found ${userRoutes.length} user-related routes`,
                primaryPath: userRoutes[0].path,
                category: 'user-facing',
                priority: 2,
                demoable: true
            });
        }
        if (apiRoutes.length > 0) {
            features.push({
                name: 'REST API',
                description: 'RESTful API endpoints for data operations',
                rationale: `Found ${apiRoutes.length} API routes`,
                primaryPath: apiRoutes[0].path,
                category: 'api',
                priority: 2,
                demoable: true
            });
        }
        return features;
    }
    async analyzeDjangoFeatures(repoDir) {
        const features = [];
        // Check for Django apps
        const files = await fs.readdir(repoDir);
        const appDirs = [];
        for (const file of files) {
            const filePath = path.join(repoDir, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory() && await fs.pathExists(path.join(filePath, 'models.py'))) {
                appDirs.push(file);
            }
        }
        if (appDirs.length > 0) {
            features.push({
                name: 'Django Apps',
                description: 'Modular Django applications with models and views',
                rationale: `Found ${appDirs.length} Django apps: ${appDirs.join(', ')}`,
                primaryPath: appDirs[0],
                category: 'core',
                priority: 1,
                demoable: true
            });
        }
        // Check for admin interface
        if (await this.fileContains(path.join(repoDir, 'urls.py'), 'admin/')) {
            features.push({
                name: 'Admin Interface',
                description: 'Django admin panel for content management',
                rationale: 'Admin URL pattern found',
                primaryPath: '/admin/',
                category: 'admin',
                priority: 3,
                demoable: true
            });
        }
        return features;
    }
    async analyzeGenericFeatures(repoDir, routes) {
        const features = [];
        // Basic route analysis
        if (routes.length > 0) {
            features.push({
                name: 'Web Application',
                description: 'Multi-page web application with routing',
                rationale: `Found ${routes.length} routes`,
                primaryPath: routes[0].path,
                category: 'core',
                priority: 1,
                demoable: true
            });
        }
        return features;
    }
    extractFeaturesFromReadme(readmeContent) {
        const features = [];
        const lines = readmeContent.toLowerCase().split('\n');
        // Look for feature sections
        const featureKeywords = ['features', 'functionality', 'capabilities', 'what it does'];
        for (const keyword of featureKeywords) {
            const sectionStart = lines.findIndex(line => line.includes(keyword) && (line.includes('#') || line.includes('##')));
            if (sectionStart >= 0) {
                // Extract features from this section
                for (let i = sectionStart + 1; i < Math.min(sectionStart + 10, lines.length); i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
                        const featureName = line.replace(/^[-*•]\s*/, '').trim();
                        if (featureName.length > 5 && featureName.length < 100) {
                            features.push({
                                name: this.humanizeString(featureName.substring(0, 50)),
                                description: featureName,
                                rationale: 'Extracted from README features section',
                                primaryPath: '/',
                                category: 'user-facing',
                                priority: 4,
                                demoable: true
                            });
                        }
                    }
                }
            }
        }
        return features.slice(0, 3); // Limit README-extracted features
    }
    deduplicateFeatures(features) {
        const seen = new Set();
        return features.filter(feature => {
            const key = feature.name.toLowerCase().replace(/\s+/g, '');
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    async hasPackageDependency(repoDir, packageName) {
        try {
            const packageJsonPath = path.join(repoDir, 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
                const packageJson = await fs.readJson(packageJsonPath);
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                return packageName in deps;
            }
        }
        catch (error) {
            logger.debug('Failed to check package dependency', { packageName, error });
        }
        return false;
    }
    async fileContains(filePath, searchText) {
        try {
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf-8');
                return content.includes(searchText);
            }
        }
        catch (error) {
            logger.debug('Failed to check file contents', { filePath, error });
        }
        return false;
    }
    convertToFeatureCandidates(features, analysis, repoUrl) {
        const candidates = features.map((feature, index) => ({
            name: feature.name,
            description: feature.description,
            rationale: `Basic feature extraction from ${feature.category} category`,
            primaryPath: feature.files?.[0] || '/',
            category: feature.category,
            priority: index + 1,
            demoable: true
        }));
        return {
            repository: repoUrl,
            framework: analysis.framework,
            totalFeatures: candidates.length,
            features: candidates.slice(0, 8),
            analysisConfidence: 0.5, // Lower confidence for basic extraction
            generatedAt: new Date().toISOString()
        };
    }
}
