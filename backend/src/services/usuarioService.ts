import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AppError } from '../utils/AppError';
import { CadastroInput } from '../schemas/usuario';

export async function cadastrarUsuario({ senha, ...dados }: CadastroInput) {
  const existente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (existente) throw new AppError('E-mail já cadastrado', 409);

  const senha_hash = await bcrypt.hash(senha, 10);

  // O perfil nunca vem do corpo da requisição: todo cadastro público é ESTUDANTE.
  // Administradores são criados pelo seed (npm run seed).
  return prisma.usuario.create({
    data: { ...dados, senha_hash, perfil: 'ESTUDANTE' },
    select: {
      id_usuario: true,
      nome: true,
      email: true,
      perfil: true,
      cidade: true,
      estado: true,
      bairro: true,
    },
  });
}
