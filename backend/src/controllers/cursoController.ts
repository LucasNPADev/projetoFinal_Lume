import { Request, Response } from "express";
import {
  criarCursoSchema,
  editarCursoSchema,
  listarCursosSchema,
} from "../schemas/curso";
import * as service from "../services/cursoService";
import { parseId } from "../utils/parseId";
export async function criar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.criarCurso(criarCursoSchema.parse(req.body), req.user!.id),
    );
}
export async function listar(req: Request, res: Response) {
  res.json(
    await service.listarCursos(
      listarCursosSchema.parse(req.query),
      req.user!.id,
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function buscar(req: Request, res: Response) {
  res.json(
    await service.buscarCurso(
      parseId(req.params.id),
      req.user!.id,
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function editar(req: Request, res: Response) {
  res.json(
    await service.editarCurso(
      parseId(req.params.id),
      editarCursoSchema.parse(req.body),
    ),
  );
}
export async function arquivar(req: Request, res: Response) {
  res.json(
    await service.editarCurso(parseId(req.params.id), { status: false }),
  );
}
