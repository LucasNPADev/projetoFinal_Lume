import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { CadastroInput } from "../schemas/usuario";
import { perfilPublico } from "../utils/perfil";
import { env } from "../config/env";
import { enviarRecuperacao } from "./emailService";
import { hashToken, novoToken } from "./sessionService";
export const perfilSelect = {
  id_usuario: true,
  nome: true,
  email: true,
  perfil: true,
  rua: true,
  cidade: true,
  estado: true,
  bairro: true,
  latitude: true,
  longitude: true,
  origem_localizacao: true,
  consentimento_gps: true,
  termos_aceitos_em: true,
  versao_termos: true,
  criado_em: true,
  atualizado_em: true,
} satisfies Prisma.UsuarioSelect;
export async function cadastrarUsuario({
  senha,
  aceitou_termos,
  ...dados
}: CadastroInput) {
  if (await prisma.usuario.findUnique({ where: { email: dados.email } }))
    throw new AppError("E-mail já cadastrado", 409);
  const usuario = await prisma.usuario.create({
    data: {
      ...dados,
      senha_hash: await bcrypt.hash(senha, 12),
      perfil: "usuario",
      termos_aceitos_em: new Date(),
      versao_termos: env.TERMS_VERSION,
    },
    select: perfilSelect,
  });
  return { ...usuario, perfil: perfilPublico(usuario.perfil) };
}
export async function meuPerfil(id: bigint) {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: id },
    select: perfilSelect,
  });
  if (!usuario) throw new AppError("Usuário não encontrado", 404);
  return { ...usuario, perfil: perfilPublico(usuario.perfil) };
}
export async function editarPerfil(
  id: bigint,
  dados: { nome?: string; email?: string },
) {
  const usuario = await prisma.usuario.update({
    where: { id_usuario: id },
    data: dados,
    select: perfilSelect,
  });
  return { ...usuario, perfil: perfilPublico(usuario.perfil) };
}
export async function localizacao(
  id: bigint,
  dados: Prisma.UsuarioUpdateInput,
) {
  // Retirar o consentimento GPS apaga a posição obtida pelo dispositivo.
  if (dados.consentimento_gps === false) {
    const atual = await prisma.usuario.findUniqueOrThrow({
      where: { id_usuario: id },
      select: { origem_localizacao: true },
    });
    if (
      atual.origem_localizacao === "GPS" &&
      dados.origem_localizacao !== "MANUAL"
    ) {
      dados.latitude = null;
      dados.longitude = null;
      dados.origem_localizacao = "MANUAL";
    }
  }
  if (dados.latitude !== undefined && dados.origem_localizacao === undefined) {
    dados.origem_localizacao = "MANUAL";
    dados.consentimento_gps = false;
  }
  const usuario = await prisma.usuario.update({
    where: { id_usuario: id },
    data: dados,
    select: perfilSelect,
  });
  return { ...usuario, perfil: perfilPublico(usuario.perfil) };
}
async function conferirSenha(id: bigint, senha: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id_usuario: id },
  });
  if (!(await bcrypt.compare(senha, usuario.senha_hash)))
    throw new AppError("Senha atual inválida", 401);
}
export async function alterarSenha(id: bigint, atual: string, nova: string) {
  await conferirSenha(id, atual);
  const senha_hash = await bcrypt.hash(nova, 12);
  await prisma.$transaction([
    prisma.usuario.update({ where: { id_usuario: id }, data: { senha_hash } }),
    prisma.sessao.updateMany({
      where: { id_usuario: id, revogada_em: null },
      data: { revogada_em: new Date() },
    }),
    prisma.recuperacaoSenha.updateMany({
      where: { id_usuario: id, usado_em: null },
      data: { usado_em: new Date() },
    }),
  ]);
}
export async function excluirConta(id: bigint, senha: string) {
  await conferirSenha(id, senha);
  await prisma.usuario.delete({ where: { id_usuario: id } });
}
export async function solicitarRecuperacao(email: string) {
  const mensagem =
    "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.";
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return { mensagem };
  const token = novoToken();
  await prisma.$transaction([
    prisma.recuperacaoSenha.updateMany({
      where: { id_usuario: usuario.id_usuario, usado_em: null },
      data: { usado_em: new Date() },
    }),
    prisma.recuperacaoSenha.create({
      data: {
        id_usuario: usuario.id_usuario,
        token_hash: hashToken(token),
        expira_em: new Date(Date.now() + 15 * 60000),
      },
    }),
  ]);
  try {
    await enviarRecuperacao(email, token);
  } catch {
    console.error("Falha ao enviar recuperação. Confira a configuração SMTP.");
  }
  // Apenas para teste local. Nenhum token é retornado em produção ou com SMTP.
  return {
    ...{ mensagem },
    ...(env.NODE_ENV !== "production" &&
      env.EMAIL_MODE === "console" && { token_desenvolvimento: token }),
  };
}
export async function redefinirSenha(token: string, nova: string) {
  const token_hash = hashToken(token),
    now = new Date(),
    senha_hash = await bcrypt.hash(nova, 12);
  await prisma.$transaction(async (tx) => {
    const registro = await tx.recuperacaoSenha.findUnique({
      where: { token_hash },
    });
    if (!registro || registro.usado_em || registro.expira_em <= now)
      throw new AppError("Token de recuperação inválido ou expirado", 400);
    const result = await tx.recuperacaoSenha.updateMany({
      where: {
        id_recuperacao: registro.id_recuperacao,
        usado_em: null,
        expira_em: { gt: now },
      },
      data: { usado_em: now },
    });
    if (!result.count)
      throw new AppError("Token de recuperação já utilizado", 400);
    await tx.usuario.update({
      where: { id_usuario: registro.id_usuario },
      data: { senha_hash },
    });
    await tx.sessao.updateMany({
      where: { id_usuario: registro.id_usuario, revogada_em: null },
      data: { revogada_em: now },
    });
    await tx.recuperacaoSenha.updateMany({
      where: { id_usuario: registro.id_usuario, usado_em: null },
      data: { usado_em: now },
    });
  });
}
export async function historico(id: bigint, page: number, limit: number) {
  const [cursos, cargos] = await Promise.all([
    prisma.consultaCurso.findMany({
      where: { id_usuario: id },
      include: { curso: true },
      orderBy: [{ data_consulta: "desc" }, { id_consulta: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.consultaCargo.findMany({
      where: { id_usuario: id },
      include: { cargo: { include: { fonte: true } } },
      orderBy: [{ data_consulta: "desc" }, { id_consulta: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { cursos, cargos, page, limit };
}
export async function exportarDados(id: bigint) {
  const [perfil, favoritos, avaliacoes, testes, denuncias, notificacoes] =
    await Promise.all([
      meuPerfil(id),
      prisma.favorito.findMany({ where: { id_usuario: id } }),
      prisma.avaliacao.findMany({ where: { id_usuario: id } }),
      prisma.historicoTesteVocacional.findMany({
        where: { id_usuario: id },
        orderBy: { data_realizada: "desc" },
      }),
      prisma.denuncia.findMany({ where: { id_usuario: id } }),
      prisma.notificacao.findMany({ where: { id_usuario: id } }),
    ]);
  const [cursos, cargos] = await Promise.all([
    prisma.consultaCurso.findMany({ where: { id_usuario: id } }),
    prisma.consultaCargo.findMany({ where: { id_usuario: id } }),
  ]);
  return {
    perfil,
    favoritos,
    avaliacoes,
    testes,
    consultas: { cursos, cargos },
    denuncias,
    notificacoes,
  };
}
