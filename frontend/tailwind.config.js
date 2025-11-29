/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}

