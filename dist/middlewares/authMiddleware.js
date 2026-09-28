import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { AppError } from "./errorHandler.js";
export function autenticar(req, _res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return next(new AppError(401, "Token de autenticação não informado."));
    }
    const partes = authorization.split(" ");
    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return next(new AppError(401, "Formato do token inválido."));
    }
    try {
        req.usuario = jwt.verify(partes[1], JWT_SECRET);
        return next();
    }
    catch {
        return next(new AppError(401, "Token inválido ou expirado."));
    }
}
export function exigirAdministrador(req, res, next) {
    if (req.usuario?.perfil !== "admin") {
        return next(new AppError(403, "Acesso permitido apenas para administradores."));
    }
    return next();
}
