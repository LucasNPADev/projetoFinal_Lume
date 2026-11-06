import { app, prisma, request, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT008 - Consulta e Busca de Cargos/Profissões por Palavra-Chave", () => {
  let userId: bigint | null = null;
  let userToken = "";

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Estudante Busca",
      senha: "SenhaValida123!",
    });
    userId = created.user.id_usuario;

    const loginRes = await loginUser(created.email, "SenhaValida123!");
    userToken = loginRes.token;
  });

  afterAll(async () => {
    if (userId) {
      await cleanupUser(userId);
    }
    await prisma.$disconnect();
  });

  it("deve filtrar cargos em tempo real retornando apenas os correspondentes à palavra-chave", async () => {
    // Busca por "Desenvolvedor"
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

    // Busca por termo que não deve coincidir com Médico
    const nomesDev = responseDev.body.data.map((c: any) => c.nome);
    expect(nomesDev).not.toContain("Médico Clínico Geral");

    // Busca por "Médico"
    const responseMed = await request(app)
      .get("/cargos")
      .query({ busca: "Médico" })
      .set("Authorization", `Bearer ${userToken}`);

    expect(responseMed.status).toBe(200);
    const nomesMed = responseMed.body.data.map((c: any) => c.nome);
    expect(nomesMed).toContain("Médico Clínico Geral");
    expect(nomesMed).not.toContain("Desenvolvedor BackEnd");
  });
});

