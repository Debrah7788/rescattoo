import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    retries: 0,
    use: {
        baseURL: "http://127.0.0.1:3100",
        browserName: "chromium",
        headless: true
    },
    globalSetup: "./scripts/prepare-e2e.mjs",
    globalTeardown: "./scripts/cleanup-e2e.mjs",
    webServer: {
        command: "npm run e2e:serve",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: false,
        timeout: 30_000,
        env: {
            PORT: "3100",
            DATABASE_URL: "file:./e2e-test.db",
            NODE_ENV: "test",
            JWT_SECRET: "rescatto-e2e-secret-with-at-least-32-characters",
            ADMIN_KEY: "rescatto-e2e-admin-key"
        }
    }
});
