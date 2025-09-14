import { useState } from "react";
import { Palette, Minus } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [isFlowTheme, setIsFlowTheme] = useState(true);

  const toggleTheme = () => {
    const newTheme = !isFlowTheme;
    setIsFlowTheme(newTheme);

    const root = document.documentElement;

    if (newTheme) {
      // Apply flow theme (current default)
      root.classList.remove('theme-original');
      root.classList.add('theme-flow');
    } else {
      // Apply original theme
      root.classList.remove('theme-flow');
      root.classList.add('theme-original');
    }
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className="p-2 rounded-lg hover:bg-surface/50 transition-all duration-200"
      title={isFlowTheme ? "Switch to Original Theme" : "Switch to Flow Theme"}
    >
      {isFlowTheme ? (
        <Minus className="h-4 w-4 text-secondary hover:text-primary transition-colors" />
      ) : (
        <Palette className="h-4 w-4 text-secondary hover:text-primary transition-colors" />
      )}
    </Button>
  );
}