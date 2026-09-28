import "dotenv/config";

import { defineConfig } from "prisma/config";

process.env.DATABASE_URL ||= "file:./rescatto.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  }
});