import { defineConfig, devices } from '@playwright/test';
export default defineConfig({testDir:'tests/browser',fullyParallel:true,workers:2,timeout:30000,outputDir:'.cache/browser-results',reporter:'list',
  use:{baseURL:'http://127.0.0.1:4322/helvetic-economic-indicators/',trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:900}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:[
    {command:'node --import tsx scripts/serve-test-site.ts .cache/atlas-preview/dist 4322',url:'http://127.0.0.1:4322/helvetic-economic-indicators/',reuseExistingServer:!process.env.CI},
    {command:'node --import tsx scripts/serve-test-site.ts dist 4323',url:'http://127.0.0.1:4323/helvetic-economic-indicators/',reuseExistingServer:!process.env.CI}
  ]
});
