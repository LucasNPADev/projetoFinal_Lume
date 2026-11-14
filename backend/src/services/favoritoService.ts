import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
export type TipoFavorito = "CARGO" | "CURSO" | "INSTITUICAO" | "ROTA";
export async function favoritar(
  idUsuario: bigint,
  tipo: TipoFavorito,
  id: bigint,
) {
  let existe = false;
  if (tipo === "CARGO")
    existe = !!(await prisma.cargo.findFirst({
      where: {
        id_cargo: id,
        status: true,
        id_fonte: { not: null },
        rotas: { some: { status: true, etapas: { some: {} } } },
      },
    }));
  if (tipo === "CURSO")
    existe = !!(await prisma.curso.findFirst({
      where: { id_curso: id, status: true },
    }));
  if (tipo === "INSTITUICAO")
    existe = !!(await prisma.instituicao.findFirst({
      where: { id_instituicao: id, status: true, regular_mec: true },
    }));
  if (tipo === "ROTA")
    existe = !!(await prisma.rotaFormacao.findFirst({
      where: {
        id_rota: id,
        status: true,
        cargo: { status: true, id_fonte: { not: null } },
        etapas: { some: {} },
      },
    }));
  if (!existe) throw new AppError("Item não encontrado ou indisponível", 404);
  const rel =
    tipo === "CARGO"
      ? { id_cargo: id }
      : tipo === "CURSO"
        ? { id_curso: id }
        : tipo === "INSTITUICAO"
          ? { id_instituicao: id }
          : { id_rota: id };
  return prisma.favorito.upsert({
    where: {
      id_usuario_tipo_alvo_id: { id_usuario: idUsuario, tipo, alvo_id: id },
    },
    update: {},
    create: { id_usuario: idUsuario, tipo, alvo_id: id, ...rel },
  });
}
export async function listar(idUsuario: bigint) {
  return prisma.favorito.findMany({
    where: { id_usuario: idUsuario },
    orderBy: { criado_em: "desc" },
    include: {
      cargo: { include: { fonte: true } },
      curso: true,
      instituicao: true,
      rota: {
        include: {
          cargo: { include: { fonte: true } },
          etapas: { include: { curso: true }, orderBy: { ordem_etapa: "asc" } },
        },
      },
    },
  });
}
export async function remover(id: bigint, idUsuario: bigint) {
  const result = await prisma.favorito.deleteMany({
    where: { id_favorito: id, id_usuario: idUsuario },
  });
  if (!result.count) throw new AppError("Favorito não encontrado", 404);
}
