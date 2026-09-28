import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { AppError } from "../middlewares/errorHandler.js";
import * as gatos from "../models/gatoModel.js";
import * as solicitacoes from "../models/solicitacaoModel.js";
import type { SolicitacaoAdocaoBody } from "../schemas/adocaoSchemas.js";

export async function criarSolicitacaoAdocao(req: AuthRequest, res: Response) {
  if (!req.usuario) {
    throw new AppError(401, "Token de autenticação não informado.");
  }

  const idGato = Number(req.params.id);
  const gato = await gatos.buscarGato(idGato);
  if (!gato) {
    throw new AppError(404, "Gato não encontrado.");
  }

  const solicitacao = await solicitacoes.criarSolicitacaoAdocao({
    ...(req.body as SolicitacaoAdocaoBody),
    id_user: req.usuario.id_usuario,
    id_cat: idGato
  });

  return res.status(201).json({
    mensagem: "Solicitação de adoção registrada.",
    solicitacao
  });
}