import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          500: '#1d6feb',
          600: '#1558c4',
          700: '#10449a',
          900: '#0a2554',
        },
      },
    },
  },
  plugins: [],
};

export default config;
