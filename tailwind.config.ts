import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'spinner': 'var(--color-spinner)',
      },
      fontFamily: {
        'comic': 'var(--font-family-comic)',
        'georgia': 'var(--font-family-georgia)',
      },
      letterSpacing: {
        'wider2': 'var(--letter-spacing-wider2)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
      },
      keyframes: {
				spin: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				}
			},
			animation: {
				spin: 'spin 1s linear infinite'
			}
    },
  },
  plugins: [],
};

export default config;
