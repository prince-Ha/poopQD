import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해서 GitHub Pages 같은 하위 경로에서도 동작하게 함
  base: './',
  plugins: [react(), tailwindcss()],
});
