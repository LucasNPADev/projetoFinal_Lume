import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { validarEvento } from "./ferramentasService";
export async function criarFonte(dados: {
  nome: string;
  orgao: string;
  url: string;
  consultado_em: Date;
  demonstracao?: boolean;
}) {
  const host = new URL(dados.url).hostname.toLowerCase();
  if (!host.endsWith(".gov.br"))
    throw new AppError("Cadastre uma fonte oficial em domínio gov.br", 400);
  if (dados.consultado_em > new Date())
    throw new AppError("Data da consulta não pode estar no futuro", 400);
  if (env.NODE_ENV === "production" && dados.demonstracao)
    throw new AppError("Fonte demonstrativa não permitida em produção", 400);
  return prisma.fonteDados.create({ data: dados });
}
export async function criarPergunta(
  idUsuario: bigint,
  dados: { enunciado: string; area_afinidade: string; status?: boolean },
) {
  return prisma.perguntaVocacional.create({
    data: { ...dados, id_usuario_cadastrador: idUsuario },
  });
}
export async function editarPergunta(
  id: bigint,
  dados: Prisma.PerguntaVocacionalUpdateInput,
) {
  return prisma.perguntaVocacional.update({
    where: { id_pergunta: id },
    data: dados,
  });
}
export async function criarEvento(dados: Prisma.EventoUncheckedCreateInput) {
  await validarEvento({
    id_instituicao:
      dados.id_instituicao == null
        ? dados.id_instituicao
        : BigInt(dados.id_instituicao),
    inicio: new Date(dados.inicio),
    fim: dados.fim ? new Date(dados.fim) : null,
  });
  return prisma.evento.create({ data: dados });
}
export async function editarEvento(
  id: bigint,
  dados: Prisma.EventoUncheckedUpdateInput,
) {
  const atual = await prisma.evento.findUnique({ where: { id_evento: id } });
  if (!atual) throw new AppError("Evento não encontrado", 404);
  const merged = { ...atual, ...dados };
  await validarEvento({
    id_instituicao: merged.id_instituicao as bigint | null,
    inicio: merged.inicio as Date,
    fim: merged.fim as Date | null,
  });
  return prisma.evento.update({ where: { id_evento: id }, data: dados });
}
export async function listarEventos(page: number, limit: number) {
  const [data, total] = await prisma.$transaction([
    prisma.evento.findMany({
      orderBy: { inicio: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evento.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
export async function listarFontes(page: number, limit: number) {
  const [data, total] = await prisma.$transaction([
    prisma.fonteDados.findMany({
      orderBy: { id_fonte: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.fonteDados.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
export async function listarDenuncias(page: number, limit: number) {
  const [data, total] = await prisma.$transaction([
    prisma.denuncia.findMany({
      include: { avaliacao: true },
      orderBy: { criado_em: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.denuncia.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
export async function resolverDenuncia(
  id: bigint,
  dados: { status: string; resposta: string },
) {
  return prisma.denuncia.update({ where: { id_denuncia: id }, data: dados });
}
export async function ofertasAdmin(page: number, limit: number) {
  const [data, total] = await prisma.$transaction([
    prisma.curso_Instituicao.findMany({
      include: { curso: true, instituicao: true, fonte_nota: true },
      orderBy: { id_curso_instituicao: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.curso_Instituicao.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
