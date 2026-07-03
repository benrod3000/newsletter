/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        surfaceAlt: '#161616',
        border: '#2a2a2a',
        text: '#f5f5f5',
        muted: '#9a9a9a',
        danger: '#ff3b3b',
      },
      borderRadius: {
        none: '0px',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
}