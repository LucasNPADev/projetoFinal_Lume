import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errors";
import { paramId, texto, uf } from "../utils/validation";

const campos = {
  id: true, nomeCompleto: true, email: true, telefone: true, dataNascimento: true, cidade: true,
  estado: true, consentimentoLocalizacao: true, criadoEm: true, atualizadoEm: true
} as const;

const edicao = z.object({
  nomeCompleto: texto(150).optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
  dataNascimento: z.coerce.date().max(new Date()).nullable().optional(),
  cidade: texto(120).nullable().optional(),
  estado: uf.nullable().optional(),
  consentimentoLocalizacao: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, "Envie ao menos um campo.");

function idProprio(req: Request) {
  if (req.principal?.kind !== "USER") throw new ApiError(403, "Acesso reservado a estudantes.");
  if (req.params.id && paramId(req) !== req.principal.id) throw new ApiError(403, "Voce so pode acessar seu proprio perfil.");
  return req.principal.id;
}

export async function buscarUsuario(req: Request, res: Response) {
  const user = await prisma.usuario.findUnique({ where: { id: idProprio(req) }, select: campos });
  if (!user) throw new ApiError(404, "Usuario nao encontrado.");
  res.json(user);
}
export async function atualizarUsuario(req: Request, res: Response) {
  const data = edicao.parse(req.body);
  const user = await prisma.usuario.update({ where: { id: idProprio(req) }, data, select: campos });
  res.json(user);
}
export async function excluirUsuario(req: Request, res: Response) {
  await prisma.usuario.delete({ where: { id: idProprio(req) } });
  res.status(204).end();
}
