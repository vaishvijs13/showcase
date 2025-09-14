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
  { id: 'ingest', label: 'collect' },
  { id: 'crawl', label: 'process' },
  { id: 'plan', label: 'audio' },
  { id: 'generate', label: 'compose' }
];

export function PipelineBar({ steps, className }: PipelineBarProps) {
  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <div className="flex items-center gap-1 flex-1">
        {PIPELINE_STEPS.map((step, index) => {
          const stepStatus = steps.find(s => s.id === step.id)?.status || 'pending';

          return (
            <div key={step.id} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-500 relative overflow-hidden",
                stepStatus === 'pending' && "glass-surface text-muted",
                stepStatus === 'active' && "glass-elevated text-primary border-2 border-cyan-400",
                stepStatus === 'complete' && "pipeline-gradient-fill text-white",
                stepStatus === 'error' && "glass-surface text-red-400 border-2 border-red-400"
              )}>
                {stepStatus === 'complete' && <Check className="h-3 w-3" />}
                {stepStatus === 'error' && <X className="h-3 w-3" />}
                <span>{step.label}</span>
              </div>

              {index < PIPELINE_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 rounded-full transition-all duration-500",
                  stepStatus === 'complete' ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-glass-border"
                )}>
                  {stepStatus === 'active' && (
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 loading-line rounded-full" />
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