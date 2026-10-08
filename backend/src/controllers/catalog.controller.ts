import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { catalogService } from "../services/catalog.service";
import { ApiError } from "../middlewares/errors";
import { pagina, paramId } from "../utils/validation";
import { z } from "zod";

const filtros = z.object({ area: z.string().trim().max(100).optional(), cidade: z.string().trim().max(120).optional(), busca: z.string().trim().max(120).optional(), personalizado: z.enum(["true", "false"]).optional() }).passthrough();
export async function listarCargos(req: Request, res: Response) {
  const { area, busca, personalizado } = filtros.parse(req.query);
  const pg = pagina(req);
  let priorizarArea: string | undefined;
  if (personalizado === "true" && req.principal?.kind === "USER") {
    const ultimo = await prisma.historicoTesteVocacional.findFirst({ where: { usuarioId: req.principal.id }, orderBy: { respondidoEm: "desc" }, select: { resultadoArea: true } });
    priorizarArea = ultimo?.resultadoArea;
  }
  res.json(await catalogService.listarCargos({ area, busca, priorizarArea, skip: pg.skip, take: pg.take }));
}
export async function buscarCargo(req: Request, res: Response) {
  const item = await catalogService.buscarCargo(paramId(req));
  if (!item) throw new ApiError(404, "Cargo nao encontrado.");
  res.json(item);
}
export async function listarCursos(req: Request, res: Response) {
  const { area, busca } = filtros.parse(req.query);
  const pg = pagina(req);
  res.json(await catalogService.listarCursos(area, busca, pg.skip, pg.take));
}
export async function buscarCurso(req: Request, res: Response) {
  const item = await catalogService.buscarCurso(paramId(req));
  if (!item) throw new ApiError(404, "Curso nao encontrado.");
  res.json(item);
}
export async function listarInstituicoes(req: Request, res: Response) {
  const { cidade, busca } = filtros.parse(req.query);
  const pg = pagina(req);
  res.json(await catalogService.listarInstituicoes(cidade, busca, pg.skip, pg.take));
}
export async function buscarInstituicao(req: Request, res: Response) {
  const item = await catalogService.buscarInstituicao(paramId(req));
  if (!item) throw new ApiError(404, "Instituicao nao encontrada.");
  res.json(item);
}
