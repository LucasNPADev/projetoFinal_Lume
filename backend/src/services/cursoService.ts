import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../utils/AppError';
import { CriarCursoInput, ListarCursosInput } from '../schemas/curso';

export async function criarCurso(dados: CriarCursoInput, idCadastrador: bigint) {
  return prisma.curso.create({
    data: { ...dados, id_usuario_cadastrador: idCadastrador },
  });
}

export async function listarCursos({ busca, area, modalidade, page, limit }: ListarCursosInput) {
  const where: Prisma.CursoWhereInput = {
    ...(busca && { nome_curso: { contains: busca, mode: 'insensitive' } }),
    ...(area && { area_curso: { contains: area, mode: 'insensitive' } }),
    ...(modalidade && { modalidade }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.curso.findMany({
      where,
      orderBy: { nome_curso: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.curso.count({ where }),
  ]);

  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function buscarCurso(idCurso: bigint, idUsuario: bigint) {
  const curso = await prisma.curso.findUnique({
    where: { id_curso: idCurso },
    include: {
      // Só ofertas ativas, de instituições ativas (RN07 / RN08)
      ofertas: {
        where: { status: true, instituicao: { status: true } },
        include: {
          instituicao: {
            select: {
              id_instituicao: true,
              nome_instituicao: true,
              nota_mec: true,
              telefone: true,
              celular: true,
              email: true,
              rua: true,
              bairro: true,
              cidade: true,
              estado: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  if (!curso) throw new AppError('Curso não encontrado', 404);

  // Registra no histórico (tabela ConsultaCurso do DER)
  await prisma.consultaCurso.create({ data: { id_usuario: idUsuario, id_curso: idCurso } });

  return curso;
}
