import { app, prisma, request, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT008 - Consulta e Busca de Cargos/Profissões por Palavra-Chave", () => {
  let userId: bigint | null = null;
  let userToken = "";
  let fonteId: bigint | null = null;
  let cursoId: bigint | null = null;
  const cargoIds: bigint[] = [];

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Estudante Busca",
      senha: "SenhaValida123!",
    });
    userId = created.user.id_usuario;
    userToken = (await loginUser(created.email, "SenhaValida123!")).token;

    // Em CI o banco começa vazio; cada teste deve montar os dados necessários.
    const fonte = await prisma.fonteDados.create({
      data: {
        nome: "Fonte de teste CT008",
        orgao: "Equipe de testes LUME",
        url: "https://example.test/fonte-ct008",
        consultado_em: new Date(),
        demonstracao: false,
      },
    });
    fonteId = fonte.id_fonte;

    const curso = await prisma.curso.create({
      data: {
        nome_curso: "Formação para consulta CT008",
        grau_academico: "Tecnólogo",
        modalidade: "EAD",
        carga_horaria: 1800,
        area_curso: "Formação de teste",
        duracao_meses: 24,
        status: true,
      },
    });
    cursoId = curso.id_curso;

    for (const item of [
      {
        nome: "Desenvolvedor BackEnd",
        descricao: "Desenvolvedor de sistemas e APIs",
        area_atuacao: "Tecnologia",
      },
      {
        nome: "Médico Clínico Geral",
        descricao: "Profissional médico de atendimento clínico",
        area_atuacao: "Saúde",
      },
    ]) {
      const cargo = await prisma.cargo.create({
        data: {
          ...item,
          id_fonte: fonteId,
          status: true,
        },
      });
      cargoIds.push(cargo.id_cargo);
      const rota = await prisma.rotaFormacao.create({
        data: {
          id_cargo: cargo.id_cargo,
          nome: "Rota de teste para " + cargo.nome,
          status: true,
        },
      });
      await prisma.trilhaCargoCurso.create({
        data: {
          id_cargo: cargo.id_cargo,
          id_rota: rota.id_rota,
          id_curso: cursoId,
          ordem_etapa: 1,
        },
      });
    }
  });

  afterAll(async () => {
    if (cargoIds.length) {
      await prisma.consultaCargo.deleteMany({ where: { id_cargo: { in: cargoIds } } });
      await prisma.favorito.deleteMany({ where: { id_cargo: { in: cargoIds } } });
      await prisma.trilhaCargoCurso.deleteMany({ where: { id_cargo: { in: cargoIds } } });
      await prisma.rotaFormacao.deleteMany({ where: { id_cargo: { in: cargoIds } } });
      await prisma.cargo.deleteMany({ where: { id_cargo: { in: cargoIds } } });
    }
    if (cursoId) await prisma.curso.delete({ where: { id_curso: cursoId } });
    if (fonteId) await prisma.fonteDados.delete({ where: { id_fonte: fonteId } });
    if (userId) await cleanupUser(userId);
    await prisma.$disconnect();
  });

  it("deve filtrar cargos por palavra-chave sem depender de seed preexistente", async () => {
    const responseDev = await request(app)
      .get("/cargos")
      .query({ busca: "Desenvolvedor" })
      .set("Authorization", `Bearer ${userToken}`);

    expect(responseDev.status).toBe(200);
    expect(responseDev.body).toHaveProperty("data");
    expect(Array.isArray(responseDev.body.data)).toBe(true);
    expect(responseDev.body.data.length).toBeGreaterThan(0);

    for (const cargo of responseDev.body.data) {
      const nomeOuDesc = `${cargo.nome} ${cargo.descricao ?? ""}`.toLowerCase();
      expect(nomeOuDesc).toContain("desenvolvedor");
    }
    expect(responseDev.body.data.map((c: { nome: string }) => c.nome))
      .not.toContain("Médico Clínico Geral");

    const responseMed = await request(app)
      .get("/cargos")
      .query({ busca: "Médico" })
      .set("Authorization", `Bearer ${userToken}`);

    expect(responseMed.status).toBe(200);
    const nomesMed = responseMed.body.data.map((c: { nome: string }) => c.nome);
    expect(nomesMed).toContain("Médico Clínico Geral");
    expect(nomesMed).not.toContain("Desenvolvedor BackEnd");
  });
});
