import { Router } from "express";
import { requireUser } from "../middlewares/auth";
import { listarPerguntas, listarHistorico, registrarResultado } from "../controllers/quiz.controller";

export const quizRoutes = Router();
quizRoutes.get("/perguntas", listarPerguntas);
quizRoutes.post("/resultado", registrarResultado);
quizRoutes.get("/historico", requireUser, listarHistorico);
