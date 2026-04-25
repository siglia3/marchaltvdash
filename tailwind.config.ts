import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f7fb",
        panel: "#ffffff",
        sidebar: "#ffffff",
        muted: "#6b7280",
        stroke: "#e5eaf3",
        primary: "#1A68FF",
        success: "#61D975",
        warning: "#FFC603",
        danger: "#FF2D45"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        panel: "16px",
        pill: "999px"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
