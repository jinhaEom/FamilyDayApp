/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors :{
        BLACK: '#242424',
        GRAY: '#808080',
        LIGHT_GRAY: '#e3e3e3',
        WHITE: '#FFFFFF',
        DARK_GRAY: '#404040',
        BLUE: '#0000FF',
        PRIMARY: '#54597c',
        PRIMARY_LIGHT: '#7a7ea8',
        PRIMARY_SUB: '#445B64',
        PRIMARY_TEXT: '#F4F5FB',
        GRAY_TITLE: '#555',
        GRAY_CONTENT: '#666',
        ERROR: '#FF0000',
        SECONDARY: '#8C9EFF',
      }
    },
  },
  plugins: [],
}