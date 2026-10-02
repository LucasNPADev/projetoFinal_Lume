import { prisma } from "../config/prisma";

export const quizService = {
  listarPerguntas: () => prisma.perguntaVocacional.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
  registrarResultado: (usuarioId: number, resultadoArea: string, respostas: unknown) =>
    prisma.historicoTesteVocacional.create({
      data: { usuarioId, resultadoArea, respostas: respostas as object },
    }),
};