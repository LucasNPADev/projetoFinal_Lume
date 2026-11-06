import { app, prisma, request, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT009 - Consulta e Filtragem de Cursos por Modalidade (EAD e Presencial)", () => {
  let userId: bigint | null = null;
  let userToken = "";
  const createdCourseIds: bigint[] = [];

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Estudante Cursos",
      senha: "SenhaValida123!",
    });
    userId = created.user.id_usuario;

    const loginRes = await loginUser(created.email, "SenhaValida123!");
    userToken = loginRes.token;

    // Cria dois cursos com o mesmo nome para testar o filtro combinado com modalidade
    const cEad = await prisma.curso.create({
      data: {
        nome_curso: "Engenharia Mecatrônica CT009",
        grau_academico: "Bacharelado",
        modalidade: "EAD",
        carga_horaria: 3600,
        duracao_meses: 60,
        area_curso: "Engenharia",
        status: true,
      },
    });

    const cPresencial = await prisma.curso.create({
      data: {
        nome_curso: "Engenharia Mecatrônica CT009",
        grau_academico: "Bacharelado",
        modalidade: "PRESENCIAL",
        carga_horaria: 3600,
        duracao_meses: 60,
        area_curso: "Engenharia",
        status: true,
      },
    });

    createdCourseIds.push(cEad.id_curso, cPresencial.id_curso);
  });

  afterAll(async () => {
    if (createdCourseIds.length > 0) {
      await prisma.curso.deleteMany({
        where: { id_curso: { in: createdCourseIds } },
      });
    }
    if (userId) {
      await cleanupUser(userId);
    }
    await prisma.$disconnect();
  });

  it("deve filtrar cursos combinando modalidade EAD com palavra-chave de busca", async () => {
    const response = await request(app)
      .get("/cursos")
      .query({
        busca: "Mecatrônica CT009",
        modalidade: "EAD",
      })
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.length).toBe(1);

    const cursoRetornado = response.body.data[0];
    expect(cursoRetornado.nome_curso).toBe("Engenharia Mecatrônica CT009");
    expect(cursoRetornado.modalidade).toBe("EAD");
  });

  it("deve filtrar cursos combinando modalidade PRESENCIAL com palavra-chave de busca", async () => {
    const response = await request(app)
      .get("/cursos")
      .query({
        busca: "Mecatrônica CT009",
        modalidade: "PRESENCIAL",
      })
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.length).toBe(1);

    const cursoRetornado = response.body.data[0];
    expect(cursoRetornado.nome_curso).toBe("Engenharia Mecatrônica CT009");
    expect(cursoRetornado.modalidade).toBe("PRESENCIAL");
  });
});

