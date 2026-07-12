/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          bg: '#f5f5f0',
          fg: '#0a0a0a',
          yellow: '#f5e642',
          green: '#2f7f5f',
          'green-neon': '#00e060',
          muted: '#a8a49a',
          surface: '#e8e8e0',
          border: '#0a0a0a',
        },
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'Impact', '"Arial Black"', 'sans-serif'],
        sans: ['Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderWidth: {
        brutal: '3px',
      },
    },
  },
  plugins: [],
}