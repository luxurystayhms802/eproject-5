import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [tailwindcss(), react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'data-vendor': ['@tanstack/react-query', '@tanstack/react-table', 'axios', 'zustand'],
                    'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'charts-vendor': ['recharts'],
                    'ui-vendor': ['lucide-react', 'sonner', 'date-fns'],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
