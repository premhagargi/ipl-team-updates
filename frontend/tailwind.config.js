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
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Inter', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.025em',
        normal: '-0.02em',
      },
      colors: {
        cricket: {
          blue: '#1d4ed8',
          red: '#dc2626',
          green: '#16a34a',
          yellow: '#ca8a04',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
