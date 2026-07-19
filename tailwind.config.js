/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lime: { DEFAULT: '#ccff00', dark: '#a0cc00', glow: 'rgba(204,255,0,0.3)' },
        emerald: '#10b981',
        glass: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)' },
        primary: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' },
        accent: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
        surface: { DEFAULT: '#0f1117', 50: '#1a1d27', 100: '#232734', 200: '#2d3242', 300: '#3b4154' },
        obsidian: { DEFAULT: '#0a0a0a', light: '#0c0c0c' },
        text: { primary: '#ebebeb', secondary: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.3)' },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: { shell: '2.5rem', card: '1.5rem', pill: '9999px' },
      backdropBlur: { glass: '16px' },
      boxShadow: { lime: '0 0 30px rgba(204,255,0,0.3)' },
      animation: { float: 'float 6s ease-in-out infinite' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}