/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.025em',
        normal: '-0.015em',
      },
      colors: {
        ipl: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#2563eb',
          accent: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
