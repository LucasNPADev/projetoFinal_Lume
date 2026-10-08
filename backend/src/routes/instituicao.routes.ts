import { Router } from "express";
import { buscarInstituicao, listarInstituicoes } from "../controllers/catalog.controller";
export const instituicaoRoutes = Router();
instituicaoRoutes.get("/", listarInstituicoes);
instituicaoRoutes.get("/:id", buscarInstituicao);
// Avaliacoes: /api/avaliacoes/instituicao/:id
