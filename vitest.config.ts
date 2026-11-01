import { defineConfig } from 'vitest/config';

// Unit tests for the server-side logic (LLM orchestrator, providers, API routes) and a
// static check of the client code. Tests live in tests/, outside app/, so Expo Router
// never treats them as routes. No native modules are loaded and no network is used.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
  },
});
