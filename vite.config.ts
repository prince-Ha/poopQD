import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // 상대 경로로 빌드해서 GitHub Pages 같은 하위 경로에서도 동작하게 함
  base: './',
  plugins: [react(), tailwindcss()],
  // `npm run build:artifact`: 그림까지 전부 코드 안에 넣어서 HTML 한 장으로 묶기 위한 설정
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', assetsInlineLimit: () => true, cssCodeSplit: false }
      : undefined,
}));
