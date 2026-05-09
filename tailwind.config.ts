import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
        sans: ["JetBrains Mono", "ui-monospace", "monospace"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        pixel: ["Pixelify Sans", "Press Start 2P", "monospace"],
        lcd: ["VT323", "JetBrains Mono", "monospace"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: {
          DEFAULT: "var(--background)",
          deep: "var(--background-deep)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
          dim: "var(--foreground-dim)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          line: "var(--surface-line)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          ink: "var(--primary-ink)",
          "opacity-hover": "var(--primary-opacity-hover)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          pink: "var(--accent-pink)",
          "pink-soft": "var(--accent-pink-soft)",
          purple: "var(--accent-purple)",
          "purple-soft": "var(--accent-purple-soft)",
          peach: "var(--accent-peach)",
          "peach-soft": "var(--accent-peach-soft)",
          red: "var(--accent-red)",
          "red-soft": "var(--accent-red-soft)",
        },
        ok: {
          DEFAULT: "var(--ok)",
          soft: "var(--ok-soft)",
          glow: "var(--ok-glow)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        menu: {
          DEFAULT: "var(--menu-background)",
          foreground: "var(--menu-foreground)",
        },
        coin: {
          lime: "var(--coin-lime)",
          pink: "var(--coin-pink)",
          purple: "var(--coin-purple)",
          peach: "var(--coin-peach)",
          blue: "var(--coin-blue)",
          cyan: "var(--coin-cyan)",
          yellow: "var(--coin-yellow)",
          gray: "var(--coin-gray)",
          red: "var(--coin-red)",
          green: "var(--coin-green)",
        },
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
        "pulse-subtle": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.85",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
