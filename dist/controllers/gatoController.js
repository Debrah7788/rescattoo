import * as model from "../models/gatoModel.js";
import { AppError } from "../middlewares/errorHandler.js";
// GET
export async function getGatos(req, res) {
    const gatos = await model.listarGatos(req.query);
    res.json(gatos);
}
// GET ID
export async function getGato(req, res) {
    const gato = await model.buscarGato(req.params.id);
    if (!gato) {
        throw new AppError(404, "Gato não encontrado");
    }
    res.json(gato);
}
// POST
export async function postGato(req, res) {
    const gato = await model.criarGato(req.body);
    res.status(201).json({ mensagem: "Gato criado", id_gato: gato.id_gato, gato });
}
// PUT
export async function putGato(req, res) {
    const gato = await model.buscarGato(req.params.id);
    if (!gato) {
        throw new AppError(404, "Gato não encontrado");
    }
    await model.atualizarGato(req.params.id, req.body);
    res.json({ mensagem: "Gato atualizado" });
}
// DELETE
export async function deleteGato(req, res) {
    const gato = await model.buscarGato(req.params.id);
    if (!gato) {
        throw new AppError(404, "Gato não encontrado");
    }
    await model.deletarGato(req.params.id);
    res.status(204).send();
}
