import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/routes/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    extend: {
      colors: {
        spinner: '#007bff',
        primary: '#2196f3',
        secondary: '#f5f5f5',
      },
      fontFamily: {
        comic: ["Comic sans MS", 'sans-serif'],
        georgia: ['Georgia', 'serif'],
      },
      letterSpacing: {
        wider2: '0.125em',
      },
      boxShadow: {
        soft: '0 8px 8px rgba(0,0,0,0.2)'
      }
    },
  },
  plugins: [],
};

export default config;
