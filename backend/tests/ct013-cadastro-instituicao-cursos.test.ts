import { app, prisma, request, createAdminUser, createTestUser, loginUser, cleanupUser } from "./helpers";

function generateValidCnpj(): string {
  const base = Math.floor(10000000 + Math.random() * 90000000).toString() + "0001";
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma1 = base.split("").reduce((acc, d, i) => acc + Number(d) * pesos1[i], 0);
  const resto1 = soma1 % 11;
  const d1 = resto1 < 2 ? 0 : 11 - resto1;
  const base2 = base + d1;
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma2 = base2.split("").reduce((acc, d, i) => acc + Number(d) * pesos2[i], 0);
  const resto2 = soma2 % 11;
  const d2 = resto2 < 2 ? 0 : 11 - resto2;
  return `${base}${d1}${d2}`;
}

describe("CT013 - Cadastramento de Instituições de Ensino e Inclusão de Cursos", () => {
  let adminId: bigint | null = null;
  let adminToken = "";
  let studentId: bigint | null = null;
  let studentToken = "";

  let createdInstId: bigint | null = null;
  let createdCursoId: bigint | null = null;
  let createdOfertaId: bigint | null = null;

  beforeAll(async () => {
    // 1. Cria usuário administrador
    const admin = await createAdminUser({
      nome: "Admin Inst Cursos CT013",
      senha: "SenhaAdmin123!",
    });
    adminId = admin.user.id_usuario;
    const adminLogin = await loginUser(admin.email, "SenhaAdmin123!");
    adminToken = adminLogin.token;

    // 2. Cria usuário estudante comum
    const student = await createTestUser({
      nome: "Estudante Catalogo CT013",
      senha: "SenhaEstudante123!",
    });
    studentId = student.user.id_usuario;
    const studentLogin = await loginUser(student.email, "SenhaEstudante123!");
    studentToken = studentLogin.token;
  });

  afterAll(async () => {
    if (createdOfertaId) {
      await prisma.curso_Instituicao.deleteMany({ where: { id_curso_instituicao: createdOfertaId } });
    }
    if (createdCursoId) {
      await prisma.curso.deleteMany({ where: { id_curso: createdCursoId } });
    }
    if (createdInstId) {
      await prisma.instituicao.deleteMany({ where: { id_instituicao: createdInstId } });
    }
    if (adminId) await cleanupUser(adminId);
    if (studentId) await cleanupUser(studentId);
    await prisma.$disconnect();
  });

  it("deve cadastrar instituição, criar curso e estabelecer vínculo no banco relacional", async () => {
    // 1. Cadastra nova instituição de ensino
    const instPayload = {
      nome_instituicao: "Universidade Tecnológica LUME CT013",
      cnpj: generateValidCnpj(),
      nota_mec: 4.8,
      regular_mec: true,
      natureza: "PRIVADA",
      telefone: "1132104321",
      celular: "11987654321",
      email: "reitoria@utlume.edu.br",
      rua: "Avenida Paulista, 1500",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      status: true,
    };

    const instRes = await request(app)
      .post("/instituicoes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(instPayload);

    expect(instRes.status).toBe(201);
    expect(instRes.body).toHaveProperty("id_instituicao");
    expect(instRes.body.nome_instituicao).toBe(instPayload.nome_instituicao);
    createdInstId = BigInt(instRes.body.id_instituicao);

    // 2. Cadastra novo curso acadêmico
    const cursoPayload = {
      nome_curso: "Engenharia de Software CT013",
      grau_academico: "Bacharelado",
      modalidade: "PRESENCIAL",
      carga_horaria: 3600,
      duracao_meses: 48,
      area_curso: "Tecnologia",
      descricao: "Curso moderno de Engenharia de Software com foco em sistemas distribuídos.",
      status: true,
    };

    const cursoRes = await request(app)
      .post("/cursos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(cursoPayload);

    expect(cursoRes.status).toBe(201);
    expect(cursoRes.body).toHaveProperty("id_curso");
    expect(cursoRes.body.nome_curso).toBe(cursoPayload.nome_curso);
    createdCursoId = BigInt(cursoRes.body.id_curso);

    // 3. Vincula curso à instituição criando a oferta
    const ofertaPayload = {
      id_instituicao: Number(createdInstId),
      id_curso: Number(createdCursoId),
      mensalidade: 750,
      mensalidade_max: 1100,
      formas_ingresso: "Vestibular próprio e aproveitamento do ENEM",
      prouni: true,
      fies: true,
      status: true,
    };

    const ofertaRes = await request(app)
      .post("/ofertas")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(ofertaPayload);

    expect(ofertaRes.status).toBe(201);
    expect(ofertaRes.body).toHaveProperty("id_curso_instituicao");
    createdOfertaId = BigInt(ofertaRes.body.id_curso_instituicao);

    // 4. Valida persistência do relacionamento no banco de dados relacional
    const ofertaDb = await prisma.curso_Instituicao.findFirst({
      where: {
        id_instituicao: createdInstId,
        id_curso: createdCursoId,
      },
      include: {
        curso: true,
        instituicao: true,
      },
    });

    expect(ofertaDb).not.toBeNull();
    expect(ofertaDb?.curso.nome_curso).toBe(cursoPayload.nome_curso);
    expect(ofertaDb?.instituicao.nome_instituicao).toBe(instPayload.nome_instituicao);
    expect(Number(ofertaDb?.mensalidade)).toBe(750);

    // 5. Valida disponibilidade pública no catálogo de ofertas
    const catalogoRes = await request(app)
      .get("/ofertas")
      .query({ busca: "Engenharia de Software CT013" })
      .set("Authorization", `Bearer ${studentToken}`);

    expect(catalogoRes.status).toBe(200);
    expect(catalogoRes.body.data.some((o: any) => o.id_curso_instituicao === String(createdOfertaId))).toBe(true);
  });
});

