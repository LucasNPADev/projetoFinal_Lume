import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { CargoInput, RotaInput, ListarCargosInput } from "../schemas/cargo";
import { ofertasDisponiveis } from "./ofertaService";
import { notificarFavoritos } from "./notificacaoService";
import { paginar } from "../utils/paginacao";
import { normalizar } from "../utils/geo";
import { env } from "../config/env";
type DB = Prisma.TransactionClient;
export const rotaInclude = {
  etapas: {
    orderBy: { ordem_etapa: "asc" as const },
    include: { curso: true },
  },
  cargo: { include: { fonte: true } },
} satisfies Prisma.RotaFormacaoInclude;
async function validarFonte(id: bigint, db: DB = prisma) {
  const f = await db.fonteDados.findUnique({ where: { id_fonte: id } });
  if (!f) throw new AppError("Fonte de dados não encontrada", 404);
  if (f.demonstracao && env.NODE_ENV === "production")
    throw new AppError(
      "Dados demonstrativos não podem ser publicados em produção",
      400,
    );
  return f;
}
export function validarSalarios(piso: number, media: number, teto: number) {
  if (piso > media || media > teto)
    throw new AppError(
      "Use salario_piso <= salario_media <= salario_teto",
      400,
    );
}
async function validarEtapas(etapas: RotaInput["etapas"], db: DB = prisma) {
  const cursos = await db.curso.findMany({
    where: { id_curso: { in: etapas.map((e) => e.id_curso) } },
  });
  if (cursos.length !== etapas.length)
    throw new AppError("Uma ou mais etapas usam curso inexistente", 404);
  if (cursos.some((c) => !c.status || !c.duracao_meses))
    throw new AppError(
      "Cada etapa exige curso ativo com duracao_meses cadastrada",
      400,
    );
}
async function criarRotaInterna(
  id: bigint,
  { etapas, ...dados }: RotaInput,
  db: DB,
) {
  await validarEtapas(etapas, db);
  return db.rotaFormacao.create({
    data: {
      ...dados,
      id_cargo: id,
      etapas: { create: etapas.map((e) => ({ ...e, id_cargo: id })) },
    },
    include: rotaInclude,
  });
}
async function bloquearCargo(id: bigint, db: DB) {
  // Serializa alterações nas rotas do mesmo cargo para proteger a última rota ativa.
  await db.$queryRaw`SELECT id_cargo FROM "Cargo" WHERE id_cargo = ${id} FOR UPDATE`;
}
export async function criarCargo(
  { rotas, ...dados }: CargoInput,
  idUsuario: bigint,
) {
  validarSalarios(dados.salario_piso, dados.salario_media, dados.salario_teto);
  if (!rotas.some((r) => r.status !== false))
    throw new AppError("O cargo deve ter pelo menos uma rota ativa", 400);
  return prisma.$transaction(async (tx) => {
    await validarFonte(dados.id_fonte, tx);
    const cargo = await tx.cargo.create({
      data: {
        ...dados,
        salario: Math.round(dados.salario_media),
        id_usuario_cadastrador: idUsuario,
      },
    });
    for (const rota of rotas) await criarRotaInterna(cargo.id_cargo, rota, tx);
    return tx.cargo.findUniqueOrThrow({
      where: { id_cargo: cargo.id_cargo },
      include: {
        fonte: true,
        rotas: {
          orderBy: { id_rota: "asc" },
          include: {
            etapas: {
              include: { curso: true },
              orderBy: { ordem_etapa: "asc" },
            },
          },
        },
      },
    });
  });
}
export async function criarRota(idCargo: bigint, dados: RotaInput) {
  if (!(await prisma.cargo.findUnique({ where: { id_cargo: idCargo } })))
    throw new AppError("Cargo não encontrado", 404);
  return prisma.$transaction((tx) => criarRotaInterna(idCargo, dados, tx));
}
export async function editarRota(id: bigint, dados: RotaInput) {
  return prisma.$transaction(async (tx) => {
    const rota = await tx.rotaFormacao.findUnique({
      where: { id_rota: id },
      include: { cargo: true },
    });
    if (!rota) throw new AppError("Rota não encontrada", 404);
    await bloquearCargo(rota.id_cargo, tx);
    if (
      dados.status === false &&
      rota.status &&
      rota.cargo.status &&
      (await tx.rotaFormacao.count({
        where: { id_cargo: rota.id_cargo, status: true },
      })) <= 1
    )
      throw new AppError(
        "Cadastre outra rota ativa ou arquive o cargo antes de desativar a última rota",
        400,
      );
    await validarEtapas(dados.etapas, tx);
    await tx.trilhaCargoCurso.deleteMany({ where: { id_rota: id } });
    const { etapas, ...rest } = dados;
    return tx.rotaFormacao.update({
      where: { id_rota: id },
      data: {
        ...rest,
        etapas: {
          create: etapas.map((e) => ({ ...e, id_cargo: rota.id_cargo })),
        },
      },
      include: rotaInclude,
    });
  });
}
export async function arquivarRota(id: bigint) {
  return prisma.$transaction(async (tx) => {
    const rota = await tx.rotaFormacao.findUnique({
      where: { id_rota: id },
      include: { cargo: true },
    });
    if (!rota) throw new AppError("Rota não encontrada", 404);
    await bloquearCargo(rota.id_cargo, tx);
    if (
      rota.status &&
      rota.cargo.status &&
      (await tx.rotaFormacao.count({
        where: { id_cargo: rota.id_cargo, status: true },
      })) <= 1
    )
      throw new AppError(
        "Não é possível arquivar a última rota de um cargo ativo",
        400,
      );
    return tx.rotaFormacao.update({
      where: { id_rota: id },
      data: { status: false },
    });
  });
}
export async function editarCargo(
  id: bigint,
  dados: Partial<Omit<CargoInput, "rotas">>,
) {
  const atual = await prisma.cargo.findUnique({
    where: { id_cargo: id },
    include: {
      rotas: {
        where: { status: true },
        orderBy: { id_rota: "asc" },
        include: { etapas: true },
      },
    },
  });
  if (!atual) throw new AppError("Cargo não encontrado", 404);
  validarSalarios(
    dados.salario_piso ?? Number(atual.salario_piso ?? 0),
    dados.salario_media ?? Number(atual.salario_media ?? atual.salario ?? 0),
    dados.salario_teto ?? Number(atual.salario_teto ?? atual.salario ?? 0),
  );
  if (dados.id_fonte) await validarFonte(dados.id_fonte);
  if (
    dados.status === true &&
    (!atual.rotas.some((r) => r.etapas.length) ||
      !(dados.id_fonte ?? atual.id_fonte))
  )
    throw new AppError("Cargo ativo exige fonte e rota com etapas", 400);
  const result = await prisma.cargo.update({
    where: { id_cargo: id },
    data: {
      ...dados,
      ...(dados.salario_media !== undefined && {
        salario: Math.round(dados.salario_media),
      }),
    },
    include: { fonte: true },
  });
  await notificarFavoritos(
    "Carreira atualizada",
    `${result.nome}: requisitos, competências ou estimativas atualizados.`,
    { OR: [{ id_cargo: id }, { rota: { id_cargo: id } }] },
    "CARGO",
    id,
  );
  return result;
}
export async function listarCargos(
  idUsuario: bigint,
  q: ListarCargosInput,
  admin: boolean,
) {
  if (q.incluir_inativos && !admin)
    throw new AppError("Filtro de inativos é restrito a administradores", 403);
  const where: Prisma.CargoWhereInput = {
    ...(!q.incluir_inativos && {
      status: true,
      rotas: { some: { status: true, etapas: { some: {} } } },
      id_fonte: { not: null },
    }),
    ...(q.busca && {
      OR: [
        { nome: { contains: q.busca, mode: "insensitive" } },
        { descricao: { contains: q.busca, mode: "insensitive" } },
      ],
    }),
    ...(q.area && { area_atuacao: { contains: q.area, mode: "insensitive" } }),
    ...((q.salario_min !== undefined || q.salario_max !== undefined) && {
      salario_media: { gte: q.salario_min, lte: q.salario_max },
    }),
  };
  const [cargos, teste] = await Promise.all([
    prisma.cargo.findMany({
      where,
      include: {
        fonte: true,
        rotas: {
          where: { status: true },
          include: {
            etapas: {
              include: { curso: true },
              orderBy: { ordem_etapa: "asc" },
            },
          },
        },
      },
    }),
    prisma.historicoTesteVocacional.findFirst({
      where: { id_usuario: idUsuario },
      orderBy: [{ data_realizada: "desc" }, { id_historico: "desc" }],
    }),
  ]);
  const areas =
    (
      teste?.pontuacao_detalhada as
        { areas?: { area: string; percentual: number }[] } | undefined
    )?.areas ?? [];
  const data = cargos.map((c) => ({
    ...c,
    afinidade:
      areas.find((a) => normalizar(a.area) === normalizar(c.area_atuacao))
        ?.percentual ?? null,
    rotas: c.rotas.map((r) => ({
      ...r,
      duracao_total_meses: r.etapas.some((e) => e.curso.duracao_meses === null)
        ? null
        : r.etapas.reduce((s, e) => s + (e.curso.duracao_meses ?? 0), 0),
    })),
  }));
  data.sort((a, b) =>
    q.ordenar === "nome"
      ? a.nome.localeCompare(b.nome)
      : q.ordenar === "salario"
        ? Number(a.salario_media ?? Infinity) -
            Number(b.salario_media ?? Infinity) || a.nome.localeCompare(b.nome)
        : (b.afinidade ?? -1) - (a.afinidade ?? -1) ||
          a.nome.localeCompare(b.nome),
  );
  return { ...paginar(data, q.page, q.limit), teste_realizado: Boolean(teste) };
}
export async function buscarCargo(
  id: bigint,
  idUsuario: bigint,
  admin: boolean,
) {
  const cargo = await prisma.cargo.findUnique({
    where: { id_cargo: id },
    include: {
      fonte: true,
      rotas: {
        where: admin ? {} : { status: true },
        orderBy: { id_rota: "asc" },
        include: {
          etapas: { include: { curso: true }, orderBy: { ordem_etapa: "asc" } },
        },
      },
    },
  });
  if (
    !cargo ||
    (!admin &&
      (!cargo.status ||
        !cargo.id_fonte ||
        !cargo.rotas.some((r) => r.etapas.length)))
  )
    throw new AppError("Cargo não encontrado ou indisponível", 404);
  const ofertas = await ofertasDisponiveis(
    idUsuario,
    {},
    { curso: { trilhas: { some: { id_cargo: id, rota: { status: true } } } } },
  );
  await prisma.consultaCargo.create({
    data: { id_usuario: idUsuario, id_cargo: id },
  });
  const rotas = cargo.rotas.map((r) => {
    const etapas = r.etapas.map((e) => {
      const disponiveis = ofertas.filter((o) => o.id_curso === e.id_curso);
      const valores = disponiveis
        .filter((o) => o.mensalidade !== null)
        .map((o) => Number(o.mensalidade))
        .filter(Number.isFinite);
      return {
        ...e,
        ofertas: disponiveis,
        disponibilidade: disponiveis.length
          ? "Disponível"
          : "Indisponível na Região",
        mensalidade_media: valores.length
          ? Math.round(
              (valores.reduce((a, b) => a + b, 0) / valores.length) * 100,
            ) / 100
          : null,
      };
    });
    return {
      ...r,
      etapas,
      duracao_total_meses: etapas.some((e) => e.curso.duracao_meses === null)
        ? null
        : etapas.reduce((s, e) => s + (e.curso.duracao_meses ?? 0), 0),
      custo_total_estimado: etapas.some(
        (e) => e.mensalidade_media === null || e.curso.duracao_meses === null,
      )
        ? null
        : Math.round(
            etapas.reduce(
              (s, e) => s + e.mensalidade_media! * (e.curso.duracao_meses ?? 0),
              0,
            ) * 100,
          ) / 100,
      orientativa: true,
    };
  });
  return { ...cargo, rotas };
}
export async function buscarRota(
  id: bigint,
  idUsuario: bigint,
  admin: boolean,
) {
  const rota = await prisma.rotaFormacao.findUnique({ where: { id_rota: id } });
  if (!rota || (!admin && !rota.status))
    throw new AppError("Rota não encontrada", 404);
  const cargo = await buscarCargo(rota.id_cargo, idUsuario, admin);
  return cargo.rotas.find((r) => r.id_rota === id)!;
}
