import { Request, Response } from "express";
import { quizService } from "../services/quiz.service";

export async function listarPerguntas(_req: Request, res: Response) {
  res.json(await quizService.listarPerguntas());
}
export async function registrarResultado(req: Request, res: Response) {
  const { usuarioId, resultadoArea, respostas } = req.body;
  if (!usuarioId || !resultadoArea || !respostas) {
    return res.status(400).json({ message: "usuarioId, resultadoArea e respostas são obrigatórios." });
  }
  const historico = await quizService.registrarResultado(Number(usuarioId), String(resultadoArea), respostas);
  return res.status(201).json(historico);
}