import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../shared'),
            '@convex': path.resolve(__dirname, '../convex'),
            // Explicitly resolve convex sub-paths to local node_modules
            'convex/server': path.resolve(__dirname, './node_modules/convex/server'),
            'convex/values': path.resolve(__dirname, './node_modules/convex/values'),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'convex-vendor': ['convex'],
                },
            },
        },
    },
});
