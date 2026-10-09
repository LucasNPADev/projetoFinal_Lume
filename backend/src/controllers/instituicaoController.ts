import { Request, Response } from "express";
import {
  criarInstituicaoSchema,
  editarInstituicaoSchema,
  vincularCursoSchema,
  vincularCursoJsonSchema,
  editarOfertaSchema,
} from "../schemas/instituicao";
import { buscaCatalogoSchema } from "../schemas/comum";
import * as service from "../services/instituicaoService";
import { listarOfertas, ofertasDisponiveis } from "../services/ofertaService";
import { parseId } from "../utils/parseId";
import { AppError } from "../utils/AppError";
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
      buscaCatalogoSchema.parse(req.query),
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function buscar(req: Request, res: Response) {
  res.json(
    await service.buscarInstituicao(
      parseId(req.params.id),
      req.user!.id,
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
export async function vincularCurso(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.vincularCurso(
        parseId(req.params.id),
        vincularCursoSchema.parse(req.body),
      ),
    );
}
export async function vincularCursoPorJson(req: Request, res: Response) {
  const { id_instituicao, ...dados } = vincularCursoJsonSchema.parse(req.body);
  res
    .status(201)
    .json(await service.vincularCurso(id_instituicao, dados));
}
export async function ofertas(req: Request, res: Response) {
  res.json(
    await listarOfertas(req.user!.id, buscaCatalogoSchema.parse(req.query)),
  );
}
export async function oferta(req: Request, res: Response) {
  const data = await ofertasDisponiveis(
    req.user!.id,
    {},
    { id_curso_instituicao: parseId(req.params.id) },
  );
  if (!data.length) throw new AppError("Oferta indisponível na região", 404);
  res.json(data[0]);
}
export async function editarOferta(req: Request, res: Response) {
  res.json(
    await service.editarOferta(
      parseId(req.params.id),
      editarOfertaSchema.parse(req.body),
    ),
  );
}
export async function arquivarOferta(req: Request, res: Response) {
  res.json(
    await service.editarOferta(parseId(req.params.id), { status: false }),
  );
}
