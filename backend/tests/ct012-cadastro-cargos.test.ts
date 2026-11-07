import { app, prisma, request, createAdminUser, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT012 - Cadastramento de Novo Cargo e Especificação de Requisitos", () => {
  let adminId: bigint | null = null;
  let adminToken = "";
  let studentId: bigint | null = null;
  let studentToken = "";

  let testFonteId: bigint | null = null;
  let testCursoId: bigint | null = null;
  let createdCargoId: bigint | null = null;

  beforeAll(async () => {
    // 1. Cria administrador
    const admin = await createAdminUser({
      nome: "Admin Cargos CT012",
      senha: "SenhaAdmin123!",
    });
    adminId = admin.user.id_usuario;
    const adminLogin = await loginUser(admin.email, "SenhaAdmin123!");
    adminToken = adminLogin.token;

    // 2. Cria estudante para validar disponibilidade pública
    const student = await createTestUser({
      nome: "Estudante Consulta CT012",
      senha: "SenhaEstudante123!",
    });
    studentId = student.user.id_usuario;
    const studentLogin = await loginUser(student.email, "SenhaEstudante123!");
    studentToken = studentLogin.token;

    // 3. Cria fonte de dados ativa
    const fonte = await prisma.fonteDados.create({
      data: {
        nome: "Pesquisa Salarial e Ocupacional CT012",
        orgao: "Instituto de Pesquisa Econômica",
        url: "https://ipea.gov.br/cargos-ct012",
        consultado_em: new Date(),
        demonstracao: false,
      },
    });
    testFonteId = fonte.id_fonte;

    // 4. Cria curso ativo com duração definida para compor a rota de formação
    const curso = await prisma.curso.create({
      data: {
        nome_curso: "Engenharia de Software e IA CT012",
        grau_academico: "Bacharelado",
        modalidade: "PRESENCIAL",
        carga_horaria: 3600,
        duracao_meses: 48,
        area_curso: "Tecnologia",
        status: true,
      },
    });
    testCursoId = curso.id_curso;
  });

  afterAll(async () => {
    if (createdCargoId) {
      await prisma.etapaRotaFormacao.deleteMany({ where: { id_cargo: createdCargoId } });
      await prisma.rotaFormacao.deleteMany({ where: { id_cargo: createdCargoId } });
      await prisma.cargo.deleteMany({ where: { id_cargo: createdCargoId } });
    }
    if (testCursoId) {
      await prisma.curso.deleteMany({ where: { id_curso: testCursoId } });
    }
    if (testFonteId) {
      await prisma.fonteDados.deleteMany({ where: { id_fonte: testFonteId } });
    }
    if (adminId) await cleanupUser(adminId);
    if (studentId) await cleanupUser(studentId);
    await prisma.$disconnect();
  });

  it("deve cadastrar novo cargo com especificação de requisitos e disponibilizá-lo para consulta no app", async () => {
    const novoCargoPayload = {
      nome: "Engenheiro de IA e Dados CT012",
      area_atuacao: "Tecnologia da Informação",
      salario_piso: 8000,
      salario_media: 13500,
      salario_teto: 22000,
      id_fonte: Number(testFonteId),
      descricao: "Profissional especializado no ciclo completo de desenvolvimento e governança de soluções de IA.",
      hard_skills: "Python, PyTorch, SQL, Docker, MLOps, LLMs",
      soft_skills: "Comunicação assertiva, resolução criativa de problemas, colaboração multidisciplinar",
      panorama_mercado: "Mercado em forte expansão, demanda estratégica em múltiplos setores corporativos.",
      status: true,
      rotas: [
        {
          nome: "Formação Básica em Engenharia de Software e IA",
          descricao: "Trilha recomendada de graduação",
          status: true,
          etapas: [
            {
              id_curso: Number(testCursoId),
              ordem_etapa: 1,
              descricao: "Formação universitária em computação aplicada",
            },
          ],
        },
      ],
    };

    // 1. Cadastra cargo via endpoint administrativo com token ROLE_ADMIN
    const response = await request(app)
      .post("/cargos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(novoCargoPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id_cargo");
    expect(response.body.nome).toBe(novoCargoPayload.nome);
    expect(response.body.area_atuacao).toBe(novoCargoPayload.area_atuacao);
    expect(response.body.rotas).toHaveLength(1);

    createdCargoId = BigInt(response.body.id_cargo);

    // 2. Valida persistência dos requisitos e relacionamento no banco de dados
    const cargoDb = await prisma.cargo.findUnique({
      where: { id_cargo: createdCargoId },
      include: {
        rotas: {
          include: { etapas: true },
        },
      },
    });

    expect(cargoDb).not.toBeNull();
    expect(cargoDb?.nome).toBe(novoCargoPayload.nome);
    expect(cargoDb?.hard_skills).toBe(novoCargoPayload.hard_skills);
    expect(cargoDb?.soft_skills).toBe(novoCargoPayload.soft_skills);
    expect(cargoDb?.panorama_mercado).toBe(novoCargoPayload.panorama_mercado);
    expect(cargoDb?.id_usuario_cadastrador).toBe(adminId);
    expect(cargoDb?.rotas).toHaveLength(1);
    expect(cargoDb?.rotas[0].etapas[0].id_curso).toBe(testCursoId);

    // 3. Valida disponibilidade pública no app por busca textual
    const listRes = await request(app)
      .get("/cargos")
      .query({ busca: "Engenheiro de IA e Dados CT012" })
      .set("Authorization", `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: any) => c.nome === novoCargoPayload.nome)).toBe(true);

    // 4. Valida consulta detalhada do cargo com rotas e competências
    const getRes = await request(app)
      .get(`/cargos/${createdCargoId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.nome).toBe(novoCargoPayload.nome);
    expect(getRes.body.hard_skills).toBe(novoCargoPayload.hard_skills);
    expect(getRes.body.soft_skills).toBe(novoCargoPayload.soft_skills);
    expect(getRes.body.rotas).toBeDefined();
    expect(getRes.body.rotas.length).toBeGreaterThanOrEqual(1);
  });
});

