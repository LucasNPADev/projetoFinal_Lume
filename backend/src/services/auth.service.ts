import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "lume-local-secret";

function tokenFor(usuarioId: number) {
  return jwt.sign({ sub: String(usuarioId) }, JWT_SECRET, { expiresIn: "7d" });
}

export async function registrarUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  endereco?: string;
  rua?: string;
  cidade?: string;
  bairro?: string;
  estado?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) throw new Error("EMAIL_EM_USO");

  const senhaHash = await bcrypt.hash(data.senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto: data.nome.trim(),
      email,
      senhaHash,
      endereco: data.endereco,
      rua: data.rua,
      cidade: data.cidade,
      bairro: data.bairro,
      estado: data.estado,
    },
    select: {
      id: true,
      nomeCompleto: true,
      email: true,
      endereco: true,
      rua: true,
      cidade: true,
      bairro: true,
      estado: true,
    },
  });

  return { token: tokenFor(usuario.id), usuario };
}

export async function autenticarUsuario(emailInput: string, senha: string) {
  const email = emailInput.trim().toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new Error("CREDENCIAIS_INVALIDAS");
  }

  const { senhaHash: _senhaHash, ...usuarioSeguro } = usuario;
  return { token: tokenFor(usuario.id), usuario: usuarioSeguro };
}
