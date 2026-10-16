import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { CriarCursoInput, ListarCursosInput } from "../schemas/curso";
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
  };
  const data = await prisma.curso.findMany({ where });
  data.sort((a, b) => {
    return a.nome_curso.localeCompare(b.nome_curso);
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
  const av = await prisma.avaliacao.aggregate({
    where: { id_curso: id, status: "PUBLICADA" },
    _avg: { nota: true },
    _count: { id_avaliacao: true },
  });
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
