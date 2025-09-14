import { Upload, Github } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface RepoInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function RepoInput({ value, onChange }: RepoInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-caption text-secondary">
          01. REPOSITORY
        </label>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="https://github.com/username/repo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 font-mono text-sm bg-surface border-border text-primary placeholder:text-muted focus:border-foreground transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="h-px bg-border flex-1" />
        <span className="text-xs text-muted uppercase tracking-wider">OR</span>
        <div className="h-px bg-border flex-1" />
      </div>
      
      <Button 
        variant="outline" 
        className="w-full btn-ghost border-dashed border-border hover:border-foreground group"
      >
        <Upload className="mr-2 h-4 w-4 group-hover:text-foreground transition-colors" />
        Upload Local Repo (ZIP)
      </Button>
    </div>
  );
}