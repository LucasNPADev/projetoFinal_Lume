import { Request, Response } from 'express';
import { criarCursoSchema, listarCursosSchema } from '../schemas/curso';
import * as cursoService from '../services/cursoService';
import { parseId } from '../utils/parseId';

export async function criar(req: Request, res: Response) {
  const dados = criarCursoSchema.parse(req.body);
  const curso = await cursoService.criarCurso(dados, req.user!.id);
  res.status(201).json(curso);
}

export async function listar(req: Request, res: Response) {
  const filtros = listarCursosSchema.parse(req.query);
  res.json(await cursoService.listarCursos(filtros));
}

export async function buscar(req: Request, res: Response) {
  const id = parseId(String(req.params.id));
  res.json(await cursoService.buscarCurso(id, req.user!.id));
}
