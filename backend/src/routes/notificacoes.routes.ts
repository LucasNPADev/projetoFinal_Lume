import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireUser } from "../middlewares/auth";
import { ApiError } from "../middlewares/errors";
import { pagina, paramId } from "../utils/validation";

export const notificacoesRoutes = Router();
notificacoesRoutes.use(requireUser);
notificacoesRoutes.get("/", async (req, res) => {
  const apenasNaoLidas = z.enum(["true", "false"]).optional().parse(req.query.naoLidas) === "true";
  const { skip, take } = pagina(req);
  const usuarioId = req.principal!.id;
  res.json(await prisma.notificacao.findMany({
    where: { usuarioId, ...(apenasNaoLidas ? { lidaEm: null } : {}) },
    skip, take, orderBy: { criadaEm: "desc" }
  }));
});
notificacoesRoutes.patch("/:id/lida", async (req, res) => {
  const usuarioId = req.principal!.id;
  const id = paramId(req);
  const change = await prisma.notificacao.updateMany({ where: { id, usuarioId }, data: { lidaEm: new Date() } });
  if (!change.count) throw new ApiError(404, "Notificacao nao encontrada.");
  res.status(204).end();
});
notificacoesRoutes.delete("/:id", async (req, res) => {
  const change = await prisma.notificacao.deleteMany({ where: { id: paramId(req), usuarioId: req.principal!.id } });
  if (!change.count) throw new ApiError(404, "Notificacao nao encontrada.");
  res.status(204).end();
});
