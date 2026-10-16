import { Request, Response } from "express";
import {
  criarInstituicaoSchema,
  editarInstituicaoSchema,
  listarInstituicoesSchema,
} from "../../schemas/instituicao";
import * as service from "../../services/instituicaoService";
import { parseId } from "../../utils/parseId";
export async function criar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.criarInstituicao(
        criarInstituicaoSchema.parse(req.body),
        req.user!.id,
      ),
    );
}
export async function listar(req: Request, res: Response) {
  res.json(
    await service.listarInstituicoes(
      req.user!.id,
      listarInstituicoesSchema.parse(req.query),
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function buscar(req: Request, res: Response) {
  res.json(
    await service.buscarInstituicao(
      parseId(req.params.id),
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function editar(req: Request, res: Response) {
  res.json(
    await service.editarInstituicao(
      parseId(req.params.id),
      editarInstituicaoSchema.parse(req.body),
    ),
  );
}
export async function arquivar(req: Request, res: Response) {
  res.json(
    await service.editarInstituicao(parseId(req.params.id), { status: false }),
  );
}
