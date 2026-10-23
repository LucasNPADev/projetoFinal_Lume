import { Request, Response } from 'express';
import { cadastroSchema } from '../schemas/usuario';
import * as usuarioService from '../services/usuarioService';

export async function cadastrar(req: Request, res: Response) {
  const dados = cadastroSchema.parse(req.body);
  const usuario = await usuarioService.cadastrarUsuario(dados);
  res.status(201).json(usuario);
}
