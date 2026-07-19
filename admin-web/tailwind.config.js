/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: '#0a0a0a', light: '#0c0c0c', surface: '#121212', border: 'rgba(255,255,255,0.1)' },
        lime: { DEFAULT: '#ccff00', dark: '#a0cc00', glow: 'rgba(204,255,0,0.3)' },
        emerald: '#10b981',
        glass: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)' },
        text: { primary: '#ebebeb', secondary: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.3)' },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: { 'shell': '2.5rem', 'card': '1.5rem', 'pill': '9999px' },
      backdropBlur: { glass: '16px' },
      boxShadow: { lime: '0 0 30px rgba(204,255,0,0.3)' },
      animation: { float: 'float 6s ease-in-out infinite', 'pulse-lime': 'pulse-lime 2s infinite' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-lime': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}