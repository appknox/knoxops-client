/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff523d',
          50: '#fff5f4',
          100: '#ffe8e6',
          200: '#ffd5d1',
          300: '#ffb5ad',
          400: '#ff8a7d',
          500: '#ff523d',
          600: '#ed3a2a',
          700: '#c82d20',
          800: '#a5291e',
          900: '#882820',
          950: '#4a100b',
        },
      },
    },
  },
  plugins: [],
}
