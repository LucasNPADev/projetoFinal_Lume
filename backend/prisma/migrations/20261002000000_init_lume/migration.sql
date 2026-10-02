CREATE TYPE "TipoInstituicao" AS ENUM ('PUBLICA', 'PRIVADA');
CREATE TYPE "Modalidade" AS ENUM ('PRESENCIAL', 'EAD', 'HIBRIDO');

CREATE TABLE "Usuario" (
  "id" SERIAL NOT NULL, "nomeCompleto" TEXT NOT NULL, "email" TEXT NOT NULL, "senhaHash" TEXT NOT NULL,
  "telefone" TEXT, "dataNascimento" TIMESTAMP(3), "cidade" TEXT, "estado" TEXT,
  "consentimentoLocalizacao" BOOLEAN NOT NULL DEFAULT false, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE TABLE "Admin" (
  "id" SERIAL NOT NULL, "nome" TEXT NOT NULL, "email" TEXT NOT NULL, "senhaHash" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

CREATE TABLE "Instituicao" (
  "id" SERIAL NOT NULL, "nome" TEXT NOT NULL, "tipo" "TipoInstituicao" NOT NULL, "cidade" TEXT NOT NULL, "estado" TEXT NOT NULL,
  "endereco" TEXT, "latitude" DECIMAL(9,6), "longitude" DECIMAL(9,6), "descricao" TEXT, "site" TEXT, "telefone" TEXT, "whatsapp" TEXT,
  "email" TEXT, "mensalidadeMin" DECIMAL(10,2), "mensalidadeMax" DECIMAL(10,2), "infraestrutura" JSONB,
  "formasIngresso" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Instituicao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Instituicao_cidade_estado_idx" ON "Instituicao"("cidade","estado");
CREATE INDEX "Instituicao_ativo_idx" ON "Instituicao"("ativo");

CREATE TABLE "Curso" (
  "id" SERIAL NOT NULL, "nome" TEXT NOT NULL, "area" TEXT NOT NULL, "descricao" TEXT, "duracaoAnos" DECIMAL(3,1),
  "modalidade" "Modalidade" NOT NULL, "turno" TEXT, "notaEnemMin" DECIMAL(5,2), "salarioMin" DECIMAL(10,2),
  "salarioMedio" DECIMAL(10,2), "salarioMax" DECIMAL(10,2), "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Curso_area_idx" ON "Curso"("area");
CREATE INDEX "Curso_ativo_idx" ON "Curso"("ativo");

CREATE TABLE "Cargo" (
  "id" SERIAL NOT NULL, "nome" TEXT NOT NULL, "area" TEXT NOT NULL, "descricao" TEXT NOT NULL,
  "salarioPiso" DECIMAL(10,2) NOT NULL, "salarioMedio" DECIMAL(10,2) NOT NULL, "salarioTeto" DECIMAL(10,2) NOT NULL,
  "altaDemanda" BOOLEAN NOT NULL DEFAULT false, "hardSkills" TEXT[] NOT NULL, "softSkills" TEXT[] NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Cargo_area_idx" ON "Cargo"("area");
CREATE INDEX "Cargo_altaDemanda_idx" ON "Cargo"("altaDemanda");

CREATE TABLE "CursoInstituicao" (
  "id" SERIAL NOT NULL, "cursoId" INTEGER NOT NULL, "instituicaoId" INTEGER NOT NULL, "modalidade" "Modalidade" NOT NULL,
  "turno" TEXT, "mensalidade" DECIMAL(10,2), "notaCorte" DECIMAL(5,2), "bolsas" BOOLEAN NOT NULL DEFAULT false, "ativo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "CursoInstituicao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CursoInstituicao_cursoId_instituicaoId_modalidade_turno_key" ON "CursoInstituicao"("cursoId","instituicaoId","modalidade","turno");
CREATE INDEX "CursoInstituicao_instituicaoId_idx" ON "CursoInstituicao"("instituicaoId");
CREATE INDEX "CursoInstituicao_cursoId_idx" ON "CursoInstituicao"("cursoId");

CREATE TABLE "TrilhaCargoCurso" (
  "id" SERIAL NOT NULL, "cargoId" INTEGER NOT NULL, "cursoId" INTEGER NOT NULL, "etapa" TEXT NOT NULL, "ordem" INTEGER NOT NULL,
  "descricao" TEXT, CONSTRAINT "TrilhaCargoCurso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrilhaCargoCurso_cargoId_ordem_key" ON "TrilhaCargoCurso"("cargoId","ordem");
CREATE INDEX "TrilhaCargoCurso_cursoId_idx" ON "TrilhaCargoCurso"("cursoId");

CREATE TABLE "Avaliacao" (
  "id" SERIAL NOT NULL, "usuarioId" INTEGER NOT NULL, "instituicaoId" INTEGER NOT NULL, "nota" INTEGER NOT NULL, "comentario" TEXT, "ano" INTEGER?,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Avaliacao_instituicaoId_idx" ON "Avaliacao"("instituicaoId");
CREATE INDEX "Avaliacao_usuarioId_idx" ON "Avaliacao"("usuarioId");

CREATE TABLE "PerguntaVocacional" (
  "id" SERIAL NOT NULL, "pergunta" TEXT NOT NULL, "categoria" TEXT NOT NULL, "opcoes" JSONB NOT NULL, "ordem" INTEGER NOT NULL, "ativo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "PerguntaVocacional_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PerguntaVocacional_ordem_key" ON "PerguntaVocacional"("ordem");

CREATE TABLE "HistoricoTesteVocacional" (
  "id" SERIAL NOT NULL, "usuarioId" INTEGER NOT NULL, "resultadoArea" TEXT NOT NULL, "respostas" JSONB NOT NULL,
  "respondidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "HistoricoTesteVocacional_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HistoricoTesteVocacional_usuarioId_idx" ON "HistoricoTesteVocacional"("usuarioId");
CREATE INDEX "HistoricoTesteVocacional_resultadoArea_idx" ON "HistoricoTesteVocacional"("resultadoArea");

ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistoricoTesteVocacional" ADD CONSTRAINT "HistoricoTesteVocacional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;