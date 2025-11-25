/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-orange': '#FF5F00',
        'neon-green': '#00FF41',
        'cyber-yellow': '#FFD300',
      },
      keyframes: {
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-from-right': 'slide-in-from-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [],
}