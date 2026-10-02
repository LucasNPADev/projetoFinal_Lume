import { prisma } from "../config/prisma";

export const avaliacaoService = {
  listar: (instituicaoId: number) => prisma.avaliacao.findMany({
    where: { instituicaoId }, orderBy: { criadoEm: "desc" },
    include: { usuario: { select: { nomeCompleto: true } } },
  }),
  criar: (data: { usuarioId: number; instituicaoId: number; nota: number; comentario?: string; ano?: number }) =>
    prisma.avaliacao.create({ data }),
};
