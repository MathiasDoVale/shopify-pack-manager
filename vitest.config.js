// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Important for React Testing Library
    setupFiles: ['app/tests/setup.jsx'], // <-- Point to your setup file
    clearMocks: true, // <-- Recommended: Automatically clears mocks between tests
    // css: true, // Enable if you import CSS files directly and need them processed/mocked
  },
  // If using alias like '~/' add it here for Vitest too
  // resolve: {
  //   alias: {
  //     '~': path.resolve(__dirname, './app'),
  //   },
  // },
});