import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];

  return {
    base: command === 'build' ? (repoName ? `/${repoName}/` : './') : '/',
    plugins: [react()],
  };
});
