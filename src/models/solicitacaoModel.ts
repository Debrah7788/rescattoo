import prisma from "../prisma.js";
import type { SolicitacaoAdocaoBody } from "../schemas/adocaoSchemas.js";

export async function criarSolicitacaoAdocao(
  dados: SolicitacaoAdocaoBody & { id_user: number; id_cat: number }
) {
  return prisma.solicitacaoDeAdocao.create({
    data: {
      ...dados,
      status: "pendente",
      data_solicitacao: new Date()
    },
    select: {
      id_solicitacao: true,
      status: true,
      data_solicitacao: true,
      id_cat: true
    }
  });
}