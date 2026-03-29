import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

/**
 * Tailwind v3：语义色映射到 hsl(var(--token))，与 shadcn/ui 习惯一致。
 * hero.*：Landing 专用霓虹/金属感（见 src/index.css）
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        hero: {
          heading: "hsl(var(--hero-heading))",
          sub: "hsl(var(--hero-sub))",
          muted: "hsl(var(--hero-muted))",
          accent: "hsl(var(--hero-accent))",
          silver: "hsl(var(--hero-silver))",
          gold: "hsl(var(--hero-gold))",
          navy: "hsl(var(--hero-navy))",
        },
        pearl: {
          white: "#FAFAFA",
          gray: "#F5F5F5",
        },
        "navy-blue": "#001F5B",
        "brushed-gold": "#C5A059",
        warning: "#B91C1C",
        /** Flash-Back Dashboard：深空蓝 / 深紫 / 霓虹青绿 / 警报红 */
        fb: {
          space: "#0f172a",
          violet: "#1e1b4b",
          cyan: "#22d3ee",
          green: "#10b981",
          red: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "flow-beam": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "alert-flash": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(239,68,68,0.65)" },
        },
        "reactor-glow": {
          "0%, 100%": { opacity: "0.5", filter: "blur(8px)" },
          "50%": { opacity: "1", filter: "blur(12px)" },
        },
        "dot-flow": {
          "0%": { transform: "translateX(0)", opacity: "0.2" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0.2" },
        },
        "order-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "risk-capture": {
          "0%": { opacity: "0.25" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 20s linear infinite",
        "pulse-ring": "pulse-ring 2.2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "flow-beam": "flow-beam 2s ease-in-out infinite",
        "alert-flash": "alert-flash 0.8s ease-in-out infinite",
        "reactor-glow": "reactor-glow 1s ease-in-out infinite",
        "dot-flow": "dot-flow 1.2s linear infinite",
        "order-shimmer": "order-shimmer 1.2s ease-out 1",
        "risk-capture-500ms": "risk-capture 500ms ease-out 1",
        "transmission-2500ms": "flow-beam 2500ms linear 1",
        "settlement-1500ms": "pulse-ring 1500ms ease-out 1",
      },
      backgroundImage: {
        "hero-btn":
          "linear-gradient(135deg, hsl(var(--hero-gold)) 0%, hsl(44 52% 76%) 35%, hsl(var(--hero-gold)) 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
