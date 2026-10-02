import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function buscarUsuario(req: Request, res: Response) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(req.params.id) },
    select: { id: true, nomeCompleto: true, email: true, telefone: true, dataNascimento: true, cidade: true, estado: true, consentimentoLocalizacao: true, criadoEm: true, atualizadoEm: true },
  });
  if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
  return res.json(usuario);
}

export async function atualizarUsuario(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nomeCompleto, telefone, dataNascimento, cidade, estado, consentimentoLocalizacao } = req.body;
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { nomeCompleto, telefone, dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined, cidade, estado, consentimentoLocalizacao },
    select: { id: true, nomeCompleto: true, email: true, telefone: true, dataNascimento: true, cidade: true, estado: true, consentimentoLocalizacao: true },
  });
  return res.json(usuario);
}