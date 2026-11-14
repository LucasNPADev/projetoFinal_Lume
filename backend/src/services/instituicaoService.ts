import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import {
  CriarInstituicaoInput,
  ListarInstituicoesInput,
} from "../schemas/instituicao";
import { distanciaKm, ordemRegiao, normalizar } from "../utils/geo";
import { paginar } from "../utils/paginacao";
import { notificarFavoritos } from "./notificacaoService";
export async function criarInstituicao(
  dados: CriarInstituicaoInput,
  idCadastrador: bigint,
) {
  return prisma.instituicao.create({
    data: { ...dados, id_usuario_cadastrador: idCadastrador },
  });
}
export async function listarInstituicoes(
  idUsuario: bigint,
  q: ListarInstituicoesInput,
  admin: boolean,
) {
  if (q.incluir_inativos && !admin)
    throw new AppError("Filtro de inativos é restrito a administradores", 403);
  const where: Prisma.InstituicaoWhereInput = {
    ...(!q.incluir_inativos && { status: true }),
    ...(q.busca && {
      nome_instituicao: { contains: q.busca, mode: "insensitive" },
    }),
  };
  const [usuario, raw] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: { latitude: true, longitude: true, cidade: true, estado: true },
    }),
    prisma.instituicao.findMany({ where }),
  ]);
  const local = {
    latitude: q.latitude ?? (usuario?.latitude == null
      ? null
      : Number(usuario.latitude)),
    longitude: q.longitude ?? (usuario?.longitude == null
      ? null
      : Number(usuario.longitude)),
    cidade: q.cidade ?? usuario?.cidade ?? "",
    estado: q.estado ?? usuario?.estado ?? "",
  };
  let data = raw.map((i) => {
    return {
      ...i,
      distancia_km:
        local.latitude !== null &&
        local.longitude !== null &&
        i.latitude !== null &&
        i.longitude !== null
          ? distanciaKm(
              local.latitude,
              local.longitude,
              Number(i.latitude),
              Number(i.longitude),
            )
          : null,
      prioridade_regional:
        normalizar(i.estado) === normalizar(local.estado)
          ? ordemRegiao(i.cidade, local.cidade)
          : 3,
    };
  });
  if (q.id_instituicao)
    data = data.filter((i) => i.id_instituicao === q.id_instituicao);
  if (q.cidade)
    data = data.filter((i) => normalizar(i.cidade) === normalizar(q.cidade));
  if (q.estado) data = data.filter((i) => i.estado === q.estado);
  if (q.raio_km !== undefined) {
    if (local.latitude === null || local.longitude === null)
      throw new AppError("Filtro por raio exige coordenadas", 400);
    data = data.filter(
      (i) => i.distancia_km !== null && i.distancia_km <= q.raio_km!,
    );
  }
  data.sort((a, b) => {
    const nome = a.nome_instituicao.localeCompare(b.nome_instituicao);
    if (q.ordenar === "nome") return nome;
    return (
      a.prioridade_regional - b.prioridade_regional ||
      (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity) ||
      nome
    );
  });
  return paginar(data, q.page, q.limit);
}
export async function buscarInstituicao(
  id: bigint,
  admin: boolean,
) {
  const instituicao = await prisma.instituicao.findUnique({
    where: { id_instituicao: id },
  });
  if (
    !instituicao ||
    (!admin && !instituicao.status)
  )
    throw new AppError("Instituição não encontrada ou indisponível", 404);
  const [ofertas, av] = await Promise.all([
    instituicao.regular_mec
      ? prisma.curso_Instituicao.findMany({
          where: {
            id_instituicao: id,
            status: true,
            curso: { status: true },
          },
          include: {
            curso: true,
            fonte_nota: true,
          },
          orderBy: { curso: { nome_curso: "asc" } },
        })
      : Promise.resolve([]),
    prisma.avaliacao.aggregate({
      where: { id_instituicao: id, status: "PUBLICADA" },
      _avg: { nota: true },
      _count: { id_avaliacao: true },
    }),
  ]);
  const celular = instituicao.celular?.replace(/\D/g, "");
  return {
    ...instituicao,
    ofertas,
    avaliacoes: { media: av._avg.nota, total: av._count.id_avaliacao },
    canais: {
      telefone: instituicao.telefone,
      whatsapp: celular
        ? `https://wa.me/${celular.startsWith("55") ? celular : "55" + celular}`
        : null,
      email: instituicao.email,
      site: instituicao.site,
    },
  };
}
export async function editarInstituicao(
  id: bigint,
  dados: Prisma.InstituicaoUpdateInput,
) {
  const atual = await prisma.instituicao.findUnique({
    where: { id_instituicao: id },
  });
  if (!atual) throw new AppError("Instituição não encontrada", 404);
  const result = await prisma.instituicao.update({
    where: { id_instituicao: id },
    data: dados,
  });
  await notificarFavoritos(
    "Instituição atualizada",
    `${result.nome_instituicao}: informações atualizadas.`,
    {
      id_instituicao: id,
    },
    "INSTITUICAO",
    id,
  );
  return result;
}
