import { prisma } from "../config/prisma";

export const avaliacaoService = {
  listar: (instituicaoId: number) =>
    prisma.avaliacao.findMany({
      where: { instituicaoId },
      orderBy: { dataPublicacao: "desc" },
      include: { usuario: { select: { nomeCompleto: true } } },
    }),

  criar: (data: {
    usuarioId: number;
    instituicaoId: number;
    comentario?: string;
  }) =>
    prisma.avaliacao.create({
      data: {
        usuarioId: data.usuarioId,
        instituicaoId: data.instituicaoId,
        comentario: data.comentario,
      },
    }),
};
