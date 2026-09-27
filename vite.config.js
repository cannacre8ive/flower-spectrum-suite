import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({plugins:[react()],build:{rollupOptions:{input:{main:resolve(import.meta.dirname,'index.html'),social:resolve(import.meta.dirname,'social.html')}}}});
