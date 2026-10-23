import { Request, Response } from "express";
import { buscaCatalogoSchema } from "../schemas/comum";
import { criarOfertaSchema } from "../schemas/oferta";
import * as service from "../services/ofertaService";

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
