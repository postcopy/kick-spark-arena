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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        game: {
          red: "hsl(var(--game-red))",
          "red-glow": "hsl(var(--game-red-glow))",
          blue: "hsl(var(--game-blue))",
          "blue-glow": "hsl(var(--game-blue-glow))",
          yellow: "hsl(var(--game-yellow))",
          "yellow-glow": "hsl(var(--game-yellow-glow))",
          gold: "hsl(var(--game-gold))",
          "gold-dark": "hsl(var(--game-gold-dark))",
          surface: "hsl(var(--game-surface))",
          "surface-elevated": "hsl(var(--game-surface-elevated))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["'Orbitron'", "monospace"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "trophy-bounce": {
          "0%": { transform: "translateY(-100px) scale(0)", opacity: "0" },
          "50%": { transform: "translateY(20px) scale(1.1)", opacity: "1" },
          "70%": { transform: "translateY(-10px) scale(0.95)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "trophy-pulse": {
          "0%, 100%": { filter: "drop-shadow(0 0 20px currentColor)" },
          "50%": { filter: "drop-shadow(0 0 50px currentColor)" },
        },
        "winner-text": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "score-slide-left": {
          "0%": { transform: "translateX(-100px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "score-slide-right": {
          "0%": { transform: "translateX(100px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        "buttons-fade": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "trophy-bounce": "trophy-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "trophy-pulse": "trophy-pulse 2s ease-in-out infinite",
        "winner-text": "winner-text 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "score-slide-left": "score-slide-left 0.6s ease-out forwards",
        "score-slide-right": "score-slide-right 0.6s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "buttons-fade": "buttons-fade 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
