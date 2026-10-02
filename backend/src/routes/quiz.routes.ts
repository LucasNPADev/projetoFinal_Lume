import { Router } from "express";
import { listarPerguntas, registrarResultado, buscarUltimoResultado } from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { optionalAuth } from "../middlewares/optionalAuth.middleware";

export const quizRoutes = Router();
quizRoutes.get("/perguntas", listarPerguntas);
quizRoutes.post("/resultado", optionalAuth, registrarResultado);
quizRoutes.get("/resultado", requireAuth, buscarUltimoResultado);
