import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAdmin } from "../middlewares/auth";
import { ApiError } from "../middlewares/errors";
import { avisarEventoIngresso } from "../services/notificacoes.service";
import { id, pagina, paramId, texto } from "../utils/validation";

export const eventosRoutes = Router();
export const tipoEvento = z.enum(["VESTIBULAR", "ENEM", "BOLSA", "OUTRO"]);
const eventoFields = z.object({
  titulo: texto(200), tipo: tipoEvento,
  descricao: texto(3000).nullable().optional(),
  inicio: z.coerce.date(),
  fim: z.coerce.date().nullable().optional(),
  urlFonte: z.string().url().max(500),
  instituicaoId: id.nullable().optional(),
  cursoId: id.nullable().optional(),
  ativo: z.boolean().default(true),
  dadosDemonstracao: z.boolean().default(false)
}).strict();
function validarPeriodo(inicio: Date, fim?: Date | null) {
  if (fim && fim < inicio) throw new ApiError(400, "Data final anterior a inicial.");
}
eventosRoutes.get("/", async (req, res) => {
  const filtros = z.object({
    tipo: tipoEvento.optional(),
    de: z.coerce.date().optional(),
    ate: z.coerce.date().optional(),
    instituicaoId: z.coerce.number().int().positive().optional(),
    cursoId: z.coerce.number().int().positive().optional(),
  }).passthrough().parse(req.query);
  const { skip, take } = pagina(req);
  const de = filtros.de ?? new Date();
  const ate = filtros.ate ?? new Date(de.getTime() + 365 * 24 * 3600 * 1000);
  validarPeriodo(de, ate);
  res.json(await prisma.eventoIngresso.findMany({
    where: {
      ativo: true, inicio: { gte: de, lte: ate },
      ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros.instituicaoId ? { instituicaoId: filtros.instituicaoId } : {}),
      ...(filtros.cursoId ? { cursoId: filtros.cursoId } : {}),
    },
    skip, take, orderBy: { inicio: "asc" },
    include: {
      instituicao: { select: { id: true, nome: true, cidade: true, estado: true } },
      curso: { select: { id: true, nome: true } }
    }
  }));
});
eventosRoutes.get("/admin", requireAdmin, async (req, res) => {
  const { skip, take } = pagina(req);
  res.json(await prisma.eventoIngresso.findMany({ skip, take, orderBy: { inicio: "desc" } }));
});
eventosRoutes.post("/", requireAdmin, async (req, res) => {
  const data = eventoFields.parse(req.body);
  validarPeriodo(data.inicio, data.fim);
  const novo = await prisma.$transaction(async (tx) => {
    const evento = await tx.eventoIngresso.create({ data });
    if (evento.ativo) await avisarEventoIngresso(tx, evento);
    return evento;
  });
  res.status(201).json(novo);
});
eventosRoutes.patch("/:id", requireAdmin, async (req, res) => {
  const idEvento = paramId(req);
  const input = eventoFields.partial().strict().parse(req.body);
  const current = await prisma.eventoIngresso.findUnique({ where: { id: idEvento } });
  if (!current) throw new ApiError(404, "Evento nao encontrado.");
  validarPeriodo(input.inicio ?? current.inicio, input.fim === undefined ? current.fim : input.fim);
  const novo = await prisma.eventoIngresso.update({ where: { id: idEvento }, data: input });
  res.json(novo);
});
