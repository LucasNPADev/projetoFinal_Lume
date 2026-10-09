import { prisma } from '../prisma';
import { AppError } from '../utils/AppError';
import { CriarInstituicaoInput, VincularCursoInput } from '../schemas/instituicao';

export async function criarInstituicao(dados: CriarInstituicaoInput, idCadastrador: bigint) {
  const existente = await prisma.instituicao.findUnique({ where: { cnpj: dados.cnpj } });
  if (existente) throw new AppError('Já existe uma instituição com este CNPJ', 409);

  return prisma.instituicao.create({
    data: { ...dados, id_usuario_cadastrador: idCadastrador },
  });
}

export async function vincularCurso(idInstituicao: bigint, dados: VincularCursoInput) {
  const [instituicao, curso] = await Promise.all([
    prisma.instituicao.findUnique({ where: { id_instituicao: idInstituicao } }),
    prisma.curso.findUnique({ where: { id_curso: dados.id_curso } }),
  ]);

  if (!instituicao) throw new AppError('Instituição não encontrada', 404);
  if (!curso) throw new AppError('Curso não encontrado', 404);

  const jaVinculado = await prisma.curso_Instituicao.findUnique({
    where: {
      id_curso_id_instituicao: { id_curso: dados.id_curso, id_instituicao: idInstituicao },
    },
  });
  if (jaVinculado) throw new AppError('Este curso já está cadastrado nesta instituição', 409);

  return prisma.curso_Instituicao.create({
    data: {
      id_curso: dados.id_curso,
      id_instituicao: idInstituicao,
      mensalidade: dados.mensalidade,
      formas_ingresso: dados.formas_ingresso,
      nota_corte: dados.nota_corte,
      status: dados.status,
    },
    include: {
      curso: { select: { id_curso: true, nome_curso: true, modalidade: true } },
      instituicao: { select: { id_instituicao: true, nome_instituicao: true } },
    },
  });
}
