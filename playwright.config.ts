import { defineConfig, devices } from '@playwright/test';

// Este archivo corre en Node, pero queda fuera del tsconfig (solo incluye src/):
// declaramos lo único que usamos de Node en vez de agregar @types/node.
declare const process: { env: Record<string, string | undefined> };

// Tests end-to-end: abren el build de producción (base /trick-r-treat/) en WebKit,
// el motor de Safari, emulando un iPhone. Detalle: docs/planes/T-003-pantalla-base.md
const URL = 'http://localhost:5193/trick-r-treat/';

export default defineConfig({
  testDir: 'e2e',
  // *.e2e.ts y no *.spec.ts: Vitest toma por defecto los *.spec.ts y los correría.
  testMatch: '**/*.e2e.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: URL,
  },
  projects: [
    {
      name: 'iphone',
      use: { ...devices['iPhone 17 landscape'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 5193 --strictPort',
    url: URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
