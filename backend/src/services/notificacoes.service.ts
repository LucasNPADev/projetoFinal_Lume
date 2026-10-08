import type { Prisma } from "@prisma/client";

type Transacao = Prisma.TransactionClient;

export async function avisarMudancaOferta(tx: Transacao, oferta: { cursoId: number; instituicaoId: number }) {
  const [porCurso, porInstituicao] = await Promise.all([
    tx.favoritoCurso.findMany({ where: { cursoId: oferta.cursoId }, select: { usuarioId: true } }),
    tx.favoritoInstituicao.findMany({ where: { instituicaoId: oferta.instituicaoId }, select: { usuarioId: true } })
  ]);
  const usuarios = [...new Set([...porCurso, ...porInstituicao].map((u) => u.usuarioId))];
  if (usuarios.length) {
    await tx.notificacao.createMany({ data: usuarios.map((usuarioId) => ({
      usuarioId, tipo: "OFERTA_ATUALIZADA",
      titulo: "Oferta de curso favoritado atualizada",
      mensagem: "Uma oferta de curso ou instituicao dos seus favoritos teve suas informacoes atualizadas. Verifique a ficha antes de tomar decisoes."
    })) });
  }
  return usuarios.length;
}

export async function avisarEventoIngresso(tx: Transacao, evento: { cursoId: number | null; instituicaoId: number | null; titulo: string }) {
  const [porCurso, porInstituicao] = await Promise.all([
    evento.cursoId ? tx.favoritoCurso.findMany({ where: { cursoId: evento.cursoId }, select: { usuarioId: true } }) : [],
    evento.instituicaoId ? tx.favoritoInstituicao.findMany({ where: { instituicaoId: evento.instituicaoId }, select: { usuarioId: true } }) : []
  ]);
  const usuarios = [...new Set([...porCurso, ...porInstituicao].map((u) => u.usuarioId))];
  if (usuarios.length) {
    await tx.notificacao.createMany({ data: usuarios.map((usuarioId) => ({
      usuarioId, tipo: "EVENTO_INGRESSO",
      titulo: "Novo evento de ingresso",
      mensagem: `Foi incluido o evento "${evento.titulo}" relacionado aos seus favoritos. Consulte a data e a fonte no calendario.`
    })) });
  }
  return usuarios.length;
}
