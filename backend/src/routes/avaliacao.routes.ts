import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireUser } from "../middlewares/auth";
import { ApiError } from "../middlewares/errors";
import { paramId, texto } from "../utils/validation";

export const avaliacaoRoutes = Router();
const avaliar = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(2000).nullable().optional(),
  ano: z.number().int().min(1950).max(2100).nullable().optional()
}).strict();

avaliacaoRoutes.get("/instituicao/:id", async (req, res) => {
  const instituicaoId = paramId(req);
  if (!(await prisma.instituicao.findFirst({ where: { id: instituicaoId, ativo: true }, select: { id: true } }))) throw new ApiError(404, "Instituicao nao encontrada.");
  res.json(await prisma.avaliacao.findMany({
    where: { instituicaoId, status: "APROVADA" },
    select: { id: true, nota: true, comentario: true, ano: true, criadoEm: true },
    orderBy: { criadoEm: "desc" }, take: 100
  }));
});

avaliacaoRoutes.put("/instituicao/:id", requireUser, async (req, res) => {
  const instituicaoId = paramId(req);
  if (!(await prisma.instituicao.findFirst({ where: { id: instituicaoId, ativo: true }, select: { id: true } }))) throw new ApiError(404, "Instituicao nao encontrada.");
  const input = avaliar.parse(req.body);
  const usuarioId = req.principal!.id;
  const result = await prisma.avaliacao.upsert({
    where: { usuarioId_instituicaoId: { usuarioId, instituicaoId } },
    update: { ...input, status: "PENDENTE" },
    create: { usuarioId, instituicaoId, ...input, status: "PENDENTE" },
    select: { id: true, nota: true, comentario: true, ano: true, status: true, criadoEm: true }
  });
  res.json({ ...result, aviso: "A avaliacao sera publicada apos moderacao." });
});

avaliacaoRoutes.delete("/:id", requireUser, async (req, res) => {
  const result = await prisma.avaliacao.deleteMany({ where: { id: paramId(req), usuarioId: req.principal!.id } });
  if (!result.count) throw new ApiError(404, "Avaliacao nao encontrada entre as suas.");
  res.status(204).end();
});

avaliacaoRoutes.post("/:id/denuncias", requireUser, async (req, res) => {
  const avaliacaoId = paramId(req);
  const { motivo } = z.object({ motivo: texto(1000) }).strict().parse(req.body);
  const avaliacao = await prisma.avaliacao.findFirst({ where: { id: avaliacaoId, status: "APROVADA" }, select: { id: true, usuarioId: true } });
  if (!avaliacao) throw new ApiError(404, "Avaliacao nao encontrada.");
  if (avaliacao.usuarioId === req.principal!.id) throw new ApiError(400, "Nao e possivel denunciar a propria avaliacao.");
  const denuncia = await prisma.denunciaAvaliacao.upsert({
    where: { usuarioId_avaliacaoId: { usuarioId: req.principal!.id, avaliacaoId } },
    update: { motivo, status: "PENDENTE", resolvidoEm: null },
    create: { usuarioId: req.principal!.id, avaliacaoId, motivo },
    select: { id: true, status: true, criadoEm: true }
  });
  res.status(201).json(denuncia);
});
