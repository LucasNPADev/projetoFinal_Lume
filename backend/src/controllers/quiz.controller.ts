import { Request, Response } from "express";
import { z } from "zod";
import { quizService, respostasSchema } from "../services/quiz.service";

export async function listarPerguntas(_req: Request, res: Response) {
  res.json(await quizService.listarPerguntas());
}
export async function registrarResultado(req: Request, res: Response) {
  const { respostas } = z.object({ respostas: respostasSchema }).strict().parse(req.body);
  res.status(201).json(await quizService.registrarResultado(respostas, req.principal?.kind === "USER" ? req.principal.id : undefined));
}
export async function listarHistorico(req: Request, res: Response) {
  res.json(await quizService.historico(req.principal!.id));
}
