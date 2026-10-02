import { Router } from "express";
import { listarPerguntas, registrarResultado, buscarUltimoResultado } from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const quizRoutes = Router();
quizRoutes.get("/perguntas", listarPerguntas);
quizRoutes.post("/resultado", registrarResultado);
quizRoutes.get("/resultado", requireAuth, buscarUltimoResultado);
