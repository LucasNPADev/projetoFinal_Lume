import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../prisma';
import { AppError } from '../utils/AppError';
import { LoginInput } from '../schemas/usuario';

export async function autenticar({ email, senha }: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem)
  const senhaOk = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;
  if (!usuario || !senhaOk) throw new AppError('E-mail ou senha inválidos', 401);

  const token = jwt.sign({ perfil: usuario.perfil }, env.JWT_SECRET, {
    subject: usuario.id_usuario.toString(),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  return {
    id: usuario.id_usuario.toString(),
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    token,
  };
}
