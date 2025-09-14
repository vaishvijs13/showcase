import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        surface: "hsl(var(--surface))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        "glass-card": "hsl(var(--glass-card))",
        "glass-border": "hsl(var(--glass-border))",
        
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        
        primary: "hsl(var(--text-primary))",
        secondary: "hsl(var(--text-secondary))",
        muted: "hsl(var(--text-muted))",
        disabled: "hsl(var(--text-disabled))",
        
        interactive: "hsl(var(--interactive))",
        "interactive-hover": "hsl(var(--interactive-hover))",
        
        "status-success": "hsl(var(--status-success))",
        "status-error": "hsl(var(--status-error))",
        "status-warning": "hsl(var(--status-warning))",
        
        "pipeline-pending": "hsl(var(--pipeline-pending))",
        "pipeline-active": "hsl(var(--pipeline-active))",
        "pipeline-complete": "hsl(var(--pipeline-complete))",
        "pipeline-error": "hsl(var(--pipeline-error))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
