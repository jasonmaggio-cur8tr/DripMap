/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './**/*.{js,ts,jsx,tsx}',
    '!./node_modules/**',
    '!./dist/**',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          900: '#231b15', // Dark Roast
          800: '#3c2f26',
          700: '#5c4a3a',
          600: '#7a6355',
          200: '#c8b8a8',
          100: '#f3efe0', // Latte foam
          50:  '#faf9f6', // Cream
        },
        volt: {
          400: '#ccff00', // Volt Green/Yellow
          500: '#b3e600',
          600: '#99cc00',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans:  ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};
