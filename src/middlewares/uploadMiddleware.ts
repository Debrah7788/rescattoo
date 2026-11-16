import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { AppError } from "./errorHandler.js";

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

mkdirSync(UPLOADS_DIR, { recursive: true });

const extensaoPorMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif"
};

const armazenamento = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, arquivo, callback) => {
    callback(null, `${randomUUID()}${extensaoPorMime[arquivo.mimetype]}`);
  }
});

export const uploadImagem = multer({
  storage: armazenamento,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, arquivo, callback) => {
    if (!Object.hasOwn(extensaoPorMime, arquivo.mimetype)) {
      return callback(new AppError(400, "Tipo de arquivo não permitido. Envie JPEG, PNG ou GIF."));
    }
    return callback(null, true);
  }
});
