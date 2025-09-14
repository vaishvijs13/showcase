import { cn } from "@/lib/utils";
import { Play, Download, FileVideo, FileText } from "lucide-react";
import { Button } from "./ui/button";

interface PreviewPanelProps {
  state: 'idle' | 'running' | 'complete' | 'error';
  sceneClips?: string[];
  finalVideo?: string;
  jobId?: string;
  className?: string;
}

export function PreviewPanel({ state, sceneClips = [], finalVideo, jobId, className }: PreviewPanelProps) {
  return (
    <div className={cn("glass-card rounded-2xl flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <h3 className="text-lg font-semibold text-primary gradient-text lowercase">preview</h3>
        <p className="text-xs text-secondary mt-1 lowercase">
          {state === 'idle' && 'your demo preview will appear here'}
          {state === 'running' && 'generating your demo...'}
          {state === 'complete' && 'demo generation complete'}
          {state === 'error' && 'an error occurred during generation'}
        </p>
        {jobId && (
          <p className="text-xs text-muted mt-1 font-mono lowercase">job id: {jobId}</p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {state === 'idle' && <IdleState />}
        {state === 'running' && <RunningState sceneClips={sceneClips} jobId={jobId} />}
        {state === 'complete' && finalVideo && <CompleteState videoUrl={finalVideo} />}
        {state === 'complete' && !finalVideo && <ErrorState message="video was generated but is not available for preview" />}
        {state === 'error' && <ErrorState message="pipeline failed. please try again." />}
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="w-full aspect-video glass-surface rounded-xl flex items-center justify-center">
        <div className="text-6xl text-muted opacity-40">
          <FileVideo />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-base text-secondary font-medium lowercase">ready to generate your demo</p>
        <p className="text-sm text-muted lowercase">configure your repository and audience, then click "run pipeline" to begin</p>
      </div>
    </div>
  );
}

function RunningState({ sceneClips, jobId }: { sceneClips: string[], jobId?: string }) {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full pulse-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full pulse-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full pulse-dot" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-base text-secondary font-medium lowercase">processing scenes...</p>
        <p className="text-sm text-muted mt-1 lowercase">this may take several minutes</p>
      </div>

      {/* Scene clips grid - Show placeholders for expected scenes */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="aspect-video glass-surface rounded-xl group">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted font-medium lowercase">scene {index + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompleteState({ videoUrl }: { videoUrl: string }) {
  console.log('CompleteState rendering with videoUrl:', videoUrl);
  
  // Add cache busting to video URL to force reload
  const cacheBustedVideoUrl = `${videoUrl}?t=${Date.now()}`;
  console.log('Cache-busted video URL:', cacheBustedVideoUrl);
  
  const handleDownload = (type: string) => {
    if (type === 'MP4') {
      // Download the video file
      const link = document.createElement('a');
      link.href = videoUrl; // Use original URL for download
      link.download = 'demo-video.mp4';
      link.click();
    }
  };


  return (
    <div className="w-full space-y-6">
      {/* Video Player */}
      <div className="aspect-video glass-surface rounded-xl overflow-hidden">
        <video
          src={cacheBustedVideoUrl}
          controls
          className="w-full h-full"
          preload="metadata"
          onError={(e) => {
            console.error('Video loading error:', e);
            console.error('Failed video URL:', cacheBustedVideoUrl);
            console.error('Original URL:', videoUrl);
            console.error('Video element:', e.target);
          }}
          onLoadStart={() => {
            console.log('Video loading started for URL:', cacheBustedVideoUrl);
          }}
          onCanPlay={() => {
            console.log('Video can play:', cacheBustedVideoUrl);
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video Info */}
      <div className="text-center space-y-3">
        <p className="text-lg text-primary font-semibold gradient-text lowercase">your demo video is ready!</p>
        <p className="text-sm text-secondary lowercase">the video has been generated with ai narration and background music</p>
      </div>

      {/* Download Options */}
      <div className="flex items-center justify-center gap-3">
        <Button 
          size="sm" 
          className="btn-gradient-secondary"
          onClick={() => handleDownload('MP4')}
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="lowercase">download video</span>
        </Button>
        <Button 
          size="sm" 
          className="btn-gradient-primary"
          onClick={() => window.open(videoUrl, '_blank')}
        >
          <Play className="h-4 w-4 mr-2" />
          <span className="lowercase">open in new tab</span>
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="w-full aspect-video glass-surface rounded-xl flex items-center justify-center">
        <div className="text-6xl text-red-500 opacity-40">
          ×
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-base text-red-400 font-semibold lowercase">generation failed</p>
        <p className="text-sm text-muted lowercase">{message}</p>
        <p className="text-sm text-secondary lowercase">check the console for more details or try again with different settings</p>
      </div>
    </div>
  );
}