import { prisma } from "../config/prisma";

export const catalogService = {
  listarCargos: (filters: { area?: string; busca?: string }) =>
    prisma.cargo.findMany({
      where: {
        ...(filters.area ? { areaAtuacao: filters.area } : {}),
        ...(filters.busca
          ? {
              OR: [
                { nome: { contains: filters.busca, mode: "insensitive" } },
                { descricao: { contains: filters.busca, mode: "insensitive" } },
                { areaAtuacao: { contains: filters.busca, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { nome: "asc" },
      include: {
        trilhas: { include: { curso: true }, orderBy: { ordemEtapa: "asc" } },
      },
    }),

  buscarCargo: (id: number) =>
    prisma.cargo.findUnique({
      where: { id },
      include: {
        trilhas: {
          orderBy: { ordemEtapa: "asc" },
          include: {
            curso: {
              include: {
                instituicoes: {
                  where: { status: true },
                  include: { instituicao: true },
                },
              },
            },
          },
        },
      },
    }),

  listarCursos: (filters: { area?: string; modalidade?: string }) =>
    prisma.curso.findMany({
      where: {
        ...(filters.area ? { area: filters.area } : {}),
        ...(filters.modalidade
          ? { modalidade: { equals: filters.modalidade, mode: "insensitive" } }
          : {}),
      },
      orderBy: { nome: "asc" },
      include: {
        instituicoes: {
          where: { status: true },
          include: { instituicao: true },
        },
      },
    }),

  buscarCurso: (id: number) =>
    prisma.curso.findUnique({
      where: { id },
      include: {
        instituicoes: {
          where: { status: true },
          include: { instituicao: true },
        },
        trilhas: {
          include: { cargo: true },
          orderBy: { ordemEtapa: "asc" },
        },
      },
    }),

  listarInstituicoes: (filters: { cidade?: string; status?: boolean }) =>
    prisma.instituicao.findMany({
      where: {
        ...(filters.cidade ? { cidade: filters.cidade } : {}),
        ...(filters.status !== undefined ? { status: filters.status } : { status: true }),
      },
      orderBy: { nome: "asc" },
      include: {
        cursosOfertados: {
          where: { status: true },
          include: { curso: true },
        },
        avaliacoes: true,
      },
    }),

  buscarInstituicao: (id: number) =>
    prisma.instituicao.findFirst({
      where: { id, status: true },
      include: {
        cursosOfertados: {
          where: { status: true },
          include: { curso: true },
        },
        avaliacoes: {
          orderBy: { dataPublicacao: "desc" },
          include: { usuario: { select: { nomeCompleto: true } } },
        },
      },
    }),
};
