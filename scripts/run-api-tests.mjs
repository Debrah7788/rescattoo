import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = "file:./api-test.db";
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  NODE_ENV: "test",
  JWT_SECRET: "rescatto-test-secret-with-at-least-32-characters",
  ADMIN_KEY: "rescatto-test-admin-key"
};
const databasePath = path.join(root, "prisma", "api-test.db");
await rm(databasePath, { force: true });
await rm(`${databasePath}-journal`, { force: true });

const testFiles = process.argv.includes("--coverage")
  ? [
    "tests/unit/schemas.test.ts",
    "tests/unit/valueUtils.test.ts",
    "tests/api/routes.test.ts"
  ]
  : ["tests/api/routes.test.ts"];

try {
  for (const [executable, args] of [
    ["npx", ["prisma", "migrate", "deploy"]],
    [process.execPath, ["--import", "tsx", "--test", ...testFiles]]
  ]) {
    const result = spawnSync(executable, args, {
      cwd: root,
      env,
      stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
} finally {
  await rm(databasePath, { force: true });
  await rm(`${databasePath}-journal`, { force: true });
}
