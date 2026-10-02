import { Request, Response } from "express";
import { prisma } from "../config/prisma";

function autorizado(req: Request, res: Response) {
  return Number(req.params.id) === res.locals.usuarioId;
}

export async function buscarUsuario(req: Request, res: Response) {
  if (!autorizado(req, res)) {
    return res.status(403).json({ message: "Acesso não permitido." });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: res.locals.usuarioId },
    select: {
      id: true,
      nomeCompleto: true,
      email: true,
      endereco: true,
      rua: true,
      cidade: true,
      bairro: true,
      estado: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!usuario) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  return res.json(usuario);
}

export async function atualizarUsuario(req: Request, res: Response) {
  if (!autorizado(req, res)) {
    return res.status(403).json({ message: "Acesso não permitido." });
  }

  const {
    nome,
    nomeCompleto,
    endereco,
    rua,
    cidade,
    bairro,
    estado,
    latitude,
    longitude,
  } = req.body ?? {};

  const usuario = await prisma.usuario.update({
    where: { id: res.locals.usuarioId },
    data: {
      nomeCompleto: nome ?? nomeCompleto,
      endereco,
      rua,
      cidade,
      bairro,
      estado,
      latitude: latitude === undefined ? undefined : Number(latitude),
      longitude: longitude === undefined ? undefined : Number(longitude),
    },
    select: {
      id: true,
      nomeCompleto: true,
      email: true,
      endereco: true,
      rua: true,
      cidade: true,
      bairro: true,
      estado: true,
      latitude: true,
      longitude: true,
    },
  });

  return res.json(usuario);
}
