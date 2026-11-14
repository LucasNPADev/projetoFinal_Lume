import { Request, Response } from "express";
import { loginSchema, refreshSchema } from "../schemas/usuario";
import * as service from "../services/sessionService";
export async function login(req: Request, res: Response) {
  res.json(await service.autenticar(loginSchema.parse(req.body)));
}
export async function refresh(req: Request, res: Response) {
  res.json(await service.renovar(refreshSchema.parse(req.body).refresh_token));
}
export async function logout(req: Request, res: Response) {
  await service.sair(req.user!.idSessao);
  res.status(204).end();
}
