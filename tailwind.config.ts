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
        background: "#0d0f14",
        panel: "#161a23",
        sidebar: "#111318",
        muted: "#8b92a5",
        stroke: "#1e2333",
        primary: "#3b82f6",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(3, 8, 20, 0.28)"
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
