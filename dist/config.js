import dotenv from "dotenv";
import path from "node:path";
import { randomBytes } from "node:crypto";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "env.env") });
process.env.DATABASE_URL ||= "file:./rescatto.db";
export const NODE_ENV = process.env.NODE_ENV || "development";
const configuredJwtSecret = process.env.JWT_SECRET?.trim();
const jwtSecretIsPlaceholder = configuredJwtSecret === "troque-por-uma-chave-longa-e-aleatoria";
if (NODE_ENV === "production" && (!configuredJwtSecret || jwtSecretIsPlaceholder || configuredJwtSecret.length < 32)) {
    throw new Error("Configure um JWT_SECRET de pelo menos 32 caracteres em produção.");
}
export const JWT_SECRET = configuredJwtSecret && !jwtSecretIsPlaceholder
    ? configuredJwtSecret
    : randomBytes(32).toString("hex");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const SMTP_FROM = process.env.SMTP_FROM || "";
export const ADMIN_KEY = process.env.ADMIN_KEY || "";
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
if (!configuredJwtSecret || jwtSecretIsPlaceholder) {
    console.warn("JWT_SECRET não definido; foi gerada uma chave temporária para este processo.");
}
