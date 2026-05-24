/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#F5C842',
        },
        whatsapp: '#25D366',
        surface: {
          DEFAULT: '#FFFFFF',
          subdued: '#F1F5F9',
        }
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
