-- Migration inicial do LUME.
-- Fonte: MER + dicionario fisico do projeto.
-- Tipos SQL sao a materializacao tecnica dos tipos conceituais
-- informados no documento (Numero, Texto, Verdadeiro/Falso e Data).

CREATE TABLE "usuario" (
  "id_user" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "senha" VARCHAR(255) NOT NULL,
  "endereco" VARCHAR(255),
  "rua" VARCHAR(255),
  "cidade" VARCHAR(120),
  "bairro" VARCHAR(120),
  "estado" CHAR(2),
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6)
);

CREATE TABLE "instituicao" (
  "id_instituicao" SERIAL PRIMARY KEY,
  "nome_instituicao" VARCHAR(255) NOT NULL,
  "cursos" TEXT NOT NULL,
  "nota_avaliacoes" DECIMAL(3,2) NOT NULL,
  "nota_mec" DECIMAL(3,2) NOT NULL,
  "cnpj" VARCHAR(18),
  "contato" TEXT,
  "Telefone" VARCHAR(20),
  "Celular" VARCHAR(20),
  "email" VARCHAR(255),
  "endereco" VARCHAR(255),
  "rua" VARCHAR(255),
  "Cidade" VARCHAR(120) NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "bairro" VARCHAR(120),
  "Estado" CHAR(2) NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX "instituicao_cidade_estado_idx" ON "instituicao" ("Cidade", "Estado");

CREATE TABLE "admin" (
  "id_Admin" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL
);

CREATE TABLE "curso" (
  "id_curso" SERIAL PRIMARY KEY,
  "nome_curso" VARCHAR(255) NOT NULL,
  "area_curso" VARCHAR(120) NOT NULL,
  "carga_horario" INTEGER NOT NULL,
  "modalidade" VARCHAR(50) NOT NULL,
  "mensalidade" DECIMAL(10,2),
  "salario" DECIMAL(10,2),
  "descricao" TEXT,
  "grau_academico" VARCHAR(120)
);

CREATE INDEX "curso_area_curso_idx" ON "curso" ("area_curso");

CREATE TABLE "cargo" (
  "id_Cargo" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL,
  "curso" VARCHAR(255),
  "areaAtuacao" VARCHAR(120) NOT NULL,
  "faixaSalarial" VARCHAR(120),
  "salario" DECIMAL(10,2),
  "Descricao" TEXT,
  "hard_skills" TEXT,
  "soft_skills" TEXT
);

CREATE INDEX "cargo_areaAtuacao_idx" ON "cargo" ("areaAtuacao");

CREATE TABLE "trilhaCargoCurso" (
  "id_trilha" SERIAL PRIMARY KEY,
  "cargo" INTEGER NOT NULL,
  "curso" INTEGER NOT NULL,
  "order_etapa" INTEGER NOT NULL,
  CONSTRAINT "trilhaCargoCurso_cargo_fkey"
    FOREIGN KEY ("cargo") REFERENCES "cargo" ("id_Cargo")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trilhaCargoCurso_curso_fkey"
    FOREIGN KEY ("curso") REFERENCES "curso" ("id_curso")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trilhaCargoCurso_pair_order_key"
    UNIQUE ("cargo", "curso", "order_etapa")
);

CREATE TABLE "Curso_inst" (
  "id_cursoInst" SERIAL PRIMARY KEY,
  "curso" INTEGER NOT NULL,
  "instituicao" INTEGER NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT TRUE,
  "mensalidade" DECIMAL(10,2),
  "formas_ingresso" TEXT,
  "nota_corte" DECIMAL(5,2),
  CONSTRAINT "Curso_inst_curso_fkey"
    FOREIGN KEY ("curso") REFERENCES "curso" ("id_curso")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Curso_inst_instituicao_fkey"
    FOREIGN KEY ("instituicao") REFERENCES "instituicao" ("id_instituicao")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Curso_inst_pair_key"
    UNIQUE ("curso", "instituicao")
);

CREATE INDEX "Curso_inst_curso_idx" ON "Curso_inst" ("curso");
CREATE INDEX "Curso_inst_instituicao_idx" ON "Curso_inst" ("instituicao");

CREATE TABLE "avaliacao" (
  "id_avaliacao" SERIAL PRIMARY KEY,
  "id_usuario" INTEGER NOT NULL,
  "id_instituicao" INTEGER NOT NULL,
  "comentario" TEXT,
  "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "avaliacao_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario" ("id_user")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "avaliacao_instituicao_fkey"
    FOREIGN KEY ("id_instituicao") REFERENCES "instituicao" ("id_instituicao")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "avaliacao_usuario_idx" ON "avaliacao" ("id_usuario");
CREATE INDEX "avaliacao_instituicao_idx" ON "avaliacao" ("id_instituicao");

CREATE TABLE "perguntaVocacional" (
  "id_pergunta" SERIAL PRIMARY KEY,
  "enunciado" TEXT NOT NULL,
  "area_afinidade" VARCHAR(120) NOT NULL
);

CREATE TABLE "historicoTesteVocacional" (
  "id_historico" SERIAL PRIMARY KEY,
  "id_usuario" INTEGER NOT NULL,
  "data_realizada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pontuacao_detalhada" TEXT NOT NULL,
  CONSTRAINT "historico_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario" ("id_user")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "historico_usuario_idx" ON "historicoTesteVocacional" ("id_usuario");
