import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ erro: "Rota não encontrada." });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      erro: "Dados de entrada inválidos.",
      issues: error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        erro: "Já existe um registro com esses dados.",
        issues: [{ path: "body.contato", message: "Este e-mail já está cadastrado." }]
      });
    }
    if (error.code === "P2003") {
      return res.status(409).json({ erro: "O recurso está associado a outros registros." });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ erro: "O recurso solicitado não foi encontrado." });
    }
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    return res.status(400).json({
      erro: "JSON inválido.",
      issues: [{ path: "body", message: "O corpo deve ser um JSON válido." }]
    });
  }

  if (typeof error === "object" && error !== null && "status" in error && error.status === 413) {
    return res.status(413).json({
      erro: "Corpo da requisição muito grande.",
      issues: [{ path: "body", message: "Reduza o tamanho do corpo enviado." }]
    });
  }

  console.error(error);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
