import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
export async function notificarFavoritos(
  titulo: string,
  mensagem: string,
  filtro: Prisma.FavoritoWhereInput,
  tipo: string,
  alvo: bigint,
) {
  const favoritos = await prisma.favorito.findMany({
    where: filtro,
    select: { id_usuario: true },
    distinct: ["id_usuario"],
  });
  if (favoritos.length)
    await prisma.notificacao.createMany({
      data: favoritos.map((f) => ({
        id_usuario: f.id_usuario,
        titulo,
        mensagem,
        tipo,
        alvo_id: alvo,
      })),
    });
}
export async function listar(idUsuario: bigint, page: number, limit: number) {
  const where = { id_usuario: idUsuario };
  const [data, total, nao_lidas] = await prisma.$transaction([
    prisma.notificacao.findMany({
      where,
      orderBy: { criado_em: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notificacao.count({ where }),
    prisma.notificacao.count({ where: { ...where, lida_em: null } }),
  ]);
  return {
    data,
    page,
    limit,
    total,
    nao_lidas,
    totalPages: Math.ceil(total / limit),
  };
}
export async function ler(id: bigint, idUsuario: bigint) {
  const result = await prisma.notificacao.updateMany({
    where: { id_notificacao: id, id_usuario: idUsuario },
    data: { lida_em: new Date() },
  });
  return result.count;
}
export async function remover(id: bigint, idUsuario: bigint) {
  return (
    await prisma.notificacao.deleteMany({
      where: { id_notificacao: id, id_usuario: idUsuario },
    })
  ).count;
}
