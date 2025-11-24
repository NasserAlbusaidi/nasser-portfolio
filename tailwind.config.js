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
    },
  },
  plugins: [],
}