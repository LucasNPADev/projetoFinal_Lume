import { Modalidade, PrismaClient, TipoInstituicao } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cursos = await Promise.all([
    prisma.curso.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: "Engenharia de Computação", area: "Exatas", duracaoAnos: 5, modalidade: Modalidade.PRESENCIAL, turno: "Integral", ativo: true } }),
    prisma.curso.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: "Medicina", area: "Saúde", duracaoAnos: 6, modalidade: Modalidade.PRESENCIAL, turno: "Integral", ativo: true } }),
    prisma.curso.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nome: "Direito", area: "Humanas", duracaoAnos: 5, modalidade: Modalidade.PRESENCIAL, turno: "Noite", ativo: true } }),
  ]);

  const instituicao = await prisma.instituicao.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: "Instituição Demo LUME", tipo: TipoInstituicao.PRIVADA, cidade: "São Bernardo do Campo", estado: "SP", ativo: true },
  });

  await prisma.cursoInstituicao.createMany({
    data: cursos.map((curso) => ({
      cursoId: curso.id,
      instituicaoId: instituicao.id,
      modalidade: curso.modalidade,
      turno: curso.turno,
      ativo: true,
    })),
    skipDuplicates: true,
  });

  const cargos = await Promise.all([
    prisma.cargo.upsert({
      where: { id: 1 }, update: {},
      create: { id: 1, nome: "Desenvolvedor(a) de Software", area: "Tecnologia", descricao: "Cria, testa e mantém aplicativos, sistemas e plataformas digitais.", salarioPiso: 4500, salarioMedio: 9200, salarioTeto: 22000, altaDemanda: true, hardSkills: ["Programação", "Banco de dados", "Git e versionamento"], softSkills: ["Resolução de problemas", "Trabalho em equipe"] },
    }),
    prisma.cargo.upsert({
      where: { id: 2 }, update: {},
      create: { id: 2, nome: "Médico(a)", area: "Saúde", descricao: "Atua na prevenção, diagnóstico e tratamento de condições de saúde.", salarioPiso: 7000, salarioMedio: 15000, salarioTeto: 35000, altaDemanda: true, hardSkills: ["Diagnóstico clínico", "Farmacologia", "Anatomia e fisiologia"], softSkills: ["Empatia", "Comunicação", "Ética profissional"] },
    }),
  ]);

  await prisma.trilhaCargoCurso.createMany({
    data: [
      { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Medicina (6 anos)", ordem: 1, descricao: "Formação de graduação" },
      { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Residência médica", ordem: 2, descricao: "Etapa orientativa após a graduação" },
      { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Especialização", ordem: 3 },
      { cargoId: cargos[0].id, cursoId: cursos[0].id, etapa: "Graduação em tecnologia", ordem: 1 },
    ],
    skipDuplicates: true,
  });

  await prisma.perguntaVocacional.createMany({
    data: [
      { pergunta: "Como você prefere resolver problemas?", categoria: "interesses", ordem: 1, opcoes: ["Analisando dados e lógica", "Ajudando pessoas", "Comunicando e argumentando", "Planejando projetos"] },
      { pergunta: "Qual atividade mais combina com você?", categoria: "habilidades", ordem: 2, opcoes: ["Programar e construir soluções", "Cuidar e orientar", "Escrever e apresentar ideias", "Organizar e liderar"] },
    ],
    skipDuplicates: true,
  });

  console.log("Seed do LUME concluído.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());