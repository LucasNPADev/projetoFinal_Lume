-- Migracao incremental: nao modificar a migration 20261002000000_init_lume.
CREATE TYPE "StatusAvaliacao" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');
CREATE TYPE "StatusDenuncia" AS ENUM ('PENDENTE', 'RESOLVIDA', 'DESCARTADA');

ALTER TABLE "Cargo" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "fonteSalario" TEXT, ADD COLUMN "referenciaSalario" TIMESTAMP(3);
ALTER TABLE "Instituicao" ADD COLUMN "fonteDados" TEXT,
ADD COLUMN "dadosDemonstracao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrilhaCargoCurso" ADD COLUMN "rota" TEXT NOT NULL DEFAULT 'principal';
ALTER TABLE "Avaliacao" ADD COLUMN "status" "StatusAvaliacao" NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "HistoricoTesteVocacional" ADD COLUMN "pontuacoes" JSONB,
ADD COLUMN "versaoInstrumento" TEXT NOT NULL DEFAULT '2026-10-v1';

-- Falha explicitamente diante de duplicatas, evitando apagar avaliacoes reais.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Avaliacao" GROUP BY "usuarioId", "instituicaoId" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Ha avaliacoes duplicadas por usuario/instituicao. Resolva manualmente antes da migracao.';
  END IF;
END $$;

DROP INDEX "TrilhaCargoCurso_cargoId_ordem_key";
CREATE UNIQUE INDEX "TrilhaCargoCurso_cargoId_rota_ordem_key" ON "TrilhaCargoCurso"("cargoId", "rota", "ordem");
CREATE UNIQUE INDEX "Avaliacao_usuarioId_instituicaoId_key" ON "Avaliacao"("usuarioId","instituicaoId");
DROP INDEX "Avaliacao_instituicaoId_idx";
CREATE INDEX "Avaliacao_instituicaoId_status_idx" ON "Avaliacao"("instituicaoId","status");
DROP INDEX "HistoricoTesteVocacional_usuarioId_idx";
CREATE INDEX "HistoricoTesteVocacional_usuarioId_respondidoEm_idx" ON "HistoricoTesteVocacional"("usuarioId","respondidoEm");
CREATE INDEX "Cargo_ativo_idx" ON "Cargo"("ativo");

-- Integridade valida tambem acessos fora da API.
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_nota_check" CHECK ("nota" BETWEEN 1 AND 5);
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_latitude_check" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_longitude_check" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_mensalidade_check" CHECK ("mensalidadeMin" IS NULL OR "mensalidadeMin" >= 0);
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_mensalidade_max_check" CHECK ("mensalidadeMax" IS NULL OR "mensalidadeMax" >= 0);
ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_mensalidade_check" CHECK ("mensalidade" IS NULL OR "mensalidade" >= 0);
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_ordem_check" CHECK ("ordem" > 0);
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_salarios_check" CHECK ("salarioPiso" >= 0 AND "salarioPiso" <= "salarioMedio" AND "salarioMedio" <= "salarioTeto");

CREATE TABLE "FavoritoCargo" (
  "usuarioId" INTEGER NOT NULL, "cargoId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoritoCargo_pkey" PRIMARY KEY ("usuarioId", "cargoId")
);
CREATE INDEX "FavoritoCargo_cargoId_idx" ON "FavoritoCargo"("cargoId");
ALTER TABLE "FavoritoCargo" ADD CONSTRAINT "FavoritoCargo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritoCargo" ADD CONSTRAINT "FavoritoCargo_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FavoritoCurso" (
  "usuarioId" INTEGER NOT NULL, "cursoId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoritoCurso_pkey" PRIMARY KEY ("usuarioId", "cursoId")
);
CREATE INDEX "FavoritoCurso_cursoId_idx" ON "FavoritoCurso"("cursoId");
ALTER TABLE "FavoritoCurso" ADD CONSTRAINT "FavoritoCurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritoCurso" ADD CONSTRAINT "FavoritoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FavoritoInstituicao" (
  "usuarioId" INTEGER NOT NULL, "instituicaoId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoritoInstituicao_pkey" PRIMARY KEY ("usuarioId", "instituicaoId")
);
CREATE INDEX "FavoritoInstituicao_instituicaoId_idx" ON "FavoritoInstituicao"("instituicaoId");
ALTER TABLE "FavoritoInstituicao" ADD CONSTRAINT "FavoritoInstituicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritoInstituicao" ADD CONSTRAINT "FavoritoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DenunciaAvaliacao" (
  "id" SERIAL NOT NULL, "usuarioId" INTEGER NOT NULL, "avaliacaoId" INTEGER NOT NULL,
  "motivo" TEXT NOT NULL, "status" "StatusDenuncia" NOT NULL DEFAULT 'PENDENTE',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvidoEm" TIMESTAMP(3),
  CONSTRAINT "DenunciaAvaliacao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DenunciaAvaliacao_usuarioId_avaliacaoId_key" ON "DenunciaAvaliacao"("usuarioId","avaliacaoId");
CREATE INDEX "DenunciaAvaliacao_status_idx" ON "DenunciaAvaliacao"("status");
ALTER TABLE "DenunciaAvaliacao" ADD CONSTRAINT "DenunciaAvaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DenunciaAvaliacao" ADD CONSTRAINT "DenunciaAvaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integridade para registros antigos e novos.
ALTER TABLE "CursoInstituicao" DROP CONSTRAINT "CursoInstituicao_cursoId_fkey";
ALTER TABLE "CursoInstituicao" DROP CONSTRAINT "CursoInstituicao_instituicaoId_fkey";
ALTER TABLE "TrilhaCargoCurso" DROP CONSTRAINT "TrilhaCargoCurso_cargoId_fkey";
ALTER TABLE "TrilhaCargoCurso" DROP CONSTRAINT "TrilhaCargoCurso_cursoId_fkey";
ALTER TABLE "Avaliacao" DROP CONSTRAINT "Avaliacao_instituicaoId_fkey";
ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
