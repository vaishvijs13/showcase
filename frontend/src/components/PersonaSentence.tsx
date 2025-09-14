import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface PersonaSentenceProps {
  role: string;
  purpose: string;
  musicVibe: string;
  onRoleChange: (role: string) => void;
  onPurposeChange: (purpose: string) => void;
  onMusicVibeChange: (vibe: string) => void;
}

const roles = [
  "Developer",
  "Student",
  "Founder",
  "Designer",
  "Researcher"
];

const purposes = [
  "Learning",
  "Sending to a VC",
  "Sending to a customer",
  "Documentation",
  "Teaching"
];

const musicVibes = [
  "Lofi",
  "Mario Kart",
  "Elevator music",
  "Upbeat tech",
  "Chill ambient",
  "Corporate",
  "No music"
];

export function PersonaSentence({ role, purpose, musicVibe, onRoleChange, onPurposeChange, onMusicVibeChange }: PersonaSentenceProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-caption text-secondary">
          03. TARGET AUDIENCE
        </label>

        <div className="text-sm leading-relaxed">
          <span className="text-secondary">I am a </span>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[120px] h-auto p-1 bg-transparent border-0 border-b border-border hover:border-foreground focus:border-foreground font-medium text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-elevated border-border">
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="text-primary hover:bg-surface focus:bg-surface">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-secondary"> who wants a demo for </span>

          <Select value={purpose} onValueChange={onPurposeChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[140px] h-auto p-1 bg-transparent border-0 border-b border-border hover:border-foreground focus:border-foreground font-medium text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-elevated border-border">
              {purposes.map((p) => (
                <SelectItem key={p} value={p} className="text-primary hover:bg-surface focus:bg-surface">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-secondary">.</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-caption text-secondary">
          04. MUSIC VIBE
        </label>

        <div className="text-sm leading-relaxed">
          <span className="text-secondary">Set the mood with </span>
          <Select value={musicVibe} onValueChange={onMusicVibeChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[140px] h-auto p-1 bg-transparent border-0 border-b border-border hover:border-foreground focus:border-foreground font-medium text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-elevated border-border">
              {musicVibes.map((vibe) => (
                <SelectItem key={vibe} value={vibe} className="text-primary hover:bg-surface focus:bg-surface">
                  {vibe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-secondary"> background music.</span>
        </div>
      </div>
    </div>
  );
}