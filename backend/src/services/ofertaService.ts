import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { BuscaCatalogo } from "../schemas/comum";
import { distanciaKm, normalizar, ordemRegiao } from "../utils/geo";
import { paginar } from "../utils/paginacao";
import { AppError } from "../utils/AppError";
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
  const u = await prisma.usuario.findUniqueOrThrow({
    where: { id_usuario: id },
    select: { cidade: true, estado: true, latitude: true, longitude: true },
  });
  return {
    cidade: filtros.cidade ?? u.cidade ?? "São Bernardo do Campo",
    estado: filtros.estado ?? u.estado ?? "SP",
    latitude:
      filtros.latitude ?? (u.latitude === null ? null : Number(u.latitude)),
    longitude:
      filtros.longitude ?? (u.longitude === null ? null : Number(u.longitude)),
  };
}
export type Local = Awaited<ReturnType<typeof contextoLocal>>;
export function enriquecerOferta(o: OfertaCompleta, local: Local) {
  const ead = o.curso.modalidade === "EAD",
    polo = ead || o.polo_cidade != null;
  const cidade = polo ? o.polo_cidade : o.instituicao.cidade,
    estado = polo ? o.polo_estado : o.instituicao.estado;
  const lat = polo ? o.polo_latitude : o.instituicao.latitude,
    lng = polo ? o.polo_longitude : o.instituicao.longitude;
  const distancia =
    lat !== null &&
    lng !== null &&
    local.latitude !== null &&
    local.longitude !== null
      ? distanciaKm(local.latitude, local.longitude, Number(lat), Number(lng))
      : null;
  return {
    ...o,
    local_oferta: {
      cidade,
      estado,
      rua: polo ? o.polo_rua : o.instituicao.rua,
      bairro: polo ? o.polo_bairro : o.instituicao.bairro,
      latitude: lat,
      longitude: lng,
      polo_nome: o.polo_nome,
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
      o.nota_corte !== null &&
      o.ano_nota_corte !== null &&
      o.fonte_nota !== null,
    demonstracao: o.fonte_nota?.demonstracao ?? false,
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
        Number(a.mensalidade ?? Infinity) - Number(b.mensalidade ?? Infinity) ||
        a.curso.nome_curso.localeCompare(b.curso.nome_curso)
      );
    if (ordenar === "nota_corte")
      return (
        Number(a.nota_corte ?? Infinity) - Number(b.nota_corte ?? Infinity) ||
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
  q: Partial<BuscaCatalogo> = {},
  extra: Prisma.Curso_InstituicaoWhereInput = {},
) {
  const local = await contextoLocal(idUsuario, q);
  if (
    q.raio_km !== undefined &&
    (local.latitude === null || local.longitude === null)
  )
    throw new AppError("Filtro por raio exige latitude e longitude", 400);
  const raw = await prisma.curso_Instituicao.findMany({
    where: {
      AND: [
        whereOfertaAtiva,
        extra,
        ...(q.id_curso ? [{ id_curso: q.id_curso }] : []),
        ...(q.id_instituicao ? [{ id_instituicao: q.id_instituicao }] : []),
        ...(q.id_cargo
          ? [
              {
                curso: {
                  trilhas: {
                    some: {
                      id_cargo: q.id_cargo,
                      rota: { status: true, cargo: { status: true } },
                    },
                  },
                },
              },
            ]
          : []),
        ...(q.modalidade ? [{ curso: { modalidade: q.modalidade } }] : []),
        ...(q.area
          ? [
              {
                curso: {
                  area_curso: {
                    contains: q.area,
                    mode: "insensitive" as const,
                  },
                },
              },
            ]
          : []),
        ...(q.busca
          ? [
              {
                OR: [
                  {
                    curso: {
                      nome_curso: {
                        contains: q.busca,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                  {
                    instituicao: {
                      nome_instituicao: {
                        contains: q.busca,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ],
              },
            ]
          : []),
        ...(q.preco_max !== undefined
          ? [{ mensalidade: { lte: q.preco_max } }]
          : []),
      ],
    },
    include: ofertaInclude,
  });
  let data = raw
    .map((o) => enriquecerOferta(o, local))
    .filter((o) => o.disponivel_na_regiao);
  if (q.raio_km !== undefined)
    data = data.filter(
      (o) => o.distancia_km !== null && o.distancia_km <= q.raio_km!,
    );
  return ordenarOfertas(data, q.ordenar);
}
export async function listarOfertas(idUsuario: bigint, q: BuscaCatalogo) {
  return paginar(await ofertasDisponiveis(idUsuario, q), q.page, q.limit);
}
