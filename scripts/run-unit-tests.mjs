import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, [
  "--import",
  "tsx",
  "--test",
  "tests/unit/schemas.test.ts",
  "tests/unit/valueUtils.test.ts"
], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "test",
    JWT_SECRET: "rescatto-unit-test-secret-with-at-least-32-characters",
    ADMIN_KEY: "rescatto-unit-test-admin-key"
  },
  stdio: "inherit"
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
