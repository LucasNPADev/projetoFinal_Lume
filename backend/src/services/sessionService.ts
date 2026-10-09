import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { Usuario } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import { LoginInput } from "../schemas/usuario";
import { perfilPublico } from "../utils/perfil";
export const hashToken = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export const novoToken = () => randomBytes(32).toString("hex");
function resposta(usuario: Usuario, idSessao: string, refreshToken: string) {
  const token = jwt.sign(
    { perfil: perfilPublico(usuario.perfil), sid: idSessao },
    env.JWT_SECRET,
    {
      subject: usuario.id_usuario.toString(),
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      algorithm: "HS256",
      issuer: "lume-api",
      audience: "lume-client",
    },
  );
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  return {
    id: usuario.id_usuario.toString(),
    nome: usuario.nome,
    email: usuario.email,
    perfil: perfilPublico(usuario.perfil),
    token,
    refresh_token: refreshToken,
    expires_in: decoded.exp! - decoded.iat!,
    token_type: "Bearer",
  };
}
export async function autenticar({ email, senha }: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash)))
    throw new AppError("E-mail ou senha inválidos", 401);
  const refresh = novoToken();
  const sessao = await prisma.sessao.create({
    data: {
      id_usuario: usuario.id_usuario,
      refresh_hash: hashToken(refresh),
      expira_em: new Date(Date.now() + env.REFRESH_DAYS * 86400000),
    },
  });
  return resposta(usuario, sessao.id_sessao, refresh);
}
export async function renovar(refreshToken: string) {
  const atual = hashToken(refreshToken),
    novo = novoToken(),
    now = new Date();
  return prisma.$transaction(async (tx) => {
    const sessao = await tx.sessao.findUnique({
      where: { refresh_hash: atual },
      include: { usuario: true },
    });
    if (!sessao || sessao.revogada_em || sessao.expira_em <= now)
      throw new AppError("Refresh token inválido ou expirado", 401);
    const mudou = await tx.sessao.updateMany({
      where: {
        id_sessao: sessao.id_sessao,
        refresh_hash: atual,
        revogada_em: null,
        expira_em: { gt: now },
      },
      data: { refresh_hash: hashToken(novo) },
    });
    if (!mudou.count) throw new AppError("Refresh token já utilizado", 401);
    return resposta(sessao.usuario, sessao.id_sessao, novo);
  });
}
export async function sair(idSessao: string) {
  await prisma.sessao.updateMany({
    where: { id_sessao: idSessao, revogada_em: null },
    data: { revogada_em: new Date() },
  });
}
