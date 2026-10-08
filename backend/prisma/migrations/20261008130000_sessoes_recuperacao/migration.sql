-- Adicao incremental: sessao persistida e tokens de recuperacao armazenados somente por hash.
CREATE TABLE "Sessao" (
  "id" TEXT NOT NULL,
  "usuarioId" INTEGER,
  "adminId" INTEGER,
  "refreshHash" TEXT NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "revogadaEm" TIMESTAMP(3),
  "ultimoUsoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sessao_refreshHash_key" ON "Sessao"("refreshHash");
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");
CREATE INDEX "Sessao_adminId_idx" ON "Sessao"("adminId");
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_ator_check" CHECK (("usuarioId" IS NULL) <> ("adminId" IS NULL));

CREATE TABLE "RecuperacaoSenha" (
  "id" TEXT NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "usadoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecuperacaoSenha_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RecuperacaoSenha_tokenHash_key" ON "RecuperacaoSenha"("tokenHash");
CREATE INDEX "RecuperacaoSenha_usuarioId_idx" ON "RecuperacaoSenha"("usuarioId");
CREATE INDEX "RecuperacaoSenha_expiraEm_idx" ON "RecuperacaoSenha"("expiraEm");
ALTER TABLE "RecuperacaoSenha" ADD CONSTRAINT "RecuperacaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
