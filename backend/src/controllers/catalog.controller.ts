import { Request, Response } from "express";
import { catalogService } from "../services/catalog.service";

export async function listarCargos(_req: Request, res: Response) { res.json(await catalogService.listarCargos()); }
export async function buscarCargo(req: Request, res: Response) {
  const item = await catalogService.buscarCargo(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Cargo não encontrado." });
  return res.json(item);
}
export async function listarCursos(req: Request, res: Response) { res.json(await catalogService.listarCursos(req.query.area?.toString())); }
export async function listarInstituicoes(req: Request, res: Response) { res.json(await catalogService.listarInstituicoes(req.query.cidade?.toString())); }
export async function buscarInstituicao(req: Request, res: Response) {
  const item = await catalogService.buscarInstituicao(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Instituição não encontrada." });
  return res.json(item);
}