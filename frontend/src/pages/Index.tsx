import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RepoInput } from "@/components/RepoInput";
import { AppUrlInput } from "@/components/AppUrlInput";
import { PersonaSentence } from "@/components/PersonaSentence";
import { PipelineBar } from "@/components/PipelineBar";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [repoUrl, setRepoUrl] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [role, setRole] = useState("Developer");
  const [purpose, setPurpose] = useState("Learning");
  const [musicVibe, setMusicVibe] = useState("Upbeat tech");
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<Array<{
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete' | 'error';
  }>>([
    { id: 'ingest', label: 'Analyze', status: 'pending' },
    { id: 'crawl', label: 'Browse', status: 'pending' },
    { id: 'plan', label: 'Script', status: 'pending' },
    { id: 'generate', label: 'Audio', status: 'pending' },
    { id: 'record', label: 'Video', status: 'pending' },
    { id: 'compose', label: 'Compose', status: 'pending' }
  ]);

  const canRunPipeline = (repoUrl.trim() || appUrl.trim()) && role && purpose;

  const createJob = async () => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          appUrl: appUrl.trim(),
          persona: {
            role,
            purpose,
            tone: 'educational',
            length: 'medium'
          },
          music: {
            style: 'upbeat tech background',
            enabled: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.jobId;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  };

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to poll job status:', error);
      throw error;
    }
  }, []);

  const updatePipelineFromStatus = useCallback((status: any) => {
    const statusMap: Record<string, string> = {
      'pending': 'ingest',
      'ingesting': 'ingest',
      'crawling': 'crawl',
      'planning': 'plan',
      'generating': 'generate',
      'recording': 'record',
      'composing': 'compose',
      'complete': 'compose'
    };

    const currentStep = statusMap[status.status];
    
    setPipelineSteps(prev => prev.map(step => {
      if (step.id === currentStep && status.status !== 'complete') {
        return { ...step, status: 'active' as const };
      } else if (prev.findIndex(s => s.id === step.id) < prev.findIndex(s => s.id === currentStep)) {
        return { ...step, status: 'complete' as const };
      }
      return step;
    }));

    if (status.status === 'complete') {
      setPipelineSteps(prev => prev.map(step => ({ ...step, status: 'complete' as const })));
      setPipelineState('complete');
      
      // Get final video URL from artifacts
      if (status.artifacts?.finalVideo) {
        console.log('Setting final video URL:', status.artifacts.finalVideo);
        setFinalVideoUrl(status.artifacts.finalVideo);
      }
    } else if (status.status === 'error') {
      setPipelineState('error');
      setPipelineSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error' as const } : step
      ));
    }
  }, []);

  const handleRunPipeline = async () => {
    if (!canRunPipeline) return;
    
    try {
      setPipelineState('running');
      setFinalVideoUrl(null);
      
      // Reset pipeline steps
      setPipelineSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
      
      toast({
        title: "Starting Pipeline",
        description: "Creating your demo video...",
      });

      // Create job
      const jobId = await createJob();
      setCurrentJobId(jobId);
      
      toast({
        title: "Job Created",
        description: `Job ID: ${jobId}`,
      });

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const status = await pollJobStatus(jobId);
          console.log('Job status update:', status); // Debug logging
          updatePipelineFromStatus(status);
          
          if (status.status === 'complete' || status.status === 'error') {
            clearInterval(pollInterval);
            
            if (status.status === 'complete') {
              toast({
                title: "Pipeline Complete! 🎉",
                description: "Your demo video is ready to watch.",
              });
            } else {
              toast({
                title: "Pipeline Failed ❌",
                description: status.error || "An error occurred during processing.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
          setPipelineState('error');
          toast({
            title: "Connection Error",
            description: "Lost connection to server. Please check your network and try again.",
            variant: "destructive",
          });
        }
      }, 2000); // Poll every 2 seconds for more responsive updates

      // Add timeout for very long jobs
      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        setPipelineState('error');
        toast({
          title: "Pipeline Timeout",
          description: "The job is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      }, 600000); // 10 minutes timeout

      // Clear timeout if job completes normally
      const originalClearInterval = clearInterval;
      clearInterval = (...args) => {
        clearTimeout(timeoutId);
        originalClearInterval(...args);
      };

    } catch (error) {
      setPipelineState('error');
      toast({
        title: "Error",
        description: "Failed to start pipeline. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="showcase logo" className="w-10 h-10" />
            <h1 className="text-display text-primary">showcase</h1>
          </div>
          <p className="text-sm text-secondary mt-1">
            Walkthroughs that teach, demos that stick — for any app or open-source repo.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left Panel - Configuration */}
        <div className="w-80 p-6 space-y-8 border-r border-border">
          <RepoInput value={repoUrl} onChange={setRepoUrl} />
          <AppUrlInput value={appUrl} onChange={setAppUrl} />
          <PersonaSentence
            role={role}
            purpose={purpose}
            musicVibe={musicVibe}
            onRoleChange={setRole}
            onPurposeChange={setPurpose}
            onMusicVibeChange={setMusicVibe}
          />

          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleRunPipeline}
              disabled={!canRunPipeline || pipelineState === 'running'}
              className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground disabled:text-background disabled:opacity-50"
              size="lg"
            >
              {pipelineState === 'running' ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  RUNNING PIPELINE
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  RUN PIPELINE
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col">
          <PreviewPanel
            state={pipelineState}
            sceneClips={[]} // Will be populated from real scene data later
            finalVideo={finalVideoUrl || undefined}
            jobId={currentJobId || undefined}
          />
        </div>
      </div>

      {/* Bottom Pipeline Bar */}
      <PipelineBar steps={pipelineSteps} />
    </div>
  );
};

export default Index;
