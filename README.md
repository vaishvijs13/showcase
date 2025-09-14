# Showcase

**Your project, taught and showcased**

Showcase is an AI-powered platform that automatically generates custom demo videos and tutorials for applications and open-source repositories. Simply provide a repository URL or app URL, and our intelligent pipeline will analyze, explore, script, and create a professional demo video tailored to your audience.

## Features

- **Repository Analysis**: Automatically ingests and analyzes codebases to understand functionality
- **Live App Exploration**: Uses AI browser agents to explore web applications in real-time
- **Intelligent Scripting**: Generates educational scripts based on your target audience and purpose
- **AI-Generated Audio**: Creates natural-sounding narration with customizable voice and tone
- **Automated Video Recording**: Records screen interactions with professional quality
- **Smart Composition**: Combines audio, video, and effects into polished final videos
- **Real-time Pipeline**: Watch your demo video being created step-by-step

## Architecture

Showcase is built as a microservices architecture with the following components:

### Backend Services

- **Gateway** (`@takeone/gateway`): Main API gateway and job orchestration service
- **Explorer** (`@takeone/explorer`): Repository ingestion, live crawling, and recording
- **Planner** (`@takeone/planner`): Storyboard generation with Cerebras integration
- **Presenter** (`@takeone/presenter`): Video generation using RunwayML
- **Composer** (`@takeone/composer`): Final video music composition and video editing
- **Browser Agent** (`browser-agent`): Python service for web app exploration using browser automation

### Frontend

- **React + TypeScript**: Modern web interface with Vite
- **Real-time Updates**: Live pipeline progress tracking
- **Preview Panel**: Real-time video preview and playback

### Shared Packages

- **Types** (`@takeone/types`): Shared TypeScript type definitions
- **Utils** (`@takeone/utils`): Common utilities and helpers

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST APIs
- **Turbo** for monorepo management
- **pnpm** for package management
- **Bull** for job queues
- **Redis** for caching and job storage
- **Playwright** for browser automation
- **RunwayML** for AI video generation
- **Cerebras** for text generation
- **Suno** for music generation

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **React Router** for navigation

### Infrastructure
- **pnpm workspaces** for monorepo management
- **Turbo** for build orchestration

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.10.0
- Python 3.8+ (for browser agent)
- Redis (for job queues)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd showcase
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   pnpm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend services
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   
   # Browser agent
   cp backend/services/browser-agent/.env.example backend/services/browser-agent/.env
   # Edit with your OpenAI API key
   ```

4. **Start Redis** (required for job queues)
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or using your system package manager
   # macOS: brew install redis && brew services start redis
   # Ubuntu: sudo apt install redis-server && sudo systemctl start redis
   ```

### Development

1. **Start all services**
   ```bash
   cd backend
   pnpm dev:all
   ```

2. **Start frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start browser agent** (in a new terminal)
   ```bash
   cd backend/services/browser-agent
   pip install -r requirements.txt
   python main.py
   ```

### Individual Services

You can also run services individually:

```bash
# Gateway service
pnpm dev:gateway

# Explorer service
pnpm dev:explorer

# Planner service
pnpm dev:planner

# Presenter service
pnpm dev:presenter

# Composer service
pnpm dev:composer
```

## 📖 Usage

1. **Open the application** at `http://localhost:5173`

2. **Configure your demo**:
   - Enter a repository URL (GitHub, GitLab, etc.)
   - Or provide a live application URL
   - Set your target audience (role and purpose)
   - Choose music style

3. **Run the pipeline**:
   - Click "run pipeline"
   - Watch the real-time progress as each step completes
   - Watch the scenes to your video load as it's being created

4. **Download your demo**:
   - Once complete, the final MP4 video loads in the preview
   - Share with your team or audience

## 🔧 Configuration

### Environment Variables

#### Backend Services
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_openai_key
RUNWAY_API_KEY=your_runway_key
CEREBRAS_API_KEY=your_cerebras_key
SUNO_API_KEY=your_suno_key (thank you to Suno for providing us with exclusive API access)

# Service Ports
GATEWAY_PORT=3000
EXPLORER_PORT=3001
PLANNER_PORT=3002
PRESENTER_PORT=3003
COMPOSER_PORT=3004
```

#### Browser Agent
```env
OPENAI_API_KEY=your_openai_key
PORT=3005
```

### Customization

- **Persona Settings**: Modify target audience, tone, and purpose
- **Music Styles**: Choose from various background music options
- **Video Quality**: Adjust resolution and frame rate settings

## Pipeline Flow

1. **Analyze** - Ingest and analyze repository or app structure
2. **Browse** - Explore live application with AI browser agent
3. **Script** - Generate educational script based on analysis
4. **Audio** - Create AI-generated narration with chosen voice
5. **Video** - Record screen interactions and app usage
6. **Compose** - Combine audio, video, and effects into final demo

## Testing

```bash
# Run all tests
cd backend
pnpm test

# Run tests for specific service
pnpm test --filter=@takeone/gateway

# Frontend tests
cd frontend
npm test
```

## Deployment

### Production Build

```bash
# Build all services
cd backend
pnpm build

# Build frontend
cd frontend
npm run build
```

## Acknowledgments

- **RunwayML** for AI video generation capabilities
- **Cerebras** for storyboard generation
- **Playwright & Browser Use** for browser automation
- **Suno** for music generation

---
