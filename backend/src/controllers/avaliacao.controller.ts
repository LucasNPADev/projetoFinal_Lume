import { Request, Response } from "express";
import { avaliacaoService } from "../services/avaliacao.service";

export async function listarAvaliacoes(req: Request, res: Response) {
  res.json(await avaliacaoService.listar(Number(req.params.id)));
}

export async function criarAvaliacao(req: Request, res: Response) {
  const comentario = String(req.body?.comentario ?? "").trim();
  if (!comentario) {
    return res.status(400).json({ message: "O comentário da avaliação é obrigatório." });
  }

  const avaliacao = await avaliacaoService.criar({
    usuarioId: res.locals.usuarioId,
    instituicaoId: Number(req.params.id),
    comentario,
  });

  return res.status(201).json(avaliacao);
}
