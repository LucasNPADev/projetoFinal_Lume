import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const ofertaAtiva: Prisma.CursoInstituicaoWhereInput = {
  ativo: true, curso: { ativo: true }, instituicao: { ativo: true }
};
export const catalogService = {
  async listarCargos(filtros: { area?: string; busca?: string; priorizarArea?: string; skip: number; take: number }) {
    const where: Prisma.CargoWhereInput = {
      ativo: true, trilhas: { some: { curso: { ativo: true } } },
      ...(filtros.area ? { area: { equals: filtros.area, mode: "insensitive" } } : {}),
      ...(filtros.busca ? { OR: [{ nome: { contains: filtros.busca, mode: "insensitive" } }, { descricao: { contains: filtros.busca, mode: "insensitive" } }] } : {})
    };
    if (!filtros.priorizarArea) return prisma.cargo.findMany({ where, orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }], skip: filtros.skip, take: filtros.take });
    // Prioriza area, mantendo TODAS as demais visiveis na navegacao (RN-01).
    const priorizados = await prisma.cargo.findMany({ where: { AND: [where, { area: filtros.priorizarArea }] }, orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }] });
    const demais = await prisma.cargo.findMany({ where: { AND: [where, { area: { not: filtros.priorizarArea } }] }, orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }] });
    return [...priorizados, ...demais].slice(filtros.skip, filtros.skip + filtros.take);
  },
  async buscarCargo(id: number) {
    const cargo = await prisma.cargo.findFirst({
      where: { id, ativo: true },
      include: { trilhas: {
        where: { curso: { ativo: true } }, orderBy: [{ rota: "asc" }, { ordem: "asc" }],
        include: { curso: { include: { instituicoes: { where: ofertaAtiva, include: { instituicao: true } } } } }
      } }
    });
    if (!cargo) return null;
    const rotas: Record<string, typeof cargo.trilhas> = {};
    for (const etapa of cargo.trilhas) (rotas[etapa.rota] ??= []).push(etapa);
    return { ...cargo, rotas, avisoTrilhas: "Trilhas orientativas, sem obrigatoriedade de seguir etapas." };
  },
  listarCursos(area?: string, busca?: string, skip = 0, take = 20) {
    return prisma.curso.findMany({
      where: { ativo: true, ...(area ? { area: { equals: area, mode: "insensitive" as const } } : {}), ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}) },
      orderBy: { nome: "asc" }, skip, take,
      include: { instituicoes: { where: ofertaAtiva, include: { instituicao: true } } }
    });
  },
  buscarCurso(id: number) {
    return prisma.curso.findFirst({
      where: { id, ativo: true },
      include: { instituicoes: { where: ofertaAtiva, include: { instituicao: true } }, trilhas: { where: { cargo: { ativo: true } }, include: { cargo: true } } }
    });
  },
  listarInstituicoes(cidade?: string, busca?: string, skip = 0, take = 20) {
    return prisma.instituicao.findMany({
      where: { ativo: true, ...(cidade ? { cidade: { contains: cidade, mode: "insensitive" as const } } : {}), ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}) },
      orderBy: { nome: "asc" }, skip, take,
      include: { cursos: { where: ofertaAtiva, include: { curso: true } } }
    });
  },
  buscarInstituicao(id: number) {
    return prisma.instituicao.findFirst({
      where: { id, ativo: true },
      include: {
        cursos: { where: ofertaAtiva, include: { curso: true } },
        avaliacoes: { where: { status: "APROVADA" }, orderBy: { criadoEm: "desc" }, select: { id: true, nota: true, comentario: true, ano: true, criadoEm: true } }
      }
    });
  }
};
