import { Request, Response } from 'express';
import { criarInstituicaoSchema, vincularCursoSchema } from '../schemas/instituicao';
import * as instituicaoService from '../services/instituicaoService';
import { parseId } from '../utils/parseId';

export async function criar(req: Request, res: Response) {
  const dados = criarInstituicaoSchema.parse(req.body);
  const instituicao = await instituicaoService.criarInstituicao(dados, req.user!.id);
  res.status(201).json(instituicao);
}

export async function vincularCurso(req: Request, res: Response) {
  const idInstituicao = parseId(String(req.params.id));
  const dados = vincularCursoSchema.parse(req.body);
  const oferta = await instituicaoService.vincularCurso(idInstituicao, dados);
  res.status(201).json(oferta);
}
