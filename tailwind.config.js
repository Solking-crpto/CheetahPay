/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          page: '#0B0D10',
          surface: '#12151A',
          subtle: '#191D23',
          border: '#2A3038',
          text: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#737B87',
          accent: '#D6A23D',
          accentHover: '#C29132',
        },
      },
    },
  },
  plugins: [],
}

