import { Globe, Info } from "lucide-react";
import { Input } from "./ui/input";

interface AppUrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function AppUrlInput({ value, onChange }: AppUrlInputProps) {
  return (
    <div className="space-y-3">
      <label className="text-base font-semibold text-primary lowercase tracking-wide">
        02. application url
      </label>
      
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          type="text"
          placeholder="https://localhost:3000 or https://yourapp.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 h-10 font-mono text-sm glass-input rounded-lg text-left text-primary placeholder:text-muted focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
        />
      </div>
      
      <div className="flex items-start gap-2 text-xs text-muted">
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span className="lowercase">
          localhost urls are supported. make sure your app is running and accessible.
        </span>
      </div>
    </div>
  );
}