import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/front/**/*.test.js"],
        coverage: {
            provider: "v8",
            include: ["public/api-client.js"],
            reporter: ["text", "html"],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 80,
                statements: 90
            }
        }
    }
});
