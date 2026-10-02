import { prisma } from "../config/prisma";

export const catalogService = {
  listarCargos: (filters: { area?: string; busca?: string; altaDemanda?: boolean }) => prisma.cargo.findMany({
    where: {
      ...(filters.area ? { area: filters.area } : {}),
      ...(filters.altaDemanda !== undefined ? { altaDemanda: filters.altaDemanda } : {}),
      ...(filters.busca ? { OR: [{ nome: { contains: filters.busca, mode: "insensitive" } }, { descricao: { contains: filters.busca, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }],
  }),
  buscarCargo: (id: number) => prisma.cargo.findUnique({
    where: { id },
    include: { trilhas: { orderBy: { ordem: "asc" }, include: { curso: { include: { instituicoes: { include: { instituicao: true } } } } } } },
  }),
  listarCursos: (filters: { area?: string; modalidade?: string }) => prisma.curso.findMany({
    where: { ativo: true, ...(filters.area ? { area: filters.area } : {}), ...(filters.modalidade ? { modalidade: filters.modalidade as any } : {}) },
    orderBy: { nome: "asc" },
    include: { instituicoes: { where: { ativo: true }, include: { instituicao: true } } },
  }),
  buscarCurso: (id: number) => prisma.curso.findFirst({
    where: { id, ativo: true },
    include: { instituicoes: { where: { ativo: true }, include: { instituicao: true } }, trilhas: { include: { cargo: true }, orderBy: { ordem: "asc" } } },
  }),
  listarInstituicoes: (filters: { cidade?: string; tipo?: string }) => prisma.instituicao.findMany({
    where: { ativo: true, ...(filters.cidade ? { cidade: filters.cidade } : {}), ...(filters.tipo ? { tipo: filters.tipo as any } : {}) },
    orderBy: { nome: "asc" },
    include: { cursos: { where: { ativo: true }, include: { curso: true } }, avaliacoes: true },
  }),
  buscarInstituicao: (id: number) => prisma.instituicao.findFirst({
    where: { id, ativo: true },
    include: {
      cursos: { where: { ativo: true }, include: { curso: true } },
      avaliacoes: { orderBy: { criadoEm: "desc" }, include: { usuario: { select: { nomeCompleto: true } } } },
    },
  }),
};
