# Showcase

**Your project, taught and showcased**

Showcase is an AI-powered platform that automatically generates custom demo videos and tutorials for applications and open-source repositories. Simply provide a repository URL or app URL, and our intelligent pipeline will analyze, explore, script, and create a professional demo video tailored to your audience.
<img width="2146" height="1208" alt="image" src="https://github.com/user-attachments/assets/dab44ab3-ce3d-4a33-80ba-4a748975c9b6" />

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
- **Cerebras** for text & storyboard generation
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

## Usage

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

Video Demo: https://www.youtube.com/watch?v=SoQctxmM9N4


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

## Acknowledgments

- **RunwayML** for AI video generation capabilities
- **Cerebras** for storyboard & text generation
- **Playwright & Browser Use** for browser automation
- **Suno** for music generation

---
