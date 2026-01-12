/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gov-blue': '#3366CC',
        'gov-red': '#DA291C',
        'brand-dark': '#1e293b',
        'brand-light': '#f8fafc',
      }
    }
  },
  plugins: [],
}
