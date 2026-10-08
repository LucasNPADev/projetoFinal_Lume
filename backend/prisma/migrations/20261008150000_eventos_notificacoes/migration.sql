-- Funcionalidades da Sprint 3: calendarios, notificacoes, trilhas favoritas e origem da nota.
CREATE TYPE "TipoEventoIngresso" AS ENUM ('VESTIBULAR', 'ENEM', 'BOLSA', 'OUTRO');
ALTER TABLE "CursoInstituicao" ADD COLUMN "anoNotaCorte" INTEGER, ADD COLUMN "fonteNotaCorte" TEXT;
ALTER TABLE "TrilhaCargoCurso" ADD COLUMN "duracaoMeses" INTEGER;
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_duracao_check" CHECK ("duracaoMeses" IS NULL OR "duracaoMeses" > 0);
ALTER TABLE "CursoInstituicao" ADD CONSTRAINT "CursoInstituicao_nota_ano_check" CHECK ("anoNotaCorte" IS NULL OR "anoNotaCorte" BETWEEN 2000 AND 2100);

CREATE TABLE "FavoritoTrilha" (
  "usuarioId" INTEGER NOT NULL, "trilhaId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoritoTrilha_pkey" PRIMARY KEY ("usuarioId", "trilhaId")
);
CREATE INDEX "FavoritoTrilha_trilhaId_idx" ON "FavoritoTrilha"("trilhaId");
ALTER TABLE "FavoritoTrilha" ADD CONSTRAINT "FavoritoTrilha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritoTrilha" ADD CONSTRAINT "FavoritoTrilha_trilhaId_fkey" FOREIGN KEY ("trilhaId") REFERENCES "TrilhaCargoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EventoIngresso" (
  "id" SERIAL NOT NULL, "titulo" TEXT NOT NULL, "tipo" "TipoEventoIngresso" NOT NULL,
  "descricao" TEXT, "inicio" TIMESTAMP(3) NOT NULL, "fim" TIMESTAMP(3),
  "urlFonte" TEXT NOT NULL, "instituicaoId" INTEGER, "cursoId" INTEGER,
  "ativo" BOOLEAN NOT NULL DEFAULT true, "dadosDemonstracao" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventoIngresso_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventoIngresso_datas_check" CHECK ("fim" IS NULL OR "fim" >= "inicio")
);
CREATE INDEX "EventoIngresso_inicio_ativo_idx" ON "EventoIngresso"("inicio", "ativo");
CREATE INDEX "EventoIngresso_instituicaoId_idx" ON "EventoIngresso"("instituicaoId");
CREATE INDEX "EventoIngresso_cursoId_idx" ON "EventoIngresso"("cursoId");
ALTER TABLE "EventoIngresso" ADD CONSTRAINT "EventoIngresso_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoIngresso" ADD CONSTRAINT "EventoIngresso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Notificacao" (
  "id" SERIAL NOT NULL, "usuarioId" INTEGER NOT NULL, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL, "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lidaEm" TIMESTAMP(3), CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notificacao_usuarioId_criadaEm_idx" ON "Notificacao"("usuarioId", "criadaEm");
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
