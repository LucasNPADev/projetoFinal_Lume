import { Request, Response } from "express";
import { prisma } from "../config/prisma";

function autorizado(req: Request, res: Response) {
  return Number(req.params.id) === res.locals.usuarioId;
}

export async function buscarUsuario(req: Request, res: Response) {
  if (!autorizado(req, res)) return res.status(403).json({ message: "Acesso não permitido." });
  const usuario = await prisma.usuario.findUnique({
    where: { id: res.locals.usuarioId },
    select: { id: true, nomeCompleto: true, email: true, telefone: true, dataNascimento: true, cidade: true, estado: true, consentimentoLocalizacao: true, criadoEm: true, atualizadoEm: true },
  });
  if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
  return res.json(usuario);
}

export async function atualizarUsuario(req: Request, res: Response) {
  if (!autorizado(req, res)) return res.status(403).json({ message: "Acesso não permitido." });
  const { nomeCompleto, telefone, dataNascimento, cidade, estado, consentimentoLocalizacao } = req.body ?? {};
  const usuario = await prisma.usuario.update({
    where: { id: res.locals.usuarioId },
    data: { nomeCompleto, telefone, dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined, cidade, estado, consentimentoLocalizacao },
    select: { id: true, nomeCompleto: true, email: true, telefone: true, dataNascimento: true, cidade: true, estado: true, consentimentoLocalizacao: true },
  });
  return res.json(usuario);
}
