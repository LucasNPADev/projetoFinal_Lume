import { Request, Response } from "express";
import { avaliacaoService } from "../services/avaliacao.service";

export async function listarAvaliacoes(req: Request, res: Response) {
  res.json(await avaliacaoService.listar(Number(req.params.id)));
}

export async function criarAvaliacao(req: Request, res: Response) {
  const nota = Number(req.body?.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return res.status(400).json({ message: "A nota deve estar entre 1 e 5." });
  const avaliacao = await avaliacaoService.criar({
    usuarioId: res.locals.usuarioId,
    instituicaoId: Number(req.params.id),
    nota,
    comentario: req.body?.comentario,
    ano: req.body?.ano ? Number(req.body.ano) : undefined,
  });
  return res.status(201).json(avaliacao);
}
