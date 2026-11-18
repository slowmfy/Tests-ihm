import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 1, // un seul navigateur à la fois pour suivre les tests à l'écran
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: false, // affiche la page web pendant les tests
    launchOptions: { slowMo: 500 }, // pause de 500 ms entre chaque action
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
