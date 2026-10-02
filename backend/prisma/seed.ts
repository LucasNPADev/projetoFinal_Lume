import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.avaliacao.deleteMany();
  await prisma.historicoTesteVocacional.deleteMany();
  await prisma.cursoInstituicao.deleteMany();
  await prisma.trilhaCargoCurso.deleteMany();
  await prisma.cargo.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.instituicao.deleteMany();
  await prisma.perguntaVocacional.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.admin.deleteMany();

  const senhaDemo = await bcrypt.hash("Lume@123", 10);

  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto: "Estudante Demo LUME",
      email: "estudante@lume.local",
      senhaHash: senhaDemo,
      endereco: "Centro",
      rua: "Rua Demo",
      cidade: "São Bernardo do Campo",
      bairro: "Centro",
      estado: "SP",
      latitude: -23.6914,
      longitude: -46.5646,
    },
  });

  await prisma.admin.create({
    data: {
      nome: "Administrador LUME",
    },
  });

  const instituicoes = await Promise.all([
    prisma.instituicao.create({
      data: {
        nome: "Instituição Demo LUME",
        cursos: "Engenharia de Computação; Medicina; Direito",
        notaAvaliacoes: 4.50,
        notaMec: 4.00,
        cnpj: "00.000.000/0001-00",
        contato: "Atendimento acadêmico LUME",
        telefone: "(11) 0000-0000",
        celular: "(11) 90000-0000",
        email: "contato@lume.local",
        endereco: "Centro",
        rua: "Rua Demo",
        cidade: "São Bernardo do Campo",
        latitude: -23.6914,
        longitude: -46.5646,
        bairro: "Centro",
        estado: "SP",
        status: true,
      },
    }),
  ]);

  const cursos = await Promise.all([
    prisma.curso.create({
      data: {
        nome: "Engenharia de Computação",
        area: "Tecnologia",
        cargaHoraria: 3600,
        modalidade: "Presencial",
        mensalidade: 1500,
        salario: 9200,
        descricao: "Formação voltada a software, hardware e sistemas computacionais.",
        grauAcademico: "Bacharelado",
      },
    }),
    prisma.curso.create({
      data: {
        nome: "Medicina",
        area: "Saúde",
        cargaHoraria: 7200,
        modalidade: "Presencial",
        mensalidade: 6500,
        salario: 15000,
        descricao: "Formação para atuação médica e continuidade em residência e especializações.",
        grauAcademico: "Bacharelado",
      },
    }),
    prisma.curso.create({
      data: {
        nome: "Direito",
        area: "Humanas",
        cargaHoraria: 4000,
        modalidade: "Presencial",
        mensalidade: 1200,
        salario: 8500,
        descricao: "Formação em ciências jurídicas, argumentação e interpretação normativa.",
        grauAcademico: "Bacharelado",
      },
    }),
  ]);

  await prisma.cursoInstituicao.createMany({
    data: cursos.map((curso) => ({
      cursoId: curso.id,
      instituicaoId: instituicoes[0].id,
      status: true,
      mensalidade: curso.mensalidade,
      formasIngresso: "Vestibular; ENEM; Transferência",
      notaCorte: 650,
    })),
  });

  const cargos = await Promise.all([
    prisma.cargo.create({
      data: {
        nome: "Desenvolvedor(a) de Software",
        curso: "Engenharia de Computação",
        areaAtuacao: "Tecnologia",
        faixaSalarial: "R$ 4.500 a R$ 22.000",
        salario: 9200,
        descricao: "Cria, testa e mantém aplicativos, sistemas e plataformas digitais.",
        hardSkills: "Programação; Banco de dados; Git e versionamento",
        softSkills: "Resolução de problemas; Trabalho em equipe",
      },
    }),
    prisma.cargo.create({
      data: {
        nome: "Médico(a)",
        curso: "Medicina",
        areaAtuacao: "Saúde",
        faixaSalarial: "R$ 7.000 a R$ 35.000",
        salario: 15000,
        descricao: "Atua na prevenção, diagnóstico e tratamento de condições de saúde.",
        hardSkills: "Diagnóstico clínico; Farmacologia; Anatomia e fisiologia",
        softSkills: "Empatia; Comunicação; Ética profissional",
      },
    }),
    prisma.cargo.create({
      data: {
        nome: "Advogado(a)",
        curso: "Direito",
        areaAtuacao: "Humanas",
        faixaSalarial: "R$ 3.500 a R$ 25.000",
        salario: 8500,
        descricao: "Atua com interpretação, aplicação e defesa de direitos e interesses.",
        hardSkills: "Pesquisa jurídica; Redação jurídica; Legislação",
        softSkills: "Argumentação; Comunicação; Negociação",
      },
    }),
  ]);

  await prisma.trilhaCargoCurso.createMany({
    data: [
      { cargoId: cargos[0].id, cursoId: cursos[0].id, ordemEtapa: 1 },
      { cargoId: cargos[1].id, cursoId: cursos[1].id, ordemEtapa: 1 },
      { cargoId: cargos[1].id, cursoId: cursos[1].id, ordemEtapa: 2 },
      { cargoId: cargos[1].id, cursoId: cursos[1].id, ordemEtapa: 3 },
      { cargoId: cargos[2].id, cursoId: cursos[2].id, ordemEtapa: 1 },
    ],
  });

  await prisma.avaliacao.create({
    data: {
      usuarioId: usuario.id,
      instituicaoId: instituicoes[0].id,
      comentario: "Instituição de demonstração utilizada na POC do LUME.",
    },
  });

  await prisma.perguntaVocacional.createMany({
    data: [
      { enunciado: "Como você prefere resolver problemas?", areaAfinidade: "Tecnologia" },
      { enunciado: "Qual atividade mais combina com você?", areaAfinidade: "Saúde" },
      { enunciado: "Em um projeto, qual papel mais atrai você?", areaAfinidade: "Humanas" },
    ],
  });

  console.log("Seed do LUME concluído.");
  console.log("Usuário demo: estudante@lume.local / Lume@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
