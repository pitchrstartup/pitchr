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
        background: "#F9FAFB",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        "text-primary": "#1A1A1A",
        "text-secondary": "#6B7280",
        back: "#22C55E",
        "back-strong": "#16A34A",
        pass: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Inter", "DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        button: "8px",
        logo: "10px",
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
