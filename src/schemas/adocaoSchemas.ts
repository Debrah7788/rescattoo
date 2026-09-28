import { z } from "zod";
import { gatoParamsSchema } from "./gatoSchemas.js";

const solicitacaoBodySchema = z.object({
  telefone: z.string().trim().min(8, "Informe um telefone válido.").max(20)
    .regex(/^[+()\d\s.-]+$/, "Informe um telefone válido.")
    .refine(telefone => telefone.replace(/\D/g, "").length >= 8, "Informe ao menos 8 dígitos."),
  cidade: z.string().trim().min(2, "Informe sua cidade ou bairro.").max(120),
  tipo_moradia: z.enum(["casa", "apartamento"]),
  tela_protecao: z.boolean(),
  outros_animais: z.boolean(),
  justificativa: z.string().trim().min(20, "Explique sua intenção em pelo menos 20 caracteres.").max(1000),
  termo_aceito: z.boolean().refine(aceito => aceito, "É necessário aceitar o termo de adoção.")
}).strict();

export const solicitacaoAdocaoSchema = gatoParamsSchema.merge(
  z.object({ body: solicitacaoBodySchema })
);

export type SolicitacaoAdocaoBody = z.infer<typeof solicitacaoBodySchema>;