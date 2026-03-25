import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#13131a",
        "surface-2": "#1c1c27",
        border: "#2a2a38",
        "text-primary": "#f0f0f8",
        "text-secondary": "#8888aa",
        accent: "#6366f1",
        "swipe-right": "#22c55e",
        "swipe-left": "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 4px 32px rgba(0,0,0,0.5)",
        glow: "0 0 24px rgba(99,102,241,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
