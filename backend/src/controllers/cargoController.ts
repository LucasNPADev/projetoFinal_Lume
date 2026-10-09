import { Request, Response } from "express";
import {
  criarCargoSchema,
  editarCargoSchema,
  rotaSchema,
  listarCargosSchema,
} from "../schemas/cargo";
import * as service from "../services/cargoService";
import { parseId } from "../utils/parseId";
export async function criar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.criarCargo(criarCargoSchema.parse(req.body), req.user!.id),
    );
}
export async function listar(req: Request, res: Response) {
  res.json(
    await service.listarCargos(
      req.user!.id,
      listarCargosSchema.parse(req.query),
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function buscar(req: Request, res: Response) {
  res.json(
    await service.buscarCargo(
      parseId(req.params.id),
      req.user!.id,
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function editar(req: Request, res: Response) {
  res.json(
    await service.editarCargo(
      parseId(req.params.id),
      editarCargoSchema.parse(req.body),
    ),
  );
}
export async function arquivar(req: Request, res: Response) {
  res.json(
    await service.editarCargo(parseId(req.params.id), { status: false }),
  );
}
export async function criarRota(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.criarRota(
        parseId(req.params.id),
        rotaSchema.parse(req.body),
      ),
    );
}
export async function listarRotas(req: Request, res: Response) {
  res.json(
    (
      await service.buscarCargo(
        parseId(req.params.id),
        req.user!.id,
        req.user!.perfil === "ADMIN",
      )
    ).rotas,
  );
}
export async function buscarRota(req: Request, res: Response) {
  res.json(
    await service.buscarRota(
      parseId(req.params.id),
      req.user!.id,
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function editarRota(req: Request, res: Response) {
  res.json(
    await service.editarRota(
      parseId(req.params.id),
      rotaSchema.parse(req.body),
    ),
  );
}
export async function arquivarRota(req: Request, res: Response) {
  res.json(await service.arquivarRota(parseId(req.params.id)));
}
