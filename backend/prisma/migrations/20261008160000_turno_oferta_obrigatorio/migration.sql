-- Torna a chave natural de oferta realmente unica mesmo se o turno era NULL.
-- Havendo duplicatas apos normalizacao, a migration falha sem descartar registros.
UPDATE "CursoInstituicao" SET "turno" = 'Não informado' WHERE "turno" IS NULL;
ALTER TABLE "CursoInstituicao" ALTER COLUMN "turno" SET DEFAULT 'Não informado';
ALTER TABLE "CursoInstituicao" ALTER COLUMN "turno" SET NOT NULL;
