import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
      colors: {
        background: "var(--bg-app)",
        foreground: "var(--text-main)",
        muted: {
          DEFAULT: "var(--bg-bg2)",
          foreground: "var(--text-soft)",
        },
        border: "var(--border-app)",
        "bg-app": "var(--bg-app)",
        "bg-bg": "var(--bg-bg)",
        "bg-bg2": "var(--bg-bg2)",
        "bg-card": "var(--bg-card)",
        "border-app": "var(--border-app)",
        "border-app-soft": "var(--border-app-soft)",
        "text-main": "var(--text-main)",
        "text-soft": "var(--text-soft)",
        "text-faint": "var(--text-faint)",
        accent: "var(--accent)",
        "accent-aqua": "var(--accent-aqua)",
        "accent-purple": "var(--accent-purple)",
        "kpi-excellent": "var(--kpi-excellent)",
        "kpi-good": "var(--kpi-good)",
        "kpi-warning": "var(--kpi-warning)",
        "kpi-critical": "var(--kpi-critical)",
        "kpi-private": "var(--kpi-private)",
        "table-hover": "var(--table-hover)",
        "card-shadow": "var(--card-shadow)",
        "map-bg": "var(--map-bg)",
        "map-popup-bg": "var(--map-popup-bg)",
        "map-cluster-bg": "var(--map-cluster-bg)",
      },
    },
  },
  plugins: [],
};
export default config;
