import { Request, Response } from "express";
import { quizService } from "../services/quiz.service";

export async function listarPerguntas(_req: Request, res: Response) {
  res.json(await quizService.listarPerguntas());
}

export async function registrarResultado(req: Request, res: Response) {
  const respostas = req.body?.respostas;
  if (!Array.isArray(respostas) || respostas.length === 0) return res.status(400).json({ message: "Envie as respostas do quiz." });
  const usuarioId = req.body?.usuarioId ? Number(req.body.usuarioId) : undefined;
  const resultado = await quizService.calcularResultado(respostas, usuarioId);
  return res.status(201).json(resultado);
}

export async function buscarUltimoResultado(_req: Request, res: Response) {
  const resultado = await quizService.buscarUltimoResultado(res.locals.usuarioId);
  if (!resultado) return res.status(404).json({ message: "Nenhum resultado encontrado." });
  return res.json(resultado);
}
