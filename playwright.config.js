const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/playwright',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
