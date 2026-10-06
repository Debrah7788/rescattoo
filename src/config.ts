import dotenv from "dotenv";
import path from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

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

const configuredAdminKey = process.env.ADMIN_KEY?.trim();
const adminKeyIsPlaceholder = configuredAdminKey === "troque-por-uma-chave-administrativa";

if (NODE_ENV === "production" && (!configuredAdminKey || adminKeyIsPlaceholder || configuredAdminKey.length < 16)) {
  throw new Error("Configure ADMIN_KEY com pelo menos 16 caracteres em produção.");
}

export const ADMIN_KEY = configuredAdminKey && !adminKeyIsPlaceholder
  ? configuredAdminKey
  : randomBytes(32).toString("hex");

export function hashValor(valor: string) {
  return createHash("sha256").update(valor.trim()).digest("hex");
}

export function validarChaveAdmin(chaveInformada?: string) {
  const chaveDigitada = chaveInformada?.trim();
  const chaveConfigurada = ADMIN_KEY.trim();

  if (!chaveDigitada || !chaveConfigurada) {
    return false;
  }

  if (chaveConfigurada === chaveDigitada) {
    return true;
  }

  const chaveDigitadaHash = hashValor(chaveDigitada);
  const chaveConfiguradaEhHash = /^[a-f0-9]{64}$/i.test(chaveConfigurada);

  if (!chaveConfiguradaEhHash) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(chaveDigitadaHash, "hex"),
      Buffer.from(chaveConfigurada, "hex")
    );
  } catch {
    return false;
  }
}

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

if (!configuredJwtSecret || jwtSecretIsPlaceholder) {
  console.warn("JWT_SECRET não definido; foi gerada uma chave temporária para este processo.");
}

if (!configuredAdminKey || adminKeyIsPlaceholder) {
  console.warn("ADMIN_KEY não definida; foi gerada uma chave temporária para este processo.");
}