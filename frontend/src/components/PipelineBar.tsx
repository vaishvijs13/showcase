import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface PipelineBarProps {
  steps: PipelineStep[];
  className?: string;
}

const PIPELINE_STEPS = [
  { id: 'ingest', label: 'Analyze' },
  { id: 'crawl', label: 'Browse' },
  { id: 'plan', label: 'Script' },
  { id: 'generate', label: 'Audio' },
  { id: 'record', label: 'Video' },
  { id: 'compose', label: 'Compose' }
];

export function PipelineBar({ steps, className }: PipelineBarProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2 p-4 bg-surface border-t border-border", className)}>
      <div className="flex items-center gap-1 flex-1">
        {PIPELINE_STEPS.map((step, index) => {
          const stepStatus = steps.find(s => s.id === step.id)?.status || 'pending';
          
          return (
            <div key={step.id} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center justify-center gap-2 px-3 py-1.5 rounded border text-xs font-medium uppercase tracking-wide transition-all duration-300",
                stepStatus === 'pending' && "border-border text-muted bg-transparent",
                stepStatus === 'active' && "border-foreground text-foreground bg-transparent",
                stepStatus === 'complete' && "border-foreground text-background bg-foreground",
                stepStatus === 'error' && "border-status-error text-status-error bg-transparent"
              )}>
                {stepStatus === 'complete' && <Check className="h-3 w-3" />}
                {stepStatus === 'error' && <X className="h-3 w-3" />}
                <span>{step.label}</span>
              </div>
              
              {index < PIPELINE_STEPS.length - 1 && (
                <div className={cn(
                  "h-px flex-1 transition-colors duration-500",
                  stepStatus === 'complete' ? "bg-foreground" : "bg-border"
                )}>
                  {stepStatus === 'active' && (
                    <div className="h-full bg-foreground loading-line" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}