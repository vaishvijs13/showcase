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
    <div className={cn("flex flex-col h-full bg-surface border-l border-border", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h3 className="text-subheading text-primary">Preview</h3>
        <p className="text-xs text-secondary mt-1">
          {state === 'idle' && 'Your demo preview will appear here'}
          {state === 'running' && 'Generating your demo...'}
          {state === 'complete' && 'Demo generation complete'}
          {state === 'error' && 'An error occurred during generation'}
        </p>
        {jobId && (
          <p className="text-xs text-muted mt-1">Job ID: {jobId}</p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {state === 'idle' && <IdleState />}
        {state === 'running' && <RunningState sceneClips={sceneClips} jobId={jobId} />}
        {state === 'complete' && finalVideo && <CompleteState videoUrl={finalVideo} />}
        {state === 'complete' && !finalVideo && <ErrorState message="Video was generated but is not available for preview" />}
        {state === 'error' && <ErrorState message="Pipeline failed. Please try again." />}
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="w-full aspect-video bg-background border border-border rounded geometric-pattern flex items-center justify-center">
        <div className="text-6xl text-muted opacity-30">
          <FileVideo />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-secondary">Ready to generate your demo</p>
        <p className="text-xs text-muted">Configure your repository and audience, then click "Run Pipeline" to begin</p>
      </div>
    </div>
  );
}

function RunningState({ sceneClips, jobId }: { sceneClips: string[], jobId?: string }) {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-foreground rounded-full pulse-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-foreground rounded-full pulse-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-foreground rounded-full pulse-dot" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-secondary">Processing scenes...</p>
        <p className="text-xs text-muted mt-1">This may take several minutes</p>
      </div>

      {/* Scene clips grid - Show placeholders for expected scenes */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="aspect-video bg-surface-elevated border border-border rounded group">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-muted">Scene {index + 1}</p>
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
    <div className="w-full space-y-4">
      {/* Video Player */}
      <div className="aspect-video bg-background border border-border rounded overflow-hidden">
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
      <div className="text-center space-y-2">
        <p className="text-sm text-primary font-medium">🎉 Your demo video is ready!</p>
        <p className="text-xs text-secondary">The video has been generated with AI narration and background music</p>
      </div>

      {/* Download Options */}
      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="btn-invert"
          onClick={() => handleDownload('MP4')}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Video
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="btn-invert"
          onClick={() => window.open(videoUrl, '_blank')}
        >
          <Play className="h-4 w-4 mr-2" />
          Open in New Tab
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="w-full aspect-video bg-background border border-border rounded flex items-center justify-center">
        <div className="text-6xl text-red-500 opacity-30">
          ❌
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-red-600 font-medium">Generation Failed</p>
        <p className="text-xs text-muted">{message}</p>
        <p className="text-xs text-secondary">Check the console for more details or try again with different settings</p>
      </div>
    </div>
  );
}