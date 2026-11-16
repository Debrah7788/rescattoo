import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export default async function prepareE2e() {
  const env = {
    ...process.env,
    DATABASE_URL: "file:./e2e-test.db",
    NODE_ENV: "test",
    JWT_SECRET: "rescatto-e2e-secret-with-at-least-32-characters",
    ADMIN_KEY: "rescatto-e2e-admin-key"
  };
  Object.assign(process.env, env);
  const databasePath = path.join(root, "prisma", "e2e-test.db");
  await rm(databasePath, { force: true });
  await rm(`${databasePath}-journal`, { force: true });

  const migration = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: root,
    env,
    stdio: "inherit"
  });
  if (migration.error) throw migration.error;
  if (migration.status !== 0) throw new Error("Falha ao preparar o banco isolado do E2E.");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.gato.create({
      data: {
        nome_gato: "Gato E2E",
        idade: "3 meses",
        sexo: "F",
        cor: "Cinza",
        porte: "Pequeno",
        status: "Disponível"
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}
