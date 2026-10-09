import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { emailSchema, senhaSchema } from "../schemas/comum";
import { z } from "zod";
export async function criarAdministrador(
  nome: string,
  email: string,
  senha: string,
) {
  nome = z.string().trim().min(2).max(150).parse(nome);
  email = emailSchema.parse(email);
  senha = senhaSchema.parse(senha);
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    if (!["admin", "ADMIN"].includes(existente.perfil))
      throw new Error(
        "Esse e-mail pertence a um estudante. Escolha outro e-mail para o administrador.",
      );
    return existente;
  }
  return prisma.usuario.create({
    data: {
      nome,
      email,
      senha_hash: await bcrypt.hash(senha, 12),
      perfil: "admin",
    },
  });
}
