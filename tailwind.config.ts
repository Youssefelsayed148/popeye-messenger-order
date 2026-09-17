import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sauce: {
          DEFAULT: "#DC1F26",
          dark: "#B01218",
          light: "#E4574E",
        },
        mustard: {
          DEFAULT: "#F4B942",
          dark: "#B87F26",
        },
        ink: "#0F0F0F",
        "ink-soft": "#2A2A2A",
        paper: "#FAF6EE",
        cream: "#FFF8F0",
        muted: "#6B6056",
        rule: "#1A1A1A",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-cairo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;