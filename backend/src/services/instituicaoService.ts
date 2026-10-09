import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import {
  CriarInstituicaoInput,
  VincularCursoInput,
} from "../schemas/instituicao";
import { BuscaCatalogo } from "../schemas/comum";
import {
  contextoLocal,
  ofertasDisponiveis,
  ofertaInclude,
} from "./ofertaService";
import { distanciaKm, ordemRegiao, normalizar } from "../utils/geo";
import { paginar } from "../utils/paginacao";
import { notificarFavoritos } from "./notificacaoService";
import { env } from "../config/env";
export async function criarInstituicao(
  dados: CriarInstituicaoInput,
  idCadastrador: bigint,
) {
  return prisma.instituicao.create({
    data: { ...dados, id_usuario_cadastrador: idCadastrador },
  });
}
export async function listarInstituicoes(
  idUsuario: bigint,
  q: BuscaCatalogo,
  admin: boolean,
) {
  if (q.incluir_inativos && !admin)
    throw new AppError("Filtro de inativos é restrito a administradores", 403);
  const where: Prisma.InstituicaoWhereInput = {
    ...(!q.incluir_inativos && { status: true, regular_mec: true }),
    ...(q.busca && {
      nome_instituicao: { contains: q.busca, mode: "insensitive" },
    }),
  };
  const [raw, local, ofertas] = await Promise.all([
    prisma.instituicao.findMany({ where }),
    contextoLocal(idUsuario, q),
    ofertasDisponiveis(idUsuario, q),
  ]);
  let data = raw.map((i) => {
    const disponiveis = ofertas.filter(
      (o) => o.id_instituicao === i.id_instituicao,
    );
    const valores = disponiveis
      .filter((o) => o.mensalidade !== null)
      .map((o) => Number(o.mensalidade));
    const notas = disponiveis
      .filter((o) => o.nota_corte !== null)
      .map((o) => Number(o.nota_corte));
    return {
      ...i,
      mensalidade_minima: valores.length ? Math.min(...valores) : null,
      nota_corte_minima: notas.length ? Math.min(...notas) : null,
      ofertas_disponiveis: disponiveis.length,
      distancia_km:
        local.latitude !== null &&
        local.longitude !== null &&
        i.latitude !== null &&
        i.longitude !== null
          ? distanciaKm(
              local.latitude,
              local.longitude,
              Number(i.latitude),
              Number(i.longitude),
            )
          : null,
      prioridade_regional:
        normalizar(i.estado) === normalizar(local.estado)
          ? ordemRegiao(i.cidade, local.cidade)
          : 3,
    };
  });
  if (
    q.area ||
    q.modalidade ||
    q.id_curso ||
    q.id_cargo ||
    q.preco_max !== undefined
  )
    data = data.filter((i) => i.ofertas_disponiveis > 0);
  if (q.id_instituicao)
    data = data.filter((i) => i.id_instituicao === q.id_instituicao);
  if (q.cidade)
    data = data.filter((i) => normalizar(i.cidade) === normalizar(q.cidade));
  if (q.estado) data = data.filter((i) => i.estado === q.estado);
  if (q.raio_km !== undefined) {
    if (local.latitude === null || local.longitude === null)
      throw new AppError("Filtro por raio exige coordenadas", 400);
    data = data.filter(
      (i) => i.distancia_km !== null && i.distancia_km <= q.raio_km!,
    );
  }
  data.sort((a, b) => {
    const nome = a.nome_instituicao.localeCompare(b.nome_instituicao);
    if (q.ordenar === "nome") return nome;
    if (q.ordenar === "mensalidade")
      return (
        (a.mensalidade_minima ?? Infinity) -
          (b.mensalidade_minima ?? Infinity) || nome
      );
    if (q.ordenar === "nota_corte")
      return (
        (a.nota_corte_minima ?? Infinity) - (b.nota_corte_minima ?? Infinity) ||
        nome
      );
    return (
      a.prioridade_regional - b.prioridade_regional ||
      (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity) ||
      nome
    );
  });
  return paginar(data, q.page, q.limit);
}
export async function buscarInstituicao(
  id: bigint,
  idUsuario: bigint,
  admin: boolean,
) {
  const instituicao = await prisma.instituicao.findUnique({
    where: { id_instituicao: id },
  });
  if (
    !instituicao ||
    (!admin && (!instituicao.status || !instituicao.regular_mec))
  )
    throw new AppError("Instituição não encontrada ou indisponível", 404);
  const [ofertas, av] = await Promise.all([
    ofertasDisponiveis(idUsuario, {}, { id_instituicao: id }),
    prisma.avaliacao.aggregate({
      where: { id_instituicao: id, status: "PUBLICADA" },
      _avg: { nota: true },
      _count: { id_avaliacao: true },
    }),
  ]);
  const celular = instituicao.celular?.replace(/\D/g, "");
  return {
    ...instituicao,
    ofertas,
    avaliacoes: { media: av._avg.nota, total: av._count.id_avaliacao },
    canais: {
      telefone: instituicao.telefone,
      whatsapp: celular
        ? `https://wa.me/${celular.startsWith("55") ? celular : "55" + celular}`
        : null,
      email: instituicao.email,
      site: instituicao.site,
    },
  };
}
export async function editarInstituicao(
  id: bigint,
  dados: Prisma.InstituicaoUpdateInput,
) {
  const atual = await prisma.instituicao.findUnique({
    where: { id_instituicao: id },
  });
  if (!atual) throw new AppError("Instituição não encontrada", 404);
  if (
    dados.natureza === "PUBLICA" &&
    (await prisma.curso_Instituicao.count({
      where: {
        id_instituicao: id,
        OR: [{ mensalidade: { gt: 0 } }, { mensalidade_max: { gt: 0 } }],
      },
    }))
  )
    throw new AppError(
      "Zere as mensalidades antes de classificar a instituição como pública",
      400,
    );
  const result = await prisma.instituicao.update({
    where: { id_instituicao: id },
    data: dados,
  });
  await notificarFavoritos(
    "Instituição atualizada",
    `${result.nome_instituicao}: informações atualizadas.`,
    {
      OR: [
        { id_instituicao: id },
        { curso: { ofertas: { some: { id_instituicao: id } } } },
        {
          rota: {
            etapas: {
              some: { curso: { ofertas: { some: { id_instituicao: id } } } },
            },
          },
        },
      ],
    },
    "INSTITUICAO",
    id,
  );
  return result;
}
async function validarOferta(
  idInstituicao: bigint,
  dados: Omit<VincularCursoInput, "programa_nota_corte" | "polo_estado"> & {
    programa_nota_corte?: string | null;
    polo_estado?: string | null;
  },
) {
  const [i, c] = await Promise.all([
    prisma.instituicao.findUnique({ where: { id_instituicao: idInstituicao } }),
    prisma.curso.findUnique({ where: { id_curso: dados.id_curso } }),
  ]);
  if (!i || !c) throw new AppError("Instituição ou curso não encontrado", 404);
  if ((dados.status ?? true) && (!i.status || !i.regular_mec || !c.status))
    throw new AppError(
      "Ative o curso e uma instituição regular antes de disponibilizar a oferta",
      400,
    );
  if (
    i.natureza === "PUBLICA" &&
    (dados.mensalidade !== 0 || (dados.mensalidade_max ?? 0) !== 0)
  )
    throw new AppError("Instituições públicas devem ter mensalidade zero", 400);
  if (
    dados.mensalidade_max != null &&
    dados.mensalidade_max < dados.mensalidade
  )
    throw new AppError("Mensalidade máxima menor que a mínima", 400);
  const nota = [
    dados.nota_corte,
    dados.ano_nota_corte,
    dados.programa_nota_corte,
    dados.id_fonte_nota,
  ];
  if (nota.some((v) => v != null) && !nota.every((v) => v != null))
    throw new AppError(
      "Informe nota_corte, ano_nota_corte, programa_nota_corte e id_fonte_nota juntos",
      400,
    );
  if (dados.id_fonte_nota != null) {
    const f = await prisma.fonteDados.findUnique({
      where: { id_fonte: dados.id_fonte_nota },
    });
    if (!f) throw new AppError("Fonte da nota não encontrada", 404);
    if (env.NODE_ENV === "production" && f.demonstracao)
      throw new AppError(
        "Fonte demonstrativa não pode ser usada em produção",
        400,
      );
  }
  if (
    c.modalidade === "EAD" &&
    (!dados.polo_nome || !dados.polo_cidade || !dados.polo_estado)
  )
    throw new AppError(
      "Oferta EAD exige polo_nome, polo_cidade e polo_estado",
      400,
    );
  if ((dados.polo_latitude == null) !== (dados.polo_longitude == null))
    throw new AppError("Informe as duas coordenadas do polo", 400);
}
export async function vincularCurso(
  idInstituicao: bigint,
  dados: VincularCursoInput,
) {
  await validarOferta(idInstituicao, dados);
  return prisma.curso_Instituicao.create({
    data: { ...dados, id_instituicao: idInstituicao },
    include: ofertaInclude,
  });
}
export async function editarOferta(
  id: bigint,
  dados: Partial<Omit<VincularCursoInput, "id_curso">>,
) {
  const atual = await prisma.curso_Instituicao.findUnique({
    where: { id_curso_instituicao: id },
  });
  if (!atual) throw new AppError("Oferta não encontrada", 404);
  const merged = {
    ...atual,
    mensalidade: Number(atual.mensalidade ?? 0),
    mensalidade_max:
      atual.mensalidade_max === null ? null : Number(atual.mensalidade_max),
    nota_corte: atual.nota_corte === null ? null : Number(atual.nota_corte),
    polo_latitude:
      atual.polo_latitude === null ? null : Number(atual.polo_latitude),
    polo_longitude:
      atual.polo_longitude === null ? null : Number(atual.polo_longitude),
    formas_ingresso: atual.formas_ingresso ?? "",
    ...dados,
  };
  await validarOferta(atual.id_instituicao, merged);
  const result = await prisma.curso_Instituicao.update({
    where: { id_curso_instituicao: id },
    data: dados,
    include: ofertaInclude,
  });
  await notificarFavoritos(
    "Oferta de curso atualizada",
    `${result.curso.nome_curso} em ${result.instituicao.nome_instituicao}: valores, bolsas ou disponibilidade alterados.`,
    {
      OR: [
        { id_curso: result.id_curso },
        { id_instituicao: result.id_instituicao },
        { rota: { etapas: { some: { id_curso: result.id_curso } } } },
      ],
    },
    "OFERTA",
    id,
  );
  return result;
}
