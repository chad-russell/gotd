/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "index.html",
    "./src/**/*.{html,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        wiggle: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-13deg)' },
          '75%': { transform: 'rotate(13deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.3s ease-in-out',
      }
    },
  },
  plugins: [],
}

