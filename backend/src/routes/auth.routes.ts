import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errors";
import { criarToken, requireAuth } from "../middlewares/auth";
import { email, senha, texto, uf } from "../utils/validation";

export const authRoutes = Router();
const cadastro = z.object({
  nomeCompleto: texto(150),
  email,
  senha,
  cidade: texto(120).optional(),
  estado: uf.optional(),
}).strict();
const loginSchema = z.object({ email, senha: z.string().min(1).max(200) }).strict();

authRoutes.post("/cadastro", async (req, res) => {
  const data = cadastro.parse(req.body);
  if (await prisma.usuario.findUnique({ where: { email: data.email }, select: { id: true } })) throw new ApiError(409, "E-mail ja cadastrado.");
  const senhaHash = await bcrypt.hash(data.senha, 12);
  const user = await prisma.usuario.create({ data: { nomeCompleto: data.nomeCompleto, email: data.email, senhaHash, cidade: data.cidade, estado: data.estado }, select: { id: true, nomeCompleto: true, email: true } });
  res.status(201).json({ usuario: user, token: criarToken(user.id, "USER"), tipo: "Bearer", expiraEmSegundos: 7200 });
});

authRoutes.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.senha, user.senhaHash))) throw new ApiError(401, "Credenciais invalidas.");
  res.json({ usuario: { id: user.id, nomeCompleto: user.nomeCompleto, email: user.email }, token: criarToken(user.id, "USER"), tipo: "Bearer", expiraEmSegundos: 7200 });
});

authRoutes.post("/admin/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email: data.email } });
  if (!admin || !admin.ativo || !(await bcrypt.compare(data.senha, admin.senhaHash))) throw new ApiError(401, "Credenciais invalidas.");
  res.json({ administrador: { id: admin.id, nome: admin.nome, email: admin.email }, token: criarToken(admin.id, "ADMIN"), tipo: "Bearer", expiraEmSegundos: 7200 });
});

authRoutes.get("/me", requireAuth, async (req, res) => {
  const principal = req.principal!;
  const data = principal.kind === "ADMIN"
    ? await prisma.admin.findUnique({ where: { id: principal.id }, select: { id: true, nome: true, email: true, ativo: true } })
    : await prisma.usuario.findUnique({ where: { id: principal.id }, select: { id: true, nomeCompleto: true, email: true, cidade: true, estado: true, consentimentoLocalizacao: true } });
  res.json({ tipo: principal.kind, perfil: data });
});
