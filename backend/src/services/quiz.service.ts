import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errors";

const area = z.enum(["Tecnologia", "Saúde", "Humanas", "Gestão"]);
export const opcaoSchema = z.object({
  texto: z.string().trim().min(1).max(255),
  pesos: z.record(area, z.number().int().min(0).max(5)).refine((v) => Object.keys(v).length > 0, "Opcao precisa de pesos"),
}).strict();
export const opcoesSchema = z.array(opcaoSchema).min(2).max(6);
export const respostasSchema = z.array(z.object({
  perguntaId: z.number().int().positive().safe(),
  opcaoIndex: z.number().int().min(0).max(5)
}).strict()).min(1).max(100);

export type PerguntaQuiz = { id: number; pergunta: string; categoria: string; ordem: number; opcoes: unknown };
export type RespostaQuiz = z.infer<typeof respostasSchema>[number];

export function pontuarQuiz(perguntas: PerguntaQuiz[], respostas: RespostaQuiz[]) {
  if (!perguntas.length) throw new ApiError(503, "Questionario indisponivel.");
  const respostaPorPergunta = new Map<number, RespostaQuiz>();
  for (const resposta of respostas) {
    if (respostaPorPergunta.has(resposta.perguntaId)) throw new ApiError(400, "Pergunta respondida mais de uma vez.");
    respostaPorPergunta.set(resposta.perguntaId, resposta);
  }
  if (perguntas.length !== respostas.length) throw new ApiError(400, "Responda todas as perguntas ativas.");
  const pontos = new Map<string, number>();
  for (const pergunta of perguntas) {
    const resposta = respostaPorPergunta.get(pergunta.id);
    if (!resposta) throw new ApiError(400, "Pergunta ausente ou resposta desconhecida.");
    const validacao = opcoesSchema.safeParse(pergunta.opcoes);
    if (!validacao.success) throw new ApiError(503, "Instrumento de quiz invalido. Execute o seed validado.");
    const opcao = validacao.data[resposta.opcaoIndex];
    if (!opcao) throw new ApiError(400, "Alternativa fora do intervalo.");
    for (const [nome, peso] of Object.entries(opcao.pesos)) pontos.set(nome, (pontos.get(nome) ?? 0) + peso);
  }
  const ranking = [...pontos.entries()].map(([area, pontuacao]) => ({ area, pontuacao })).sort((a, b) => b.pontuacao - a.pontuacao || a.area.localeCompare(b.area, "pt-BR"));
  if (!ranking.length || ranking[0].pontuacao === 0) throw new ApiError(400, "Nao foi possivel calcular afinidade com estas respostas.");
  return { resultadoArea: ranking[0].area, ranking };
}

export const quizService = {
  async perguntasAtivas() {
    return prisma.perguntaVocacional.findMany({ where: { ativo: true }, orderBy: [{ ordem: "asc" }, { id: "asc" }] });
  },
  async listarPerguntas() {
    const perguntas = await this.perguntasAtivas();
    return perguntas.map(({ id, pergunta, categoria, ordem, opcoes }) => {
      const parsed = opcoesSchema.safeParse(opcoes);
      if (!parsed.success) throw new ApiError(503, "Instrumento vocacional requer atualizacao do seed.");
      return { id, pergunta, categoria, ordem, opcoes: parsed.data.map((v) => v.texto) };
    });
  },
  async registrarResultado(respostas: RespostaQuiz[], usuarioId?: number) {
    const perguntas = await this.perguntasAtivas();
    const result = pontuarQuiz(perguntas, respostas);
    const cargos = await prisma.cargo.findMany({
      where: { ativo: true, area: result.resultadoArea, trilhas: { some: { curso: { ativo: true } } } },
      orderBy: [{ altaDemanda: "desc" }, { nome: "asc" }], take: 10,
      select: { id: true, nome: true, area: true, salarioMedio: true }
    });
    const version = process.env.QUIZ_VERSION ?? "2026-10-v1";
    const historico = usuarioId ? await prisma.historicoTesteVocacional.create({
      data: {
        usuarioId, resultadoArea: result.resultadoArea,
        respostas: respostas.map((r) => {
          const pergunta = perguntas.find((p) => p.id === r.perguntaId)!;
          const opcao = opcoesSchema.parse(pergunta.opcoes)[r.opcaoIndex];
          return { perguntaId: pergunta.id, enunciado: pergunta.pergunta, opcaoIndex: r.opcaoIndex, textoOpcao: opcao.texto, pesosAplicados: opcao.pesos };
        }) as unknown as Prisma.InputJsonValue,
        pontuacoes: result.ranking as unknown as Prisma.InputJsonValue,
        versaoInstrumento: version
      },
      select: { id: true, respondidoEm: true }
    }) : null;
    return { ...result, versaoInstrumento: version, historico, cargosRecomendados: cargos, aviso: "Questionario exploratorio, sem validacao psicometrica; nao elimina areas nem substitui orientacao profissional." };
  },
  historico(usuarioId: number) {
    return prisma.historicoTesteVocacional.findMany({
      where: { usuarioId }, orderBy: { respondidoEm: "desc" }, take: 50,
      select: { id: true, resultadoArea: true, pontuacoes: true, versaoInstrumento: true, respondidoEm: true }
    });
  }
};
