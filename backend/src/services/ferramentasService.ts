import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { buscarCurso } from "./cursoService";
import { buscarInstituicao } from "./instituicaoService";
import {
  ofertasDisponiveis,
  ofertaInclude,
  enriquecerOferta,
  contextoLocal,
} from "./ofertaService";
export async function comparar(
  idUsuario: bigint,
  tipo: "CURSO" | "INSTITUICAO" | "OFERTA",
  ids: bigint[],
) {
  if (tipo === "CURSO") {
    const itens = await Promise.all(
      ids.map((id) => buscarCurso(id, idUsuario, false)),
    );
    return {
      tipo,
      itens: itens.map((c) => {
        const valores = c.ofertas.filter((o) => o.mensalidade !== null);
        return {
          ...c,
          mensalidade_minima: valores.length
            ? Math.min(...valores.map((o) => Number(o.mensalidade)))
            : null,
          mensalidade_maxima: valores.length
            ? Math.max(
                ...valores.map((o) =>
                  Number(o.mensalidade_max ?? o.mensalidade),
                ),
              )
            : null,
        };
      }),
    };
  }
  if (tipo === "INSTITUICAO")
    return {
      tipo,
      itens: await Promise.all(
        ids.map((id) => buscarInstituicao(id, idUsuario, false)),
      ),
    };
  const ofertas = await ofertasDisponiveis(
    idUsuario,
    {},
    { id_curso_instituicao: { in: ids } },
  );
  if (ofertas.length !== ids.length)
    throw new AppError(
      "Uma ou mais ofertas estão indisponíveis na região",
      404,
    );
  return {
    tipo,
    itens: ids.map((id) => ofertas.find((o) => o.id_curso_instituicao === id)!),
  };
}
export async function simular(
  idUsuario: bigint,
  dados: { nota: number; programa?: string; cidade?: string; estado?: string },
) {
  const ofertas = await ofertasDisponiveis(
    idUsuario,
    { cidade: dados.cidade, estado: dados.estado as "SP" | undefined },
    {
      ...(dados.programa && { programa_nota_corte: dados.programa }),
      nota_corte: { not: null },
      ano_nota_corte: { not: null },
      id_fonte_nota: { not: null },
    },
  );
  return {
    nota_informada: dados.nota,
    aviso:
      "Comparação com a nota de corte cadastrada. Não garante aprovação, bolsa nem financiamento; pesos, cotas e edição do processo seletivo podem alterar o resultado.",
    resultados: ofertas.map((o) => ({
      ...o,
      nota_referencia: Number(o.nota_corte),
      diferenca: Math.round((dados.nota - Number(o.nota_corte)) * 100) / 100,
      elegivel_estimado: dados.nota >= Number(o.nota_corte),
    })),
  };
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
    include: {
      curso: { include: { ofertas: { select: { id_instituicao: true } } } },
      rota: {
        include: {
          etapas: {
            include: {
              curso: {
                include: { ofertas: { select: { id_instituicao: true } } },
              },
            },
          },
        },
      },
    },
  });
  const ids = new Set<bigint>();
  for (const f of favoritos) {
    if (f.id_instituicao) ids.add(f.id_instituicao);
    for (const o of f.curso?.ofertas ?? []) ids.add(o.id_instituicao);
    for (const etapa of f.rota?.etapas ?? [])
      for (const o of etapa.curso.ofertas) ids.add(o.id_instituicao);
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
      where: { id_cargo: { in: consultasCargo.map((c) => c.id_cargo) } },
      select: { id_cargo: true, nome: true },
    }),
    prisma.curso.findMany({
      where: {
        id_curso: {
          in: [
            ...consultasCurso.map((c) => c.id_curso),
            ...favoritosCurso.map((c) => c.alvo_id),
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
    cargos_mais_consultados: consultasCargo.map((c) => ({
      id_cargo: c.id_cargo,
      nome: nomesCargos.find((n) => n.id_cargo === c.id_cargo)?.nome,
      consultas: c._count.id_consulta,
    })),
    cursos_mais_consultados: consultasCurso.map((c) => ({
      id_curso: c.id_curso,
      nome_curso: nomesCursos.find((n) => n.id_curso === c.id_curso)
        ?.nome_curso,
      consultas: c._count.id_consulta,
    })),
    cursos_mais_favoritados: favoritosCurso.map((c) => ({
      id_curso: c.alvo_id,
      nome_curso: nomesCursos.find((n) => n.id_curso === c.alvo_id)?.nome_curso,
      favoritos: c._count.id_favorito,
    })),
  };
}
