import express from "express";
import { obterImagemUsuario, salvarImagemUsuario } from "../controllers/imagemController.js";
import { autenticar } from "../middlewares/authMiddleware.js";
import { uploadImagem } from "../middlewares/uploadMiddleware.js";
import { authHeadersSchema } from "../schemas/authSchemas.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.get("/api/users/image", validate(authHeadersSchema), autenticar, obterImagemUsuario);
router.post(
  "/api/users/image",
  validate(authHeadersSchema),
  autenticar,
  uploadImagem.single("imagem"),
  salvarImagemUsuario
);
router.put(
  "/api/users/image",
  validate(authHeadersSchema),
  autenticar,
  uploadImagem.single("imagem"),
  salvarImagemUsuario
);

export default router;
