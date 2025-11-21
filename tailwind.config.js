/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ghoul-black': '#18181b',
        'ghoul-dark': '#27272a',
        'ghoul-red': '#ff0000',
        'ghoul-crimson': '#8a0000',
        'ghoul-gray': '#3f3f46',
        'ccg-white': '#e5e5e5',
        'ccg-light': '#f5f5f5',
        'ccg-gray': '#d4d4d4',
        'ghoul-cyan': '#00ffff',
      },
      fontFamily: {
        'serif': ['"Cinzel"', 'serif'],
        'ghoul': ['"Shippori Mincho B1"', 'serif'],
        'tech': ['"Rajdhani"', 'sans-serif'],
        'horror': ['"Nosifer"', 'cursive'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
        'grid-pattern-light': "linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)",
      },
      animation: {
        'pulse-fast': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glitch-grid': 'glitch-grid 2.5s infinite linear alternate',
        'glitch-rgb': 'glitch-rgb 3s infinite linear alternate-reverse',
        'drip': 'drip 4s infinite ease-in-out',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'scan-line': 'scan-line 1.5s linear infinite',
        'input-jitter': 'input-jitter 0.2s infinite',
        'noise': 'noise 0.5s steps(5) infinite',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'scan-line': {
          '0%': { left: '0%', transform: 'translateX(-100%)' },
          '100%': { left: '100%', transform: 'translateX(0%)' },
        },
        'glitch-grid': {
          '0%': { clipPath: 'inset(10% 0 60% 0)', transform: 'translate(-2px, 2px)' },
          '20%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(2px, -2px)' },
          '40%': { clipPath: 'inset(40% 0 30% 0)', transform: 'translate(-2px, 2px)' },
          '60%': { clipPath: 'inset(10% 0 80% 0)', transform: 'translate(2px, -2px)' },
          '80%': { clipPath: 'inset(60% 0 20% 0)', transform: 'translate(-2px, 2px)' },
          '100%': { clipPath: 'inset(30% 0 50% 0)', transform: 'translate(2px, -2px)' },
        },
        'glitch-rgb': {
          '0%': { textShadow: '2px 2px #ff0000, -2px -2px #00ffff' },
          '25%': { textShadow: '-2px 2px #ff0000, 2px -2px #00ffff' },
          '50%': { textShadow: '2px -2px #ff0000, -2px 2px #00ffff' },
          '75%': { textShadow: '-2px -2px #ff0000, 2px 2px #00ffff' },
          '100%': { textShadow: '2px 2px #ff0000, -2px -2px #00ffff' },
        },
        drip: {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px #ff0000)' },
          '50%': { filter: 'drop-shadow(0 4px 8px #ff0000)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'input-jitter': {
          '0%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(1px, 0)' },
          '50%': { transform: 'translate(-1px, 1px)' },
          '75%': { transform: 'translate(0, -1px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'noise': {
          '0%': { opacity: '1' },
          '20%': { opacity: '0.8' },
          '40%': { opacity: '0.9' },
          '60%': { opacity: '0.8' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0.9' },
        }
      }
    }
  },
  plugins: [],
}

