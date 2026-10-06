import { z } from "zod";
import { ADMIN_KEY, validarChaveAdmin } from "../config.js";

const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .max(254, "O e-mail deve ter no máximo 254 caracteres.")
  .regex(/^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/i, "Informe um e-mail Gmail válido.");

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "A senha deve conter maiúscula, minúscula e número.");

export const registerSchema = z.object({
  headers: z.object({
    "x-admin-key": z.string().optional()
  }).passthrough(),
  body: z.object({
    nome: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres.").max(100),
    endereco: z.string().trim().max(200).optional().default(""),
    contato: emailSchema,
    senha: passwordSchema,
    perfil: z.enum(["usuario", "admin"]).optional().default("usuario")
  }).strict()
}).superRefine((dados, contexto) => {
  if (dados.body.perfil === "admin" && (!ADMIN_KEY || !validarChaveAdmin(dados.headers["x-admin-key"]))) {
    contexto.addIssue({
      code: "custom",
      path: ["headers", "x-admin-key"],
      message: "Chave administrativa inválida ou não configurada."
    });
  }
});

export const loginSchema = z.object({
  body: z.object({
    contato: emailSchema,
    senha: passwordSchema,
    perfil: z.enum(["usuario", "admin"]).optional()
  }).strict()
});

export const authHeadersSchema = z.object({
  headers: z.object({
    authorization: z.string()
      .regex(/^Bearer\s+\S+$/, "Use o formato Bearer <token>.")
      .optional()
  }).passthrough()
});
