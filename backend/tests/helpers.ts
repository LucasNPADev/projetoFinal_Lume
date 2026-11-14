import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

export { app, prisma, request };

export function uniqueEmail(prefix = "test") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@lume.test`;
}

export async function createTestUser(overrides: {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: "usuario" | "admin";
} = {}) {
  const rawPassword = overrides.senha ?? "SenhaForte123!";
  const email = overrides.email ?? uniqueEmail("user");
  const senha_hash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.usuario.create({
    data: {
      nome: overrides.nome ?? "Usuário de Teste",
      email,
      senha_hash,
      perfil: overrides.perfil ?? "usuario",
      termos_aceitos_em: new Date(),
      versao_termos: "2026-10-09",
    },
  });

  return { user, rawPassword, email };
}

export async function createAdminUser(overrides: {
  nome?: string;
  email?: string;
  senha?: string;
} = {}) {
  return createTestUser({
    ...overrides,
    nome: overrides.nome ?? "Administrador de Teste",
    email: overrides.email ?? uniqueEmail("admin"),
    perfil: "admin",
  });
}

export async function loginUser(email: string, senha: string) {
  const res = await request(app).post("/session").send({ email, senha });
  return res.body as {
    token: string;
    refresh_token: string;
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
}

export async function cleanupUser(id_usuario: bigint) {
  try {
    await prisma.historicoTesteVocacional.deleteMany({ where: { id_usuario } });
    await prisma.recuperacaoSenha.deleteMany({ where: { id_usuario } });
    await prisma.sessao.deleteMany({ where: { id_usuario } });
    await prisma.favorito.deleteMany({ where: { id_usuario } });
    await prisma.avaliacao.deleteMany({ where: { id_usuario } });
    await prisma.denuncia.deleteMany({ where: { id_usuario } });
    await prisma.notificacao.deleteMany({ where: { id_usuario } });
    await prisma.consultaCargo.deleteMany({ where: { id_usuario } });
    await prisma.consultaCurso.deleteMany({ where: { id_usuario } });
    await prisma.usuario.delete({ where: { id_usuario } });
  } catch (e) {
    // ignore if already deleted
  }
}
