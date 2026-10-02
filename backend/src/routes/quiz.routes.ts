import { Router } from "express";
import { listarPerguntas, registrarResultado } from "../controllers/quiz.controller";
export const quizRoutes = Router();
quizRoutes.get("/perguntas", listarPerguntas);
quizRoutes.post("/resultado", registrarResultado);