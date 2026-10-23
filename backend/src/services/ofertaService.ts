import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { BuscaCatalogo } from "../schemas/comum";
import { CriarOfertaInput } from "../schemas/oferta";
import { AppError } from "../utils/AppError";
import { distanciaKm, normalizar, ordemRegiao } from "../utils/geo";
import { paginar } from "../utils/paginacao";
import { env } from "../config/env";

export const ofertaInclude = {
  curso: true,
  instituicao: true,
  fonte_nota: true,
} satisfies Prisma.Curso_InstituicaoInclude;

export type OfertaCompleta = Prisma.Curso_InstituicaoGetPayload<{
  include: typeof ofertaInclude;
}>;

export async function contextoLocal(
  id: bigint,
  filtros: Partial<BuscaCatalogo> = {},
) {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id_usuario: id },
    select: { cidade: true, estado: true, latitude: true, longitude: true },
  });
  return {
    cidade: filtros.cidade ?? usuario.cidade ?? "São Bernardo do Campo",
    estado: filtros.estado ?? usuario.estado ?? "SP",
    latitude:
      filtros.latitude ??
      (usuario.latitude === null ? null : Number(usuario.latitude)),
    longitude:
      filtros.longitude ??
      (usuario.longitude === null ? null : Number(usuario.longitude)),
  };
}

export type Local = Awaited<ReturnType<typeof contextoLocal>>;

export function enriquecerOferta(oferta: OfertaCompleta, local: Local) {
  const ead = oferta.curso.modalidade === "EAD";
  const usarPolo = ead || oferta.polo_cidade !== null;
  const cidade = usarPolo ? oferta.polo_cidade : oferta.instituicao.cidade;
  const estado = usarPolo ? oferta.polo_estado : oferta.instituicao.estado;
  const latitude = usarPolo
    ? oferta.polo_latitude
    : oferta.instituicao.latitude;
  const longitude = usarPolo
    ? oferta.polo_longitude
    : oferta.instituicao.longitude;
  const distancia =
    latitude !== null &&
    longitude !== null &&
    local.latitude !== null &&
    local.longitude !== null
      ? distanciaKm(
          local.latitude,
          local.longitude,
          Number(latitude),
          Number(longitude),
        )
      : null;

  return {
    ...oferta,
    local_oferta: {
      cidade,
      estado,
      rua: usarPolo ? oferta.polo_rua : oferta.instituicao.rua,
      bairro: usarPolo ? oferta.polo_bairro : oferta.instituicao.bairro,
      latitude,
      longitude,
      polo_nome: oferta.polo_nome,
    },
    distancia_km: distancia,
    tipo_distancia: "LINHA_RETA",
    prioridade_regional:
      normalizar(estado) === normalizar(local.estado)
        ? ordemRegiao(cidade, local.cidade)
        : 3,
    disponivel_na_regiao:
      !ead ||
      (normalizar(cidade) === normalizar(local.cidade) &&
        normalizar(estado) === normalizar(local.estado)),
    nota_corte_disponivel:
      oferta.nota_corte !== null &&
      oferta.ano_nota_corte !== null &&
      oferta.fonte_nota !== null,
    demonstracao: oferta.fonte_nota?.demonstracao ?? false,
  };
}

export const whereOfertaAtiva: Prisma.Curso_InstituicaoWhereInput = {
  status: true,
  curso: { status: true },
  instituicao: { status: true, regular_mec: true },
};

export function ordenarOfertas(
  data: ReturnType<typeof enriquecerOferta>[],
  ordenar = "distancia",
) {
  return data.sort((a, b) => {
    if (ordenar === "mensalidade")
      return (
        Number(a.mensalidade ?? Infinity) -
          Number(b.mensalidade ?? Infinity) ||
        a.curso.nome_curso.localeCompare(b.curso.nome_curso)
      );
    if (ordenar === "nota_corte")
      return (
        Number(a.nota_corte ?? Infinity) -
          Number(b.nota_corte ?? Infinity) ||
        a.curso.nome_curso.localeCompare(b.curso.nome_curso)
      );
    if (ordenar === "nome")
      return (
        a.curso.nome_curso.localeCompare(b.curso.nome_curso) ||
        a.instituicao.nome_instituicao.localeCompare(
          b.instituicao.nome_instituicao,
        )
      );
    return (
      a.prioridade_regional - b.prioridade_regional ||
      (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity) ||
      a.curso.nome_curso.localeCompare(b.curso.nome_curso)
    );
  });
}

export async function ofertasDisponiveis(
  idUsuario: bigint,
  filtros: Partial<BuscaCatalogo> = {},
  extra: Prisma.Curso_InstituicaoWhereInput = {},
) {
  const local = await contextoLocal(idUsuario, filtros);
  if (
    filtros.raio_km !== undefined &&
    (local.latitude === null || local.longitude === null)
  )
    throw new AppError("Filtro por raio exige latitude e longitude", 400);

  const raw = await prisma.curso_Instituicao.findMany({
    where: {
      AND: [
        whereOfertaAtiva,
        extra,
        ...(filtros.id_curso ? [{ id_curso: filtros.id_curso }] : []),
        ...(filtros.id_instituicao
          ? [{ id_instituicao: filtros.id_instituicao }]
          : []),
        ...(filtros.id_cargo
          ? [
              {
                curso: {
                  trilhas: {
                    some: {
                      id_cargo: filtros.id_cargo,
                      rota: { status: true, cargo: { status: true } },
                    },
                  },
                },
              },
            ]
          : []),
        ...(filtros.modalidade
          ? [{ curso: { modalidade: filtros.modalidade } }]
          : []),
        ...(filtros.area
          ? [
              {
                curso: {
                  area_curso: {
                    contains: filtros.area,
                    mode: "insensitive" as const,
                  },
                },
              },
            ]
          : []),
        ...(filtros.busca
          ? [
              {
                OR: [
                  {
                    curso: {
                      nome_curso: {
                        contains: filtros.busca,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                  {
                    instituicao: {
                      nome_instituicao: {
                        contains: filtros.busca,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ],
              },
            ]
          : []),
        ...(filtros.preco_max !== undefined
          ? [{ mensalidade: { lte: filtros.preco_max } }]
          : []),
      ],
    },
    include: ofertaInclude,
  });
  let data = raw
    .map((oferta) => enriquecerOferta(oferta, local))
    .filter((oferta) => oferta.disponivel_na_regiao);
  if (filtros.raio_km !== undefined)
    data = data.filter(
      (oferta) =>
        oferta.distancia_km !== null &&
        oferta.distancia_km <= filtros.raio_km!,
    );
  return ordenarOfertas(data, filtros.ordenar);
}

export async function listarOfertas(idUsuario: bigint, filtros: BuscaCatalogo) {
  return paginar(await ofertasDisponiveis(idUsuario, filtros), filtros.page, filtros.limit);
}

export async function criarOferta(dados: CriarOfertaInput) {
  const [instituicao, curso] = await Promise.all([
    prisma.instituicao.findUnique({
      where: { id_instituicao: dados.id_instituicao },
    }),
    prisma.curso.findUnique({ where: { id_curso: dados.id_curso } }),
  ]);
  if (!instituicao || !curso)
    throw new AppError("Instituição ou curso não encontrado", 404);
  if (
    (dados.status ?? true) &&
    (!instituicao.status || !instituicao.regular_mec || !curso.status)
  )
    throw new AppError(
      "Ative o curso e uma instituição regular antes de publicar a oferta",
      400,
    );
  if (
    instituicao.natureza === "PUBLICA" &&
    (dados.mensalidade !== 0 || (dados.mensalidade_max ?? 0) !== 0)
  )
    throw new AppError("Instituições públicas devem ter mensalidade zero", 400);
  if (
    curso.modalidade === "EAD" &&
    (!dados.polo_nome || !dados.polo_cidade || !dados.polo_estado)
  )
    throw new AppError(
      "Curso EAD exige nome, cidade e estado do polo",
      400,
    );
  if (dados.id_fonte_nota != null) {
    const fonte = await prisma.fonteDados.findUnique({
      where: { id_fonte: dados.id_fonte_nota },
    });
    if (!fonte) throw new AppError("Fonte da nota não encontrada", 404);
    if (env.NODE_ENV === "production" && fonte.demonstracao)
      throw new AppError(
        "Fonte demonstrativa não pode ser usada em produção",
        400,
      );
  }

  return prisma.curso_Instituicao.create({
    data: dados,
    include: ofertaInclude,
  });
}
