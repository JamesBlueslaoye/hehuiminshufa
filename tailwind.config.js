/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.css',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        text: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        'apple-black': '#000000',
        'apple-near-black': '#1d1d1f',
        'apple-light-gray': '#f5f5f7',
        'apple-blue': '#0071e3',
        'apple-link-blue': '#0066cc',
        'apple-bright-blue': '#2997ff',
        'apple-dark-surface': '#272729',
      },
      borderRadius: {
        pill: '980px',
      },
    },
  },
  plugins: [],
}
