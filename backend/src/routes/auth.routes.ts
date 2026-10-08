import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errors";
import { email, senha, texto, uf } from "../utils/validation";
import { emitirSessao, hashOpaque, lerRefreshCookie, limparCookieRefresh, renovarSessao, requireAuth, requireUser } from "../middlewares/auth";
import { enviarEmailRecuperacao, smtpConfigurado } from "../services/email.service";

export const authRoutes = Router();
const cadastro = z.object({
  nomeCompleto: texto(150), email, senha,
  cidade: texto(120).optional(), estado: uf.optional()
}).strict();
const loginSchema = z.object({ email, senha: z.string().min(1).max(200) }).strict();

authRoutes.post("/cadastro", async (req, res) => {
  const data = cadastro.parse(req.body);
  if (await prisma.usuario.findUnique({ where: { email: data.email }, select: { id: true } })) throw new ApiError(409, "E-mail ja cadastrado.");
  const senhaHash = await bcrypt.hash(data.senha, 12);
  const user = await prisma.usuario.create({ data: {
    nomeCompleto: data.nomeCompleto, email: data.email, senhaHash, cidade: data.cidade, estado: data.estado
  }, select: { id: true, nomeCompleto: true, email: true } });
  const sessao = await emitirSessao(user.id, "USER", res);
  res.status(201).json({ usuario: user, ...sessao });
});
authRoutes.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.senha, user.senhaHash))) throw new ApiError(401, "Credenciais invalidas.");
  res.json({ usuario: { id: user.id, nomeCompleto: user.nomeCompleto, email: user.email }, ...(await emitirSessao(user.id, "USER", res)) });
});
authRoutes.post("/admin/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email: data.email } });
  if (!admin || !admin.ativo || !(await bcrypt.compare(data.senha, admin.senhaHash))) throw new ApiError(401, "Credenciais invalidas.");
  res.json({ administrador: { id: admin.id, nome: admin.nome, email: admin.email }, ...(await emitirSessao(admin.id, "ADMIN", res)) });
});
authRoutes.post("/refresh", async (req, res) => {
  const token = lerRefreshCookie(req.headers.cookie);
  if (!token || token.length < 32 || token.length > 256) throw new ApiError(401, "Refresh token ausente.");
  res.json(await renovarSessao(token, res));
});
authRoutes.post("/logout", requireAuth, async (req, res) => {
  await prisma.sessao.updateMany({ where: { id: req.principal!.sessionId }, data: { revogadaEm: new Date() } });
  limparCookieRefresh(res);
  res.status(204).end();
});
authRoutes.post("/logout-todos", requireAuth, async (req, res) => {
  const principal = req.principal!;
  await prisma.sessao.updateMany({ where: principal.kind === "USER" ? { usuarioId: principal.id } : { adminId: principal.id }, data: { revogadaEm: new Date() } });
  limparCookieRefresh(res);
  res.status(204).end();
});
authRoutes.get("/me", requireAuth, async (req, res) => {
  const principal = req.principal!;
  const data = principal.kind === "ADMIN"
    ? await prisma.admin.findUnique({ where: { id: principal.id }, select: { id: true, nome: true, email: true, ativo: true } })
    : await prisma.usuario.findUnique({ where: { id: principal.id }, select: { id: true, nomeCompleto: true, email: true, cidade: true, estado: true, consentimentoLocalizacao: true } });
  res.json({ tipo: principal.kind, perfil: data });
});
authRoutes.post("/senha/alterar", requireUser, async (req, res) => {
  const { atual, nova } = z.object({ atual: z.string().min(1), nova: senha }).strict().parse(req.body);
  const usuarioId = req.principal!.id;
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  if (!(await bcrypt.compare(atual, usuario.senhaHash))) throw new ApiError(401, "Senha atual incorreta.");
  const novaHash = await bcrypt.hash(nova, 12);
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash: novaHash } }),
    prisma.sessao.updateMany({ where: { usuarioId }, data: { revogadaEm: new Date() } })
  ]);
  limparCookieRefresh(res);
  res.status(204).end();
});
authRoutes.post("/senha/solicitar-recuperacao", async (req, res) => {
  const { email: endereco } = z.object({ email }).strict().parse(req.body);
  if (!smtpConfigurado()) throw new ApiError(503, "Recuperacao por e-mail ainda nao configurada neste ambiente.");
  const usuario = await prisma.usuario.findUnique({ where: { email: endereco }, select: { id: true, email: true } });
  if (usuario) {
    const token = randomBytes(48).toString("base64url");
    await prisma.recuperacaoSenha.create({ data: {
      usuarioId: usuario.id, tokenHash: hashOpaque(token), expiraEm: new Date(Date.now() + 30 * 60 * 1000)
    } });
    try { await enviarEmailRecuperacao(usuario.email, token); }
    catch (err) { console.error("Falha ao enviar e-mail de recuperacao:", err); }
  }
  // Resposta identica para e-mail existente ou inexistente.
  res.status(202).json({ message: "Se existir uma conta para este e-mail, voce recebera instrucoes." });
});
authRoutes.post("/senha/redefinir", async (req, res) => {
  const { token, nova } = z.object({ token: z.string().min(32).max(256), nova: senha }).strict().parse(req.body);
  const tokenHash = hashOpaque(token);
  const item = await prisma.recuperacaoSenha.findUnique({ where: { tokenHash } });
  if (!item || item.usadoEm || item.expiraEm <= new Date()) throw new ApiError(400, "Link invalido ou expirado.");
  const hash = await bcrypt.hash(nova, 12);
  await prisma.$transaction(async (tx) => {
    const atualizacao = await tx.recuperacaoSenha.updateMany({
      where: { id: item.id, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() }
    });
    if (!atualizacao.count) throw new ApiError(400, "Link ja utilizado ou expirado.");
    await tx.usuario.update({ where: { id: item.usuarioId }, data: { senhaHash: hash } });
    await tx.sessao.updateMany({ where: { usuarioId: item.usuarioId }, data: { revogadaEm: new Date() } });
    await tx.recuperacaoSenha.updateMany({ where: { usuarioId: item.usuarioId, usadoEm: null }, data: { usadoEm: new Date() } });
  });
  limparCookieRefresh(res);
  res.status(204).end();
});
