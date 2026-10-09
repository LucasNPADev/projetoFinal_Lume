-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" BIGSERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(20) NOT NULL DEFAULT 'ESTUDANTE',
    "rua" VARCHAR(200),
    "cidade" VARCHAR(100),
    "estado" CHAR(2),
    "bairro" VARCHAR(100),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id_cargo" BIGSERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "area_atuacao" VARCHAR(150) NOT NULL,
    "salario" DECIMAL(10,0),
    "descricao" TEXT,
    "hard_skills" TEXT,
    "soft_skills" TEXT,
    "id_usuario_cadastrador" BIGINT NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id_cargo")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id_curso" BIGSERIAL NOT NULL,
    "nome_curso" VARCHAR(200) NOT NULL,
    "grau_academico" VARCHAR(80) NOT NULL,
    "modalidade" VARCHAR(50) NOT NULL,
    "carga_horaria" INTEGER NOT NULL,
    "area_curso" VARCHAR(150) NOT NULL,
    "id_usuario_cadastrador" BIGINT NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "Instituicao" (
    "id_instituicao" BIGSERIAL NOT NULL,
    "nome_instituicao" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "nota_mec" DECIMAL(2,1),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "email" VARCHAR(255),
    "rua" VARCHAR(200),
    "cidade" VARCHAR(100),
    "estado" CHAR(2),
    "bairro" VARCHAR(100),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "id_usuario_cadastrador" BIGINT NOT NULL,

    CONSTRAINT "Instituicao_pkey" PRIMARY KEY ("id_instituicao")
);

-- CreateTable
CREATE TABLE "Curso_Instituicao" (
    "id_curso_instituicao" BIGSERIAL NOT NULL,
    "id_curso" BIGINT NOT NULL,
    "id_instituicao" BIGINT NOT NULL,
    "mensalidade" DECIMAL(10,2),
    "formas_ingresso" TEXT,
    "nota_corte" DECIMAL(6,2),
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Curso_Instituicao_pkey" PRIMARY KEY ("id_curso_instituicao")
);

-- CreateTable
CREATE TABLE "TrilhaCargoCurso" (
    "id_trilha" BIGSERIAL NOT NULL,
    "id_cargo" BIGINT NOT NULL,
    "id_curso" BIGINT NOT NULL,
    "ordem_etapa" INTEGER NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "TrilhaCargoCurso_pkey" PRIMARY KEY ("id_trilha")
);

-- CreateTable
CREATE TABLE "ConsultaCurso" (
    "id_consulta" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "id_curso" BIGINT NOT NULL,
    "data_consulta" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaCurso_pkey" PRIMARY KEY ("id_consulta")
);

-- CreateTable
CREATE TABLE "ConsultaCargo" (
    "id_consulta" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "id_cargo" BIGINT NOT NULL,
    "data_consulta" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaCargo_pkey" PRIMARY KEY ("id_consulta")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id_avaliacao" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "id_instituicao" BIGINT NOT NULL,
    "comentario" TEXT,
    "data_publicacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id_avaliacao")
);

-- CreateTable
CREATE TABLE "PerguntaVocacional" (
    "id_pergunta" BIGSERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "area_afinidade" VARCHAR(150) NOT NULL,
    "id_usuario_cadastrador" BIGINT NOT NULL,

    CONSTRAINT "PerguntaVocacional_pkey" PRIMARY KEY ("id_pergunta")
);

-- CreateTable
CREATE TABLE "HistoricoTesteVocacional" (
    "id_historico" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "data_realizada" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pontuacao_detalhada" JSONB NOT NULL,

    CONSTRAINT "HistoricoTesteVocacional_pkey" PRIMARY KEY ("id_historico")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_cnpj_key" ON "Instituicao"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_Instituicao_id_curso_id_instituicao_key" ON "Curso_Instituicao"("id_curso", "id_instituicao");

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso_Instituicao" ADD CONSTRAINT "Curso_Instituicao_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso_Instituicao" ADD CONSTRAINT "Curso_Instituicao_id_instituicao_fkey" FOREIGN KEY ("id_instituicao") REFERENCES "Instituicao"("id_instituicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "Cargo"("id_cargo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCurso" ADD CONSTRAINT "ConsultaCurso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCurso" ADD CONSTRAINT "ConsultaCurso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCargo" ADD CONSTRAINT "ConsultaCargo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCargo" ADD CONSTRAINT "ConsultaCargo_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "Cargo"("id_cargo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_id_instituicao_fkey" FOREIGN KEY ("id_instituicao") REFERENCES "Instituicao"("id_instituicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaVocacional" ADD CONSTRAINT "PerguntaVocacional_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTesteVocacional" ADD CONSTRAINT "HistoricoTesteVocacional_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

