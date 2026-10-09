import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { normalizar } from "../utils/geo";
export async function perguntas(admin: boolean = false) {
  const data = await prisma.perguntaVocacional.findMany({
    where: admin ? {} : { status: true },
    orderBy: { id_pergunta: "asc" },
  });
  return {
    escala: [
      { valor: 1, rotulo: "Discordo totalmente" },
      { valor: 2, rotulo: "Discordo" },
      { valor: 3, rotulo: "Neutro" },
      { valor: 4, rotulo: "Concordo" },
      { valor: 5, rotulo: "Concordo totalmente" },
    ],
    perguntas: data,
  };
}
export function calcularAfinidades(
  perguntas: {
    id_pergunta: bigint;
    area_afinidade: string;
    enunciado: string;
  }[],
  respostas: { id_pergunta: bigint; valor: number }[],
) {
  if (perguntas.length === 0)
    throw new AppError("Questionário ainda não cadastrado", 409);
  const mapa = new Map(
    respostas.map((r) => [r.id_pergunta.toString(), r.valor]),
  );
  if (mapa.size !== respostas.length)
    throw new AppError("Há perguntas repetidas nas respostas", 400);
  if (
    mapa.size !== perguntas.length ||
    perguntas.some((p) => !mapa.has(p.id_pergunta.toString()))
  )
    throw new AppError(
      "Responda todas as perguntas ativas, sem IDs adicionais",
      400,
    );
  const areas = new Map<
    string,
    { area: string; pontos: number; quantidade: number }
  >();
  for (const p of perguntas) {
    const key = normalizar(p.area_afinidade),
      atual = areas.get(key) ?? {
        area: p.area_afinidade,
        pontos: 0,
        quantidade: 0,
      };
    atual.pontos += mapa.get(p.id_pergunta.toString())!;
    atual.quantidade++;
    areas.set(key, atual);
  }
  return {
    versao: 1,
    areas: [...areas.values()]
      .map((a) => ({
        ...a,
        percentual:
          Math.round(((a.pontos - a.quantidade) / (4 * a.quantidade)) * 10000) /
          100,
      }))
      .sort(
        (a, b) => b.percentual - a.percentual || a.area.localeCompare(b.area),
      ),
    respostas: perguntas.map((p) => ({
      id_pergunta: p.id_pergunta.toString(),
      enunciado: p.enunciado,
      area: p.area_afinidade,
      valor: mapa.get(p.id_pergunta.toString())!,
    })),
    orientacao:
      "Resultado orientativo de afinidades. Todas as áreas continuam acessíveis.",
  };
}
export async function responder(
  idUsuario: bigint,
  respostas: { id_pergunta: bigint; valor: number }[],
) {
  const ativas = await prisma.perguntaVocacional.findMany({
    where: { status: true },
    orderBy: { id_pergunta: "asc" },
  });
  const resultado = calcularAfinidades(ativas, respostas);
  // Último histórico passa a ser o resultado vigente. Os anteriores continuam somente para leitura.
  return prisma.historicoTesteVocacional.create({
    data: {
      id_usuario: idUsuario,
      pontuacao_detalhada: resultado as Prisma.InputJsonValue,
    },
  });
}
export async function historico(
  idUsuario: bigint,
  page: number,
  limit: number,
) {
  const where = { id_usuario: idUsuario };
  const [data, total] = await prisma.$transaction([
    prisma.historicoTesteVocacional.findMany({
      where,
      orderBy: [{ data_realizada: "desc" }, { id_historico: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.historicoTesteVocacional.count({ where }),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}
export async function resultado(idUsuario: bigint) {
  const atual = await prisma.historicoTesteVocacional.findFirst({
    where: { id_usuario: idUsuario },
    orderBy: [{ data_realizada: "desc" }, { id_historico: "desc" }],
  });
  if (!atual) throw new AppError("Você ainda não realizou o teste", 404);
  return atual;
}
