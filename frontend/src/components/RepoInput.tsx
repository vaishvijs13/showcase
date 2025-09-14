import { Upload, Github } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRef } from "react";

interface RepoInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function RepoInput({ value, onChange }: RepoInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just show the filename. In a real implementation, you'd upload the file
      onChange(`Uploaded: ${file.name}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-base font-semibold text-primary lowercase tracking-wide">
          01. repository
        </label>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="https://github.com/username/repo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 h-10 font-mono text-sm glass-input rounded-lg text-left text-primary placeholder:text-muted focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="h-px bg-glass-border flex-1" />
        <span className="text-xs text-muted lowercase tracking-wider font-medium">or</span>
        <div className="h-px bg-glass-border flex-1" />
      </div>
      
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button 
          variant="outline" 
          onClick={handleUploadClick}
          className="w-full h-10 glass-surface border-dashed border-glass-border hover:border-cyan-400 hover:bg-glass-elevated group rounded-lg transition-all duration-300"
        >
          <Upload className="mr-2 h-4 w-4 group-hover:text-cyan-400 transition-colors" />
          <span className="text-sm font-medium lowercase">upload local repo (zip)</span>
        </Button>
      </div>
    </div>
  );
}