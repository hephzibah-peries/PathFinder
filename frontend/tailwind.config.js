/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14181F',
        'ink-soft': '#454C58',
        paper: '#F6F4EF',
        'paper-raised': '#FFFFFF',
        sand: '#EFE9DD',
        'sand-line': '#DED6C4',
        signal: '#2F6F4F',
        'signal-soft': '#E4EDE6',
        amber: '#B7791F',
        'amber-soft': '#F5EBDA',
        error: '#B23A3A',
        'error-soft': '#F5E3E1',
        info: '#2E5AAC',
        'info-soft': '#E4EAF5',
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        s: '8px',
        m: '14px',
        l: '22px',
      },
    },
  },
  plugins: [],
};
