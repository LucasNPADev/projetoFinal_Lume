import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { buscarCurso } from "./cursoService";
import { buscarCargo } from "./cargoService";
import { buscarInstituicao } from "./instituicaoService";

export async function comparar(
  idUsuario: bigint,
  tipo: "CURSO" | "CARGO" | "INSTITUICAO",
  ids: bigint[],
) {
  if (tipo === "CURSO") {
    return {
      tipo,
      itens: await Promise.all(
        ids.map((id) => buscarCurso(id, idUsuario, false)),
      ),
    };
  }

  if (tipo === "CARGO") {
    return {
      tipo,
      itens: await Promise.all(
        ids.map((id) => buscarCargo(id, idUsuario, false)),
      ),
    };
  }

  if (tipo === "INSTITUICAO") {
    return {
      tipo,
      itens: await Promise.all(ids.map((id) => buscarInstituicao(id, false))),
    };
  }

  throw new AppError("Tipo de comparação inválido", 400);
}

export async function validarEvento(dados: {
  id_instituicao?: bigint | null;
  inicio?: Date;
  fim?: Date | null;
}) {
  if (dados.inicio && dados.fim && dados.fim < dados.inicio)
    throw new AppError("fim deve ser igual ou posterior a inicio", 400);
  if (
    dados.id_instituicao &&
    !(await prisma.instituicao.findUnique({
      where: { id_instituicao: dados.id_instituicao },
    }))
  )
    throw new AppError("Instituição não encontrada", 404);
}

export async function calendario(
  idUsuario: bigint,
  q: { inicio?: Date; fim?: Date; favoritos: boolean },
) {
  if (q.inicio && q.fim && q.fim < q.inicio)
    throw new AppError("Intervalo de calendário inválido", 400);
  const favoritos = await prisma.favorito.findMany({
    where: { id_usuario: idUsuario },
    select: { id_instituicao: true },
  });
  const ids = new Set<bigint>();
  for (const favorito of favoritos) {
    if (favorito.id_instituicao) ids.add(favorito.id_instituicao);
  }
  const inicio = q.inicio ?? new Date();
  const intervalo: Prisma.EventoWhereInput = {
    AND: [
      {
        OR: [{ fim: { gte: inicio } }, { fim: null, inicio: { gte: inicio } }],
      },
      ...(q.fim ? [{ inicio: { lte: q.fim } }] : []),
    ],
  };
  return prisma.evento.findMany({
    where: {
      status: true,
      ...intervalo,
      AND: [
        ...(intervalo.AND as Prisma.EventoWhereInput[]),
        {
          OR: [
            { id_instituicao: null },
            { instituicao: { status: true, regular_mec: true } },
          ],
        },
        ...(q.favoritos
          ? [
              {
                OR: [
                  { id_instituicao: null },
                  { id_instituicao: { in: [...ids] } },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { inicio: "asc" },
    include: {
      instituicao: { select: { id_instituicao: true, nome_instituicao: true } },
    },
  });
}

export async function relatorio() {
  const [
    usuarios,
    cursos,
    cargos,
    instituicoes,
    testes,
    favoritos,
    consultasCargo,
    consultasCurso,
    favoritosCurso,
    denuncias,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.curso.count(),
    prisma.cargo.count(),
    prisma.instituicao.count(),
    prisma.historicoTesteVocacional.count(),
    prisma.favorito.count(),
    prisma.consultaCargo.groupBy({
      by: ["id_cargo"],
      _count: { id_consulta: true },
      orderBy: { _count: { id_consulta: "desc" } },
      take: 10,
    }),
    prisma.consultaCurso.groupBy({
      by: ["id_curso"],
      _count: { id_consulta: true },
      orderBy: { _count: { id_consulta: "desc" } },
      take: 10,
    }),
    prisma.favorito.groupBy({
      by: ["alvo_id"],
      where: { tipo: "CURSO" },
      _count: { id_favorito: true },
      orderBy: { _count: { id_favorito: "desc" } },
      take: 10,
    }),
    prisma.denuncia.count({ where: { status: "ABERTA" } }),
  ]);
  const [nomesCargos, nomesCursos] = await Promise.all([
    prisma.cargo.findMany({
      where: { id_cargo: { in: consultasCargo.map((cargo) => cargo.id_cargo) } },
      select: { id_cargo: true, nome: true },
    }),
    prisma.curso.findMany({
      where: {
        id_curso: {
          in: [
            ...consultasCurso.map((curso) => curso.id_curso),
            ...favoritosCurso.map((curso) => curso.alvo_id),
          ],
        },
      },
      select: { id_curso: true, nome_curso: true },
    }),
  ]);
  return {
    totais: {
      usuarios,
      cursos,
      cargos,
      instituicoes,
      testes,
      favoritos,
      denuncias_abertas: denuncias,
    },
    cargos_mais_consultados: consultasCargo.map((cargo) => ({
      id_cargo: cargo.id_cargo,
      nome: nomesCargos.find((nome) => nome.id_cargo === cargo.id_cargo)?.nome,
      consultas: cargo._count.id_consulta,
    })),
    cursos_mais_consultados: consultasCurso.map((curso) => ({
      id_curso: curso.id_curso,
      nome_curso: nomesCursos.find((nome) => nome.id_curso === curso.id_curso)
        ?.nome_curso,
      consultas: curso._count.id_consulta,
    })),
    cursos_mais_favoritados: favoritosCurso.map((curso) => ({
      id_curso: curso.alvo_id,
      nome_curso: nomesCursos.find((nome) => nome.id_curso === curso.alvo_id)
        ?.nome_curso,
      favoritos: curso._count.id_favorito,
    })),
  };
}