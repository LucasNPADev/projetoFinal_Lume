import { Request, Response } from "express";
import { catalogService } from "../services/catalog.service";

export async function listarCargos(req: Request, res: Response) {
  res.json(
    await catalogService.listarCargos({
      area: req.query.area?.toString(),
      busca: req.query.busca?.toString(),
    }),
  );
}

export async function buscarCargo(req: Request, res: Response) {
  const item = await catalogService.buscarCargo(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Cargo não encontrado." });
  return res.json(item);
}

export async function listarCursos(req: Request, res: Response) {
  res.json(
    await catalogService.listarCursos({
      area: req.query.area?.toString(),
      modalidade: req.query.modalidade?.toString(),
    }),
  );
}

export async function buscarCurso(req: Request, res: Response) {
  const item = await catalogService.buscarCurso(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Curso não encontrado." });
  return res.json(item);
}

export async function listarInstituicoes(req: Request, res: Response) {
  res.json(
    await catalogService.listarInstituicoes({
      cidade: req.query.cidade?.toString(),
      status: req.query.status === undefined ? undefined : req.query.status === "true",
    }),
  );
}

export async function buscarInstituicao(req: Request, res: Response) {
  const item = await catalogService.buscarInstituicao(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Instituição não encontrada." });
  return res.json(item);
}
