import { Request, Response } from "express";
import * as model from "../models/gatoModel.js";
import { AppError } from "../middlewares/errorHandler.js";

type GatoQuery = { status?: string; pagina: number; limite: number };

// GET
export async function getGatos(
  req: Request,
  res: Response
) {
  const gatos = await model.listarGatos(req.query as unknown as GatoQuery);
  res.json(gatos);
}

// GET ID
export async function getGato(
  req: Request<{ id: string }>,
  res: Response
) {
  const gato = await model.buscarGato(req.params.id);
  if (!gato) {
    throw new AppError(404, "Gato não encontrado");
  }
  res.json(gato);
}

// POST
export async function postGato(
  req: Request,
  res: Response
) {
  const gato = await model.criarGato(req.body);
  res.status(201).json({ mensagem: "Gato criado", id_gato: gato.id_gato, gato });
}

// PUT
export async function putGato(
  req: Request<{ id: string }>,
  res: Response
) {
  const gato = await model.buscarGato(req.params.id);
  if (!gato) {
    throw new AppError(404, "Gato não encontrado");
  }
  await model.atualizarGato(req.params.id, req.body);
  res.json({ mensagem: "Gato atualizado" });
}

// DELETE
export async function deleteGato(
  req: Request<{ id: string }>,
  res: Response
) {
  const gato = await model.buscarGato(req.params.id);
  if (!gato) {
    throw new AppError(404, "Gato não encontrado");
  }
  await model.deletarGato(req.params.id);
  res.status(204).send();
}