import { unlink } from "node:fs/promises";
import path from "node:path";
import prisma from "../prisma.js";
import { UPLOADS_DIR } from "../middlewares/uploadMiddleware.js";
import { AppError } from "../middlewares/errorHandler.js";
function obterIdUsuario(req) {
    const idUsuario = req.usuario?.id_usuario;
    if (!idUsuario) {
        throw new AppError(401, "Token de autenticação inválido.");
    }
    return idUsuario;
}
async function removerArquivo(caminhoPublico) {
    const nomeArquivo = path.basename(caminhoPublico);
    try {
        await unlink(path.join(UPLOADS_DIR, nomeArquivo));
    }
    catch (erro) {
        if (erro.code !== "ENOENT") {
            console.error("Falha ao remover imagem substituída:", erro);
        }
    }
}
export async function obterImagemUsuario(req, res) {
    const imagem = await prisma.imagem.findUnique({
        where: { id_user: obterIdUsuario(req) },
        select: { caminho: true }
    });
    return res.status(200).json({ imagem });
}
export async function salvarImagemUsuario(req, res) {
    const idUsuario = obterIdUsuario(req);
    const arquivo = req.file;
    if (!arquivo) {
        throw new AppError(400, "Envie um arquivo no campo 'imagem'.");
    }
    const caminho = `/uploads/${arquivo.filename}`;
    const imagemAnterior = await prisma.imagem.findUnique({
        where: { id_user: idUsuario },
        select: { caminho: true }
    });
    let imagem;
    try {
        imagem = await prisma.imagem.upsert({
            where: { id_user: idUsuario },
            create: { caminho, id_user: idUsuario },
            update: { caminho, data_upload: new Date() },
            select: { id_imagem: true, caminho: true, data_upload: true }
        });
    }
    catch (erro) {
        await removerArquivo(caminho);
        throw erro;
    }
    if (imagemAnterior && imagemAnterior.caminho !== caminho) {
        await removerArquivo(imagemAnterior.caminho);
    }
    return res.status(201).json({
        mensagem: "Imagem enviada com sucesso.",
        imagem
    });
}
