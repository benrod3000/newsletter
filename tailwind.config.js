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
          'yellow-dark': '#d4c82e',
          green: '#2f7f5f',
          'green-light': '#4a9e7a',
          'green-neon': '#00e060',
          red: '#e03131',
          'red-light': '#f04a4a',
          muted: '#a8a49a',
          surface: '#e8e8e0',
          'surface-dark': '#d4d0c8',
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
      boxShadow: {
        brutal: '4px 4px 0px #0a0a0a',
      },
    },
  },
  plugins: [],
}