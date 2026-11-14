import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
const autorSelect = {
  id_usuario: true,
  nome: true,
} satisfies Prisma.UsuarioSelect;
export async function criar(
  idUsuario: bigint,
  dados: {
    id_instituicao: bigint;
    id_curso?: bigint;
    nota: number;
    comentario: string;
  },
) {
  const i = await prisma.instituicao.findFirst({
    where: {
      id_instituicao: dados.id_instituicao,
      status: true,
      regular_mec: true,
    },
  });
  if (!i) throw new AppError("Instituição não disponível", 404);
  if (
    dados.id_curso &&
    !(await prisma.curso_Instituicao.findFirst({
      where: {
        id_instituicao: dados.id_instituicao,
        id_curso: dados.id_curso,
        status: true,
        curso: { status: true },
      },
    }))
  )
    throw new AppError("O curso não tem oferta ativa nesta instituição", 400);
  return prisma.avaliacao.create({
    data: { ...dados, id_usuario: idUsuario },
    include: { usuario: { select: autorSelect } },
  });
}
export async function listar(
  q: {
    id_instituicao?: bigint;
    id_curso?: bigint;
    page: number;
    limit: number;
    todas: boolean;
  },
  admin: boolean,
) {
  if (q.todas && !admin)
    throw new AppError("Moderação é restrita a administradores", 403);
  const where: Prisma.AvaliacaoWhereInput = {
    ...(!q.todas && {
      status: "PUBLICADA",
      instituicao: { status: true, regular_mec: true },
      OR: [{ id_curso: null }, { curso: { status: true } }],
    }),
    ...(q.id_instituicao && { id_instituicao: q.id_instituicao }),
    ...(q.id_curso && { id_curso: q.id_curso }),
  };
  const [data, total, media] = await prisma.$transaction([
    prisma.avaliacao.findMany({
      where,
      include: { usuario: { select: autorSelect } },
      orderBy: [{ data_publicacao: "desc" }, { id_avaliacao: "desc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.avaliacao.count({ where }),
    prisma.avaliacao.aggregate({ where, _avg: { nota: true } }),
  ]);
  return {
    data,
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit),
    media: media._avg.nota,
  };
}
export async function editar(
  id: bigint,
  idUsuario: bigint,
  dados: { nota?: number; comentario?: string },
) {
  const av = await prisma.avaliacao.findUnique({ where: { id_avaliacao: id } });
  if (!av || av.id_usuario !== idUsuario)
    throw new AppError("Avaliação não encontrada", 404);
  if (av.status !== "PUBLICADA")
    throw new AppError("Avaliação moderada: contate a administração", 403);
  return prisma.avaliacao.update({ where: { id_avaliacao: id }, data: dados });
}
export async function excluir(id: bigint, idUsuario: bigint, admin: boolean) {
  const result = await prisma.avaliacao.deleteMany({
    where: { id_avaliacao: id, ...(!admin && { id_usuario: idUsuario }) },
  });
  if (!result.count) throw new AppError("Avaliação não encontrada", 404);
}
export async function denunciar(id: bigint, idUsuario: bigint, motivo: string) {
  const av = await prisma.avaliacao.findFirst({
    where: {
      id_avaliacao: id,
      status: "PUBLICADA",
      instituicao: { status: true, regular_mec: true },
    },
  });
  if (!av) throw new AppError("Avaliação não encontrada", 404);
  if (av.id_usuario === idUsuario)
    throw new AppError("Você não pode denunciar sua própria avaliação", 400);
  return prisma.denuncia.create({
    data: { id_avaliacao: id, id_usuario: idUsuario, motivo },
  });
}
export async function moderar(id: bigint, status: string, motivo: string) {
  return prisma.avaliacao.update({
    where: { id_avaliacao: id },
    data: { status, motivo_moderacao: motivo },
  });
}
