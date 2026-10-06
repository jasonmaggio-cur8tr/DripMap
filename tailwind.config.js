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
          // Anchored to iOS BRAND.volt in dripmap-ios/constants/Colors.ts.
          // Ramp follows Tailwind's lime scale, of which #a3e635 is lime-400.
          50:  '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635', // Volt
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
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
