import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default async function cleanupE2e() {
  const databasePath = path.join(root, "prisma", "e2e-test.db");
  await rm(databasePath, { force: true });
  await rm(`${databasePath}-journal`, { force: true });
}
