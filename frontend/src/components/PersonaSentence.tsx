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
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="text-base font-semibold text-primary lowercase tracking-wide">
          03. target audience
        </label>

        <div className="text-sm leading-relaxed">
          <span className="text-secondary">i am a </span>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[100px] h-auto p-1.5 glass-surface border-0 border-b-2 border-glass-border hover:border-cyan-400 focus:border-cyan-400 font-medium text-primary rounded-md transition-all duration-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-glass-border rounded-lg">
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="text-primary hover:bg-glass-surface focus:bg-glass-surface rounded-md lowercase text-sm">
                  {r.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-secondary"> who wants a demo for </span>

          <Select value={purpose} onValueChange={onPurposeChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[120px] h-auto p-1.5 glass-surface border-0 border-b-2 border-glass-border hover:border-cyan-400 focus:border-cyan-400 font-medium text-primary rounded-md transition-all duration-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-glass-border rounded-lg">
              {purposes.map((p) => (
                <SelectItem key={p} value={p} className="text-primary hover:bg-glass-surface focus:bg-glass-surface rounded-md lowercase text-sm">
                  {p.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-secondary">.</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-base font-semibold text-primary lowercase tracking-wide">
          04. music vibe
        </label>

        <div className="text-sm leading-relaxed">
          <span className="text-secondary">set the mood with </span>
          <Select value={musicVibe} onValueChange={onMusicVibeChange}>
            <SelectTrigger className="inline-flex w-auto min-w-[120px] h-auto p-1.5 glass-surface border-0 border-b-2 border-glass-border hover:border-cyan-400 focus:border-cyan-400 font-medium text-primary rounded-md transition-all duration-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated border-glass-border rounded-lg">
              {musicVibes.map((vibe) => (
                <SelectItem key={vibe} value={vibe} className="text-primary hover:bg-glass-surface focus:bg-glass-surface rounded-md lowercase text-sm">
                  {vibe.toLowerCase()}
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