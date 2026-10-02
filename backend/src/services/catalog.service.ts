import { prisma } from "../config/prisma";

export const catalogService = {
  listarCargos: () => prisma.cargo.findMany({ orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }] }),
  buscarCargo: (id: number) => prisma.cargo.findUnique({
    where: { id },
    include: { trilhas: { orderBy: { ordem: "asc" }, include: { curso: true } } },
  }),
  listarCursos: (area?: string) => prisma.curso.findMany({
    where: { ativo: true, ...(area ? { area } : {}) },
    orderBy: { nome: "asc" },
    include: { instituicoes: { include: { instituicao: true } } },
  }),
  listarInstituicoes: (cidade?: string) => prisma.instituicao.findMany({
    where: { ativo: true, ...(cidade ? { cidade } : {}) },
    orderBy: { nome: "asc" },
    include: { cursos: { include: { curso: true } } },
  }),
  buscarInstituicao: (id: number) => prisma.instituicao.findUnique({
    where: { id },
    include: {
      cursos: { include: { curso: true } },
      avaliacoes: { orderBy: { criadoEm: "desc" } },
    },
  }),
};