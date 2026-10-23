import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const nome = process.env.ADMIN_NOME ?? 'Administrador LUME';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA;

  if (!email || !senha) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_SENHA no .env antes de rodar o seed.');
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const admin = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nome, email, senha_hash, perfil: 'ADMIN' },
    select: { id_usuario: true, email: true, perfil: true },
  });

  console.log(`Administrador pronto: ${admin.email} (id ${admin.id_usuario})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
