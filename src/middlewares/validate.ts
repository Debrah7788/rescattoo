import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });

    if (!resultado.success) {
      return next(resultado.error);
    }

    const dados = resultado.data as { body?: unknown; params?: unknown; query?: unknown; headers?: unknown };
    if (dados.body !== undefined) req.body = dados.body;
    if (dados.params !== undefined) req.params = dados.params as Request["params"];
    if (dados.query !== undefined) {
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: dados.query
      });
    }
    if (dados.headers !== undefined) req.headers = dados.headers as Request["headers"];
    return next();
  };
}
