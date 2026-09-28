import prisma from "../prisma.js";
export async function criarSolicitacaoAdocao(dados) {
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
