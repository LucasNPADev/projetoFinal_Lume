import { Request, Response } from 'express';
import { loginSchema } from '../schemas/usuario';
import * as sessionService from '../services/sessionService';

export async function login(req: Request, res: Response) {
  const dados = loginSchema.parse(req.body);
  const sessao = await sessionService.autenticar(dados);
  res.json(sessao);
}
