/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6c63ff',
          hover: '#5a54d1',
        },
        background: '#f9f9fc',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  safelist: [
    "text-teal-500",
    "border-teal-500",
    "bg-teal-500",
    "bg-teal-500-dark",
    "bg-teal-500/5",

    "text-red-600",
    "border-red-600",
    "bg-red-600",
    "bg-red-600-dark",
    "bg-red-600/5",

    "text-green-600",
    "border-green-600",
    "bg-green-600",
    "bg-green-600-dark",
    "bg-green-600/5",
  ],
  plugins: [],
}