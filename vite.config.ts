import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        // '/entities', '/pages' 등만 매칭 (시스템 절대경로 /Users/... 제외)
        find: /^\/(entities|pages|shared|assets|App\.css|main\.tsx|App)(\/|$)/,
        replacement: path.resolve(__dirname, 'src') + '/$1$2',
      },
    ],
  },
});
