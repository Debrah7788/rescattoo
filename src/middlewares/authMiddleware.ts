import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { AppError } from "./errorHandler.js";

export interface AuthRequest extends Request {
  usuario?: {
    id_usuario: number;
    nome: string;
    contato: string;
    perfil: string;
  };
}

export function autenticar(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return next(new AppError(401, "Token de autenticação não informado."));
  }

  const partes = authorization.split(" ");
  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return next(new AppError(401, "Formato do token inválido."));
  }

  try {
    req.usuario = jwt.verify(partes[1], JWT_SECRET) as AuthRequest["usuario"];
    return next();
  } catch {
    return next(new AppError(401, "Token inválido ou expirado."));
  }
}

export function exigirAdministrador(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.usuario?.perfil !== "admin") {
    return next(new AppError(403, "Acesso permitido apenas para administradores."));
  }

  return next();
}