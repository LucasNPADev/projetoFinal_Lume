import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { normalizar } from "../utils/geo";
 
export const ESCALA = [
  { valor: 1, rotulo: "Discordo totalmente" },
  { valor: 2, rotulo: "Discordo" },
  { valor: 3, rotulo: "Neutro" },
  { valor: 4, rotulo: "Concordo" },
  { valor: 5, rotulo: "Concordo totalmente" },
];
 
// Usuário comum NÃO vê a área de afinidade de cada pergunta (evita "escolher" o resultado).
// O administrador continua vendo todos os campos e as perguntas inativas.
export async function perguntas(admin: boolean = false) {
  const data = await prisma.perguntaVocacional.findMany({
    where: admin ? {} : { status: true },
    orderBy: { id_pergunta: "asc" },
    ...(!admin && { select: { id_pergunta: true, enunciado: true } }),
  });
  return { escala: ESCALA, perguntas: data };
}
 
// Função pura (não acessa o banco): fácil de testar.
// Formato de "areas" lido também pelo cargoService (area e percentual).
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
 
  // Mensagens específicas: qual pergunta é inválida e quantas faltam.
  const ativas = new Set(perguntas.map((p) => p.id_pergunta.toString()));
  for (const id of mapa.keys())
    if (!ativas.has(id))
      throw new AppError(`A pergunta ${id} não existe ou está inativa`, 400);
  const faltando = perguntas.filter((p) => !mapa.has(p.id_pergunta.toString()));
  if (faltando.length)
    throw new AppError(
      `Faltam ${faltando.length} pergunta(s) para concluir o teste`,
      400,
    );
 
  // Soma os pontos por área (normalizar ignora maiúsculas e acentos ao agrupar).
  const grupos = new Map<
    string,
    { area: string; pontos: number; quantidade: number }
  >();
  for (const p of perguntas) {
    const key = normalizar(p.area_afinidade);
    const atual = grupos.get(key) ?? {
      area: p.area_afinidade.trim(),
      pontos: 0,
      quantidade: 0,
    };
    atual.pontos += mapa.get(p.id_pergunta.toString())!;
    atual.quantidade++;
    grupos.set(key, atual);
  }
 
  // Percentual de 0% (todas as respostas 1) a 100% (todas 5), por área.
  const areas = [...grupos.values()]
    .map((a) => ({
      ...a,
      percentual:
        Math.round(((a.pontos - a.quantidade) / (4 * a.quantidade)) * 10000) /
        100,
    }))
    .sort((a, b) => b.percentual - a.percentual || a.area.localeCompare(b.area));
 
  const vencedora = areas[0];
  const empate =
    areas.length > 1 && areas[1].percentual === vencedora.percentual;
 
  return {
    versao: 1,
    area_maior_afinidade: vencedora.area,
    empate,
    areas,
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