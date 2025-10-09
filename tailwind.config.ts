import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/data/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lagoon: '#00B6D6',
        mango: '#FF8A34',
        sun: '#FFD85E',
        ink: '#0F172A',
        cream: '#FFF7ED',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
      boxShadow: {
        float: '0 24px 48px -20px rgba(15, 23, 42, 0.25)',
        inner: 'inset 0 6px 24px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
