import { Request, Response } from "express";
import { buscaCatalogoSchema } from "../schemas/comum";
import { criarOfertaSchema } from "../schemas/oferta";
import * as service from "../services/ofertaService";
import { parseId } from "../utils/parseId";

export async function listar(req: Request, res: Response) {
  res.json(
    await service.listarOfertas(
      req.user!.id,
      buscaCatalogoSchema.parse(req.query),
    ),
  );
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(
    await service.criarOferta(criarOfertaSchema.parse(req.body)),
  );
}

export async function editar(req: Request, res: Response) {
  res.json(
    await service.editarOferta(
      parseId(req.params.id),
      criarOfertaSchema.parse(req.body),
    ),
  );
}

export async function arquivar(req: Request, res: Response) {
  res.json(await service.arquivarOferta(parseId(req.params.id)));
}
