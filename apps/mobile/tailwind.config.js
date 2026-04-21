/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: '#16161D',
        border: '#24242E',
        text: '#F4F4F5',
        muted: '#8E8E99',
        accent: '#00D26A',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
