import { Modalidade, PrismaClient, TipoInstituicao } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cursos = await Promise.all([
    prisma.curso.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: "Engenharia de Computação", area: "Tecnologia", descricao: "Formação voltada a software, hardware e sistemas computacionais.", duracaoAnos: 5, modalidade: Modalidade.PRESENCIAL, turno: "Integral", ativo: true } }),
    prisma.curso.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: "Medicina", area: "Saúde", descricao: "Formação para atuação médica e continuidade em residência e especializações.", duracaoAnos: 6, modalidade: Modalidade.PRESENCIAL, turno: "Integral", ativo: true } }),
    prisma.curso.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nome: "Direito", area: "Humanas", descricao: "Formação em ciências jurídicas, argumentação e interpretação normativa.", duracaoAnos: 5, modalidade: Modalidade.PRESENCIAL, turno: "Noite", ativo: true } }),
  ]);
  const instituicao = await prisma.instituicao.upsert({
    where: { id: 1 }, update: {},
    create: { id: 1, nome: "Instituição Demo LUME", tipo: TipoInstituicao.PRIVADA, cidade: "São Bernardo do Campo", estado: "SP", endereco: "Centro", descricao: "Instituição de demonstração para o ambiente de desenvolvimento do LUME.", mensalidadeMin: 850, mensalidadeMax: 6500, infraestrutura: { biblioteca: true, laboratorios: true, acessibilidade: true, areasConvivencia: true }, formasIngresso: ["Vestibular", "ENEM", "Transferência"], ativo: true },
  });
  await prisma.cursoInstituicao.createMany({ data: cursos.map((curso) => ({ cursoId: curso.id, instituicaoId: instituicao.id, modalidade: curso.modalidade, turno: curso.turno, mensalidade: curso.id === 2 ? 6500 : curso.id === 1 ? 1500 : 1200, notaCorte: 650, bolsas: true, ativo: true })), skipDuplicates: true });
  const cargos = await Promise.all([
    prisma.cargo.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: "Desenvolvedor(a) de Software", area: "Tecnologia", descricao: "Cria, testa e mantém aplicativos, sistemas e plataformas digitais.", salarioPiso: 4500, salarioMedio: 9200, salarioTeto: 22000, altaDemanda: true, hardSkills: ["Programação", "Banco de dados", "Git e versionamento"], softSkills: ["Resolução de problemas", "Trabalho em equipe"] } }),
    prisma.cargo.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: "Médico(a)", area: "Saúde", descricao: "Atua na prevenção, diagnóstico e tratamento de condições de saúde.", salarioPiso: 7000, salarioMedio: 15000, salarioTeto: 35000, altaDemanda: true, hardSkills: ["Diagnóstico clínico", "Farmacologia", "Anatomia e fisiologia"], softSkills: ["Empatia", "Comunicação", "Ética profissional"] } }),
    prisma.cargo.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nome: "Advogado(a)", area: "Humanas", descricao: "Atua com interpretação, aplicação e defesa de direitos e interesses.", salarioPiso: 3500, salarioMedio: 8500, salarioTeto: 25000, altaDemanda: false, hardSkills: ["Pesquisa jurídica", "Redação jurídica", "Legislação"], softSkills: ["Argumentação", "Comunicação", "Negociação"] } }),
  ]);
  await prisma.trilhaCargoCurso.createMany({ data: [
    { cargoId: cargos[0].id, cursoId: cursos[0].id, etapa: "Graduação em tecnologia", ordem: 1, descricao: "Uma das possibilidades de formação." },
    { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Medicina (6 anos)", ordem: 1, descricao: "Formação de graduação." },
    { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Residência médica", ordem: 2, descricao: "Etapa orientativa após a graduação." },
    { cargoId: cargos[1].id, cursoId: cursos[1].id, etapa: "Especialização", ordem: 3, descricao: "Possibilidade de aprofundamento profissional." },
    { cargoId: cargos[2].id, cursoId: cursos[2].id, etapa: "Graduação em Direito", ordem: 1, descricao: "Uma das possibilidades de formação." },
  ], skipDuplicates: true });
  await prisma.perguntaVocacional.createMany({ data: [
    { pergunta: "Como você prefere resolver problemas?", categoria: "interesses", ordem: 1, opcoes: [{ texto: "Analisando dados e lógica", area: "Tecnologia", peso: 1 }, { texto: "Ajudando e cuidando de pessoas", area: "Saúde", peso: 1 }, { texto: "Comunicando e argumentando", area: "Humanas", peso: 1 }] },
    { pergunta: "Qual atividade mais combina com você?", categoria: "habilidades", ordem: 2, opcoes: [{ texto: "Programar e construir soluções", area: "Tecnologia", peso: 1 }, { texto: "Cuidar, orientar e observar", area: "Saúde", peso: 1 }, { texto: "Escrever, apresentar e negociar", area: "Humanas", peso: 1 }] },
    { pergunta: "Em um projeto, qual papel mais atrai você?", categoria: "preferencias", ordem: 3, opcoes: [{ texto: "Criar uma solução técnica", area: "Tecnologia", peso: 1 }, { texto: "Atender necessidades de pessoas", area: "Saúde", peso: 1 }, { texto: "Pesquisar, interpretar e defender ideias", area: "Humanas", peso: 1 }] },
  ], skipDuplicates: true });
  console.log("Seed do LUME concluído.");
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
