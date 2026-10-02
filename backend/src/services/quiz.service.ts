import { prisma } from "../config/prisma";

type Opcao = { texto: string; area: string; peso?: number };
type Resposta = { perguntaId: number; opcaoIndex: number };

export const quizService = {
  listarPerguntas: async () => {
    const perguntas = await prisma.perguntaVocacional.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } });
    return perguntas.map((p) => ({ id: p.id, pergunta: p.pergunta, categoria: p.categoria, opcoes: p.opcoes }));
  },
  calcularResultado: async (respostas: Resposta[], usuarioId?: number) => {
    const perguntas = await prisma.perguntaVocacional.findMany({ where: { id: { in: respostas.map((r) => r.perguntaId) }, ativo: true } });
    const pontos = new Map<string, number>();
    for (const resposta of respostas) {
      const pergunta = perguntas.find((p) => p.id === resposta.perguntaId);
      if (!pergunta || !Array.isArray(pergunta.opcoes)) continue;
      const opcoes = pergunta.opcoes as unknown as Opcao[];
      const opcao = opcoes[resposta.opcaoIndex];
      if (!opcao?.area) continue;
      pontos.set(opcao.area, (pontos.get(opcao.area) ?? 0) + (opcao.peso ?? 1));
    }
    const ranking = [...pontos.entries()].sort((a, b) => b[1] - a[1]);
    const resultadoArea = ranking[0]?.[0] ?? "Exploração geral";
    const recomendados = await prisma.curso.findMany({ where: { ativo: true, area: resultadoArea }, orderBy: { nome: "asc" }, take: 6 });
    let historico = null;
    if (usuarioId) historico = await prisma.historicoTesteVocacional.create({ data: { usuarioId, resultadoArea, respostas: respostas as object } });
    return { resultadoArea, ranking: ranking.map(([area, pontos]) => ({ area, pontos })), cursosRecomendados: recomendados, historico };
  },
  buscarUltimoResultado: (usuarioId: number) => prisma.historicoTesteVocacional.findFirst({ where: { usuarioId }, orderBy: { respondidoEm: "desc" } }),
};
