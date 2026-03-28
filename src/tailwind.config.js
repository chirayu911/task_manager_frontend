/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'selector', // ⭐ Modern Tailwind dark mode configuration
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#450a0a',
          300: '#450a0a',
          400: '#f87171',
          500: '#ef4444', // Main base red
          600: '#dc2626', // High-contrast primary action
          700: '#b91c1c', 
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a', // Ultra-dark background tint
        }
      }
    },
  },
  plugins: [],
}