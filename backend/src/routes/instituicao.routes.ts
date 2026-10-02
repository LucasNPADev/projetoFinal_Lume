import { Router } from "express";
import { buscarInstituicao, listarInstituicoes } from "../controllers/catalog.controller";
import { criarAvaliacao, listarAvaliacoes } from "../controllers/avaliacao.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const instituicaoRoutes = Router();
instituicaoRoutes.get("/", listarInstituicoes);
instituicaoRoutes.get("/:id", buscarInstituicao);
instituicaoRoutes.get("/:id/avaliacoes", listarAvaliacoes);
instituicaoRoutes.post("/:id/avaliacoes", requireAuth, criarAvaliacao);
