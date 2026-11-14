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
  if (dados.consultado_em > new Date())
    throw new AppError("Data da consulta não pode estar no futuro", 400);
  if (env.NODE_ENV === "production" && dados.demonstracao)
    throw new AppError("Fonte demonstrativa não permitida em produção", 400);
  return prisma.fonteDados.create({ data: dados });
}
export async function editarFonte(
  id: bigint,
  dados: Prisma.FonteDadosUpdateInput,
) {
  const atual = await prisma.fonteDados.findUnique({
    where: { id_fonte: id },
  });
  if (!atual) throw new AppError("Fonte de dados não encontrada", 404);
  const consultadoEm =
    dados.consultado_em instanceof Date
      ? dados.consultado_em
      : atual.consultado_em;
  const demonstracao =
    typeof dados.demonstracao === "boolean"
      ? dados.demonstracao
      : atual.demonstracao;
  if (consultadoEm > new Date())
    throw new AppError("Data da consulta não pode estar no futuro", 400);
  if (env.NODE_ENV === "production" && demonstracao)
    throw new AppError("Fonte demonstrativa não permitida em produção", 400);
  return prisma.fonteDados.update({ where: { id_fonte: id }, data: dados });
}
export async function excluirFonte(id: bigint) {
  const [cargos, ofertas] = await Promise.all([
    prisma.cargo.count({ where: { id_fonte: id } }),
    prisma.curso_Instituicao.count({ where: { id_fonte_nota: id } }),
  ]);
  if (cargos > 0 || ofertas > 0)
    throw new AppError(
      "Não é possível remover uma fonte vinculada a cargos ou ofertas.",
      409,
    );
  return prisma.fonteDados.delete({ where: { id_fonte: id } });
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
