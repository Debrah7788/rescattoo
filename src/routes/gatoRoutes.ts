import express from "express";

import {
  getGatos,
  getGato,
  postGato,
  putGato,
  deleteGato
} from "../controllers/gatoController.js";
import { criarSolicitacaoAdocao } from "../controllers/adocaoController.js";

import {
  autenticar,
  exigirAdministrador
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { gatoBodySchema, gatoParamsAndBodySchema, gatoParamsSchema, gatoQuerySchema } from "../schemas/gatoSchemas.js";
import { authHeadersSchema } from "../schemas/authSchemas.js";
import { solicitacaoAdocaoSchema } from "../schemas/adocaoSchemas.js";

const router = express.Router();

// ======================================
// ROTAS AUTENTICADAS
// ======================================

router.get("/gatos", validate(authHeadersSchema), autenticar, validate(gatoQuerySchema), getGatos);

router.get("/gatos/:id", validate(authHeadersSchema), autenticar, validate(gatoParamsSchema), getGato);

// ======================================
// ROTAS PROTEGIDAS
// ======================================

router.post(
  "/gatos",
  validate(authHeadersSchema),
  autenticar,
  exigirAdministrador,
  validate(gatoBodySchema),
  postGato
);

router.put(
  "/gatos/:id",
  validate(authHeadersSchema),
  autenticar,
  exigirAdministrador,
  validate(gatoParamsAndBodySchema),
  putGato
);

router.delete(
  "/gatos/:id",
  validate(authHeadersSchema),
  autenticar,
  exigirAdministrador,
  validate(gatoParamsSchema),
  deleteGato
);

router.post(
  "/gatos/:id/solicitacoes-adocao",
  validate(authHeadersSchema),
  autenticar,
  validate(solicitacaoAdocaoSchema),
  criarSolicitacaoAdocao
);

export default router;