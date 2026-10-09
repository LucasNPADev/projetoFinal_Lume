import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { CriarCursoInput, ListarCursosInput } from "../schemas/curso";
import { ofertasDisponiveis, whereOfertaAtiva } from "./ofertaService";
import { notificarFavoritos } from "./notificacaoService";
import { paginar } from "../utils/paginacao";
export async function criarCurso(
  dados: CriarCursoInput,
  idCadastrador: bigint,
) {
  return prisma.curso.create({
    data: { ...dados, id_usuario_cadastrador: idCadastrador },
  });
}
export async function listarCursos(
  q: ListarCursosInput,
  idUsuario: bigint,
  admin: boolean,
) {
  if (q.incluir_inativos && !admin)
    throw new AppError("Filtro de inativos é restrito a administradores", 403);
  const where: Prisma.CursoWhereInput = {
    ...(!q.incluir_inativos && { status: true }),
    ...(q.busca && { nome_curso: { contains: q.busca, mode: "insensitive" } }),
    ...(q.area && { area_curso: { contains: q.area, mode: "insensitive" } }),
    ...(q.modalidade && { modalidade: q.modalidade }),
    ...(q.id_cargo && {
      trilhas: {
        some: {
          id_cargo: q.id_cargo,
          rota: { status: true, cargo: { status: true } },
        },
      },
    }),
    ...(q.id_curso && { id_curso: q.id_curso }),
    ...(!admin && { ofertas: { some: whereOfertaAtiva } }),
  };
  const [cursos, ofertas] = await Promise.all([
    prisma.curso.findMany({ where }),
    ofertasDisponiveis(idUsuario, q),
  ]);
  const exigeOferta =
    !admin ||
    q.id_instituicao !== undefined ||
    q.preco_max !== undefined ||
    q.raio_km !== undefined;
  const data = cursos
    .map((curso) => {
      const disponiveis = ofertas.filter((o) => o.id_curso === curso.id_curso);
      const valores = disponiveis
        .filter((o) => o.mensalidade !== null)
        .map((o) => Number(o.mensalidade));
      const distancias = disponiveis
        .filter((o) => o.distancia_km !== null)
        .map((o) => o.distancia_km!);
      const notas = disponiveis
        .filter((o) => o.nota_corte !== null)
        .map((o) => Number(o.nota_corte));
      return {
        ...curso,
        ofertas_disponiveis: disponiveis.length,
        mensalidade_minima: valores.length ? Math.min(...valores) : null,
        distancia_km: distancias.length ? Math.min(...distancias) : null,
        nota_corte_minima: notas.length ? Math.min(...notas) : null,
        prioridade_regional: disponiveis.length
          ? Math.min(...disponiveis.map((o) => o.prioridade_regional))
          : 4,
        disponibilidade: disponiveis.length
          ? "Disponível"
          : "Indisponível na Região",
      };
    })
    .filter((c) => !exigeOferta || c.ofertas_disponiveis > 0);
  data.sort((a, b) => {
    const nome = a.nome_curso.localeCompare(b.nome_curso);
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
export async function buscarCurso(
  id: bigint,
  idUsuario: bigint,
  admin = false,
) {
  const curso = await prisma.curso.findUnique({
    where: { id_curso: id },
    include: {
      trilhas: {
        where: { rota: { status: true, cargo: { status: true } } },
        include: { cargo: { include: { fonte: true } } },
      },
    },
  });
  if (!curso || (!admin && !curso.status))
    throw new AppError("Curso não encontrado ou indisponível", 404);
  const [ofertas, av] = await Promise.all([
    ofertasDisponiveis(idUsuario, {}, { id_curso: id }),
    prisma.avaliacao.aggregate({
      where: { id_curso: id, status: "PUBLICADA" },
      _avg: { nota: true },
      _count: { id_avaliacao: true },
    }),
  ]);
  await prisma.consultaCurso.create({
    data: { id_usuario: idUsuario, id_curso: id },
  });
  const cargos = [
    ...new Map(
      curso.trilhas.map((t) => [t.cargo.id_cargo.toString(), t.cargo]),
    ).values(),
  ];
  return {
    ...curso,
    cargos,
    ofertas,
    disponibilidade: ofertas.length ? "Disponível" : "Indisponível na Região",
    avaliacoes: { media: av._avg.nota, total: av._count.id_avaliacao },
  };
}
export async function editarCurso(id: bigint, dados: Prisma.CursoUpdateInput) {
  const result = await prisma.curso.update({
    where: { id_curso: id },
    data: dados,
  });
  await notificarFavoritos(
    "Curso atualizado",
    `${result.nome_curso}: informações ou disponibilidade atualizadas.`,
    {
      OR: [{ id_curso: id }, { rota: { etapas: { some: { id_curso: id } } } }],
    },
    "CURSO",
    id,
  );
  return result;
}
