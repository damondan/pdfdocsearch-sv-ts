import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [sveltekit()],
		css: {
			postcss: './postcss.config.js',
		},
		define: {
			'process.env.MONGODB_URI': JSON.stringify(env.MONGODB_URI),
			'process.env.MONGODB_DATABASE': JSON.stringify(env.MONGODB_DATABASE),
		}
	};
});
