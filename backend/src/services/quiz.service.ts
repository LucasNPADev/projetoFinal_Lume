import { prisma } from "../config/prisma";

type Resposta = { perguntaId: number; opcaoIndex: number };

type Opcao = {
  texto: string;
  area: string;
  peso: number;
};

const opcoesPorPergunta: Record<number, Opcao[]> = {
  1: [
    { texto: "Analisando dados e lógica", area: "Tecnologia", peso: 1 },
    { texto: "Ajudando e cuidando de pessoas", area: "Saúde", peso: 1 },
    { texto: "Comunicando e argumentando", area: "Humanas", peso: 1 },
  ],
  2: [
    { texto: "Programar e construir soluções", area: "Tecnologia", peso: 1 },
    { texto: "Cuidar, orientar e observar", area: "Saúde", peso: 1 },
    { texto: "Escrever, apresentar e negociar", area: "Humanas", peso: 1 },
  ],
  3: [
    { texto: "Criar uma solução técnica", area: "Tecnologia", peso: 1 },
    { texto: "Atender necessidades de pessoas", area: "Saúde", peso: 1 },
    { texto: "Pesquisar, interpretar e defender ideias", area: "Humanas", peso: 1 },
  ],
};

export const quizService = {
  listarPerguntas: async () => {
    const perguntas = await prisma.perguntaVocacional.findMany({
      orderBy: { id: "asc" },
    });

    return perguntas.map((pergunta) => ({
      id: pergunta.id,
      pergunta: pergunta.enunciado,
      areaAfinidade: pergunta.areaAfinidade,
      opcoes: opcoesPorPergunta[pergunta.id] ?? [],
    }));
  },

  calcularResultado: async (respostas: Resposta[], usuarioId?: number) => {
    const perguntas = await prisma.perguntaVocacional.findMany({
      where: { id: { in: respostas.map((resposta) => resposta.perguntaId) } },
    });

    const pontos = new Map<string, number>();

    for (const resposta of respostas) {
      const pergunta = perguntas.find((item) => item.id === resposta.perguntaId);
      if (!pergunta) continue;

      const opcao = opcoesPorPergunta[pergunta.id]?.[resposta.opcaoIndex];
      if (!opcao) continue;

      pontos.set(opcao.area, (pontos.get(opcao.area) ?? 0) + opcao.peso);
    }

    const ranking = [...pontos.entries()].sort((a, b) => b[1] - a[1]);
    const resultadoArea = ranking[0]?.[0] ?? "Exploração geral";

    const cursosRecomendados = await prisma.curso.findMany({
      where: { area: resultadoArea },
      orderBy: { nome: "asc" },
      take: 6,
    });

    const pontuacaoDetalhada = JSON.stringify({
      respostas,
      ranking: ranking.map(([area, pontosArea]) => ({ area, pontos: pontosArea })),
      resultadoArea,
    });

    const historico = usuarioId
      ? await prisma.historicoTesteVocacional.create({
          data: {
            usuarioId,
            pontuacaoDetalhada,
          },
        })
      : null;

    return {
      resultadoArea,
      ranking: ranking.map(([area, pontosArea]) => ({
        area,
        pontos: pontosArea,
      })),
      cursosRecomendados,
      historico,
    };
  },

  buscarUltimoResultado: (usuarioId: number) =>
    prisma.historicoTesteVocacional.findFirst({
      where: { usuarioId },
      orderBy: { dataRealizada: "desc" },
    }),
};
