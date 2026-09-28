import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config.js";
import { sendWelcomeEmail } from "../services/sendMail.js";
import { AppError } from "../middlewares/errorHandler.js";

// ======================================
// CADASTRO
// ======================================

export async function cadastrarUsuario(
  req: Request,
  res: Response
) {
  const { nome, endereco, contato, senha, perfil } = req.body;

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: { nome, endereco, contato, senha: senhaHash, perfil }
  });

  res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso!",
    usuario: {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      contato: usuario.contato,
      perfil: usuario.perfil
    }
  });
  void sendWelcomeEmail(usuario.contato, usuario.nome)
    .catch(erro => console.error("Falha ao enviar e-mail de boas-vindas:", erro));
}

// ======================================
// LOGIN
// ======================================

export async function loginUsuario(
  req: Request,
  res: Response
) {
  const { contato, senha, perfil } = req.body;

    // Procura o usuário pelo e-mail
  const usuario = await prisma.usuario.findUnique({ where: { contato } });

    // Usuário inexistente
  if (!usuario) {
      throw new AppError(401, "E-mail ou senha incorretos.");
  }

  if (perfil && usuario.perfil !== perfil) {
      throw new AppError(401, "As credenciais não pertencem ao perfil selecionado.");
  }

    // Compara senha digitada com o HASH armazenado
  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    throw new AppError(401, "E-mail ou senha incorretos.");
  }

    // Cria o JWT
  const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        contato: usuario.contato,
        perfil: usuario.perfil
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
      }
    );

  return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        contato: usuario.contato,
        perfil: usuario.perfil
      }
    });

}

export function obterPerfil(req: AuthRequest, res: Response) {
  return res.status(200).json({ usuario: req.usuario });
}