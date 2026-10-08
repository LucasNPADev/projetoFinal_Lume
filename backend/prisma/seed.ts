import "dotenv/config";
import bcrypt from "bcryptjs";
import { Modalidade, Prisma, PrismaClient, TipoInstituicao } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed com dados sinteticos e bootstrap administrativo e proibido em producao.");
  }
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail || adminPassword) {
    if (!adminEmail || !adminPassword || adminPassword.length < 12 || Buffer.byteLength(adminPassword, "utf8") > 72) {
      throw new Error("Configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD forte (12-72 bytes), ambos juntos.");
    }
    const found = await prisma.admin.findUnique({ where: { email: adminEmail } });
    if (!found) {
      await prisma.admin.create({ data: { nome: "Administrador LUME", email: adminEmail, senhaHash: await bcrypt.hash(adminPassword, 12) } });
      console.log("Administrador local criado; remova as variaveis SEED_ADMIN_* apos bootstrap.");
    } else {
      console.log("Administrador existente preservado (senha nao sobrescrita).");
    }
  }
  if (process.env.SEED_DEMO !== "true") {
    console.log("SEED_DEMO=false: nenhum dado sintetico de catalogo foi inserido.");
    return;
  }

  async function curso(nome: string, area: string, duracaoAnos: number, modalidade: Modalidade) {
    const found = await prisma.curso.findFirst({ where: { nome } });
    return found ?? prisma.curso.create({ data: { nome, area, duracaoAnos, modalidade, ativo: true } });
  }
  const engenharia = await curso("Engenharia de Computação", "Exatas", 5, Modalidade.PRESENCIAL);
  const medicina = await curso("Medicina", "Saúde", 6, Modalidade.PRESENCIAL);
  const direito = await curso("Direito", "Humanas", 5, Modalidade.PRESENCIAL);
  const gestao = await curso("Administração", "Gestão", 4, Modalidade.PRESENCIAL);
  const ads = await curso("Análise e Desenvolvimento de Sistemas", "Exatas", 2.5, Modalidade.HIBRIDO);

  const existente = await prisma.instituicao.findFirst({ where: { nome: "Instituição Demo LUME" } });
  const instituicao = existente
    ? await prisma.instituicao.update({ where: { id: existente.id }, data: { dadosDemonstracao: true, fonteDados: "FICTICIO - apenas testes locais" } })
    : await prisma.instituicao.create({
        data: { nome: "Instituição Demo LUME", tipo: TipoInstituicao.PRIVADA, cidade: "São Bernardo do Campo", estado: "SP", ativo: true, dadosDemonstracao: true, fonteDados: "FICTICIO - apenas testes locais" }
      });
  for (const [c, valor] of [[engenharia, 750], [medicina, 2500], [direito, 900], [gestao, 650], [ads, 550]] as const) {
    const found = await prisma.cursoInstituicao.findFirst({ where: { cursoId: c.id, instituicaoId: instituicao.id, modalidade: c.modalidade, turno: c.turno } });
    if (!found) await prisma.cursoInstituicao.create({ data: { cursoId: c.id, instituicaoId: instituicao.id, modalidade: c.modalidade, turno: c.turno, mensalidade: valor, bolsas: true, ativo: true } });
  }

  async function cargo(nome: string, area: string, descricao: string, salarios: [number, number, number], hardSkills: string[], softSkills: string[]) {
    const found = await prisma.cargo.findFirst({ where: { nome } });
    const data = { area, descricao, salarioPiso: salarios[0], salarioMedio: salarios[1], salarioTeto: salarios[2], hardSkills, softSkills, ativo: true, fonteSalario: "FICTICIO - demonstracao sem base de mercado", altaDemanda: false };
    return found ? prisma.cargo.update({ where: { id: found.id }, data }) : prisma.cargo.create({ data: { nome, ...data } });
  }
  const dev = await cargo("Desenvolvedor(a) de Software", "Tecnologia", "Desenvolve e mantem solucoes digitais.", [4500, 9200, 22000], ["Programacao", "Banco de dados"], ["Colaboracao", "Analise"]);
  const medico = await cargo("Médico(a)", "Saúde", "Atua no cuidado e diagnostico em saude.", [7000, 15000, 35000], ["Clinica medica", "Anatomia"], ["Empatia", "Etica"]);
  const advogado = await cargo("Advogado(a)", "Humanas", "Trabalha com orientacao e representacao juridica.", [2500, 6500, 18000], ["Legislacao", "Pesquisa"], ["Comunicacao", "Etica"]);
  const gestor = await cargo("Gestor(a) de Projetos", "Gestão", "Planeja e acompanha equipes e entregas.", [3500, 8000, 20000], ["Planejamento", "Analise de riscos"], ["Lideranca", "Organizacao"]);
  const trilhas: Array<{ cargoId: number; cursoId: number; rota: string; etapa: string; ordem: number; descricao?: string; duracaoMeses?: number }> = [
    { cargoId: dev.id, cursoId: engenharia.id, rota: "bacharelado", ordem: 1, etapa: "Engenharia de Computação", duracaoMeses: 60 },
    { cargoId: dev.id, cursoId: ads.id, rota: "tecnologo", ordem: 1, etapa: "Análise e Desenvolvimento de Sistemas", duracaoMeses: 30 },
    { cargoId: medico.id, cursoId: medicina.id, rota: "principal", ordem: 1, etapa: "Graduação em Medicina", duracaoMeses: 72 },
    { cargoId: medico.id, cursoId: medicina.id, rota: "principal", ordem: 2, etapa: "Residência (conforme especialidade)", descricao: "Etapa complementar orientativa - duracao ilustrativa", duracaoMeses: 36 },
    { cargoId: advogado.id, cursoId: direito.id, rota: "principal", ordem: 1, etapa: "Graduação em Direito", duracaoMeses: 60 },
    { cargoId: gestor.id, cursoId: gestao.id, rota: "administracao", ordem: 1, etapa: "Graduação em Administração", duracaoMeses: 48 }
  ];
  for (const row of trilhas) {
    await prisma.trilhaCargoCurso.upsert({
      where: { cargoId_rota_ordem: { cargoId: row.cargoId, rota: row.rota, ordem: row.ordem } },
      update: { cursoId: row.cursoId, etapa: row.etapa, descricao: row.descricao, duracaoMeses: row.duracaoMeses },
      create: row
    });
  }

  const categorias = ["interesses", "habilidades", "preferencias", "ambiente"] as const;
  const enunciados = [
    "Qual desafio voce escolheria resolver?", "Em qual tarefa prefere colaborar?",
    "O que mais desperta a sua curiosidade?", "Que atividade faria no seu tempo livre?",
    "Que tipo de contribuicao quer dar a sociedade?", "Qual assunto gostaria de estudar?",
    "Como prefere abordar um problema novo?", "Em que ambiente se sente mais motivado?",
    "O que gostaria de aperfeicoar?", "Com qual equipe gostaria de trabalhar?",
    "Qual entrega considera mais gratificante?", "O que prefere planejar para o futuro?"
  ];
  const textos = [
    ["Construir ferramentas digitais", "Cuidar e orientar pessoas", "Interpretar ideias e direitos", "Organizar equipes e processos"],
    ["Analisar sistemas", "Apoiar bem-estar", "Redigir e argumentar", "Planejar recursos"],
    ["Entender computadores", "Estudar saude humana", "Compreender sociedade", "Gerenciar projetos"],
    ["Criar um aplicativo", "Aprender primeiros socorros", "Participar de debates", "Coordenar um evento"]
  ];
  const areas = ["Tecnologia", "Saúde", "Humanas", "Gestão"];
  for (let i = 0; i < enunciados.length; i++) {
    const opcoes = textos[i % textos.length].map((texto, idx) => ({ texto, pesos: { [areas[idx]]: 3 } }));
    const item = { pergunta: enunciados[i], categoria: categorias[i % categorias.length], ordem: i + 1, opcoes: opcoes as Prisma.InputJsonValue, ativo: true };
    await prisma.perguntaVocacional.upsert({ where: { ordem: i + 1 }, update: item, create: item });
  }
  console.log("Dados DEMO sinteticos inseridos; valores financeiros nao sao cotacoes reais.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
