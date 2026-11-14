import { app, prisma, request, createTestUser, createAdminUser, loginUser, cleanupUser } from "./helpers";

describe("CT010 - Autenticação Administrativa e Concessão de Permissão (ROLE_ADMIN)", () => {
  let studentId: bigint | null = null;
  let adminId: bigint | null = null;
  let studentToken = "";
  let adminToken = "";

  beforeAll(async () => {
    // Cria estudante comum
    const student = await createTestUser({
      nome: "Aluno Comum CT010",
      senha: "SenhaEstudante123!",
      perfil: "usuario",
    });
    studentId = student.user.id_usuario;
    const studentLogin = await loginUser(student.email, "SenhaEstudante123!");
    studentToken = studentLogin.token;

    // Cria administrador
    const admin = await createAdminUser({
      nome: "Admin Geral CT010",
      senha: "SenhaAdmin123!",
    });
    adminId = admin.user.id_usuario;
    const adminLogin = await loginUser(admin.email, "SenhaAdmin123!");
    adminToken = adminLogin.token;
  });

  afterAll(async () => {
    if (studentId) await cleanupUser(studentId);
    if (adminId) await cleanupUser(adminId);
    await prisma.$disconnect();
  });

  it("deve bloquear acesso com HTTP 403 para usuário comum em rotas restritas de admin", async () => {
    const response = await request(app)
      .get("/admin/perguntas-vocacionais")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Acesso restrito a administradores");
  });

  it("deve permitir acesso para usuário com perfil ADMIN em rotas restritas", async () => {
    const response = await request(app)
      .get("/admin/perguntas-vocacionais")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("perguntas");
    expect(response.body).toHaveProperty("escala");
  });
});

