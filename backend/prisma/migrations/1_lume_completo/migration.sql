BEGIN;
-- Reconcilia o perfil do DER com as versões anteriores do backend.
DO $$ DECLARE c RECORD; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='"Usuario"'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%perfil%'
 LOOP EXECUTE format('ALTER TABLE "Usuario" DROP CONSTRAINT %I',c.conname); END LOOP;
END $$;
UPDATE "Usuario" SET perfil=CASE WHEN upper(perfil)='ADMIN' THEN 'admin' ELSE 'usuario' END;
-- Não remove nem renumera etapas antigas. Duplicidades exigem correção antes da migração.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM "TrilhaCargoCurso" GROUP BY id_cargo,id_curso HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM "TrilhaCargoCurso" GROUP BY id_cargo,ordem_etapa HAVING count(*)>1)
 THEN RAISE EXCEPTION 'Trilhas antigas duplicadas: corrija cursos/ordens repetidos antes de atualizar o banco.'; END IF;
END $$;
-- As alternativas passam a ter unicidade dentro de cada rota.
DO $$ DECLARE c RECORD; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='"TrilhaCargoCurso"'::regclass AND contype='u'
 AND pg_get_constraintdef(oid) IN ('UNIQUE (id_cargo, id_curso)','UNIQUE (id_cargo, ordem_etapa)')
 LOOP EXECUTE format('ALTER TABLE "TrilhaCargoCurso" DROP CONSTRAINT %I',c.conname); END LOOP;
END $$;
-- DropForeignKey
ALTER TABLE "Cargo" DROP CONSTRAINT IF EXISTS "Cargo_id_usuario_cadastrador_fkey";

-- DropForeignKey
ALTER TABLE "Curso" DROP CONSTRAINT IF EXISTS "Curso_id_usuario_cadastrador_fkey";

-- DropForeignKey
ALTER TABLE "Instituicao" DROP CONSTRAINT IF EXISTS "Instituicao_id_usuario_cadastrador_fkey";

-- DropForeignKey
ALTER TABLE "ConsultaCurso" DROP CONSTRAINT IF EXISTS "ConsultaCurso_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "ConsultaCargo" DROP CONSTRAINT IF EXISTS "ConsultaCargo_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "Avaliacao" DROP CONSTRAINT IF EXISTS "Avaliacao_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "PerguntaVocacional" DROP CONSTRAINT IF EXISTS "PerguntaVocacional_id_usuario_cadastrador_fkey";

-- DropForeignKey
ALTER TABLE "HistoricoTesteVocacional" DROP CONSTRAINT IF EXISTS "HistoricoTesteVocacional_id_usuario_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "consentimento_gps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "origem_localizacao" VARCHAR(10) NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "termos_aceitos_em" TIMESTAMPTZ,
ADD COLUMN     "versao_termos" VARCHAR(30),
ALTER COLUMN "perfil" SET DEFAULT 'usuario';

-- AlterTable
ALTER TABLE "Cargo" ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_fonte" BIGINT,
ADD COLUMN     "panorama_mercado" TEXT,
ADD COLUMN     "salario_media" DECIMAL(12,2),
ADD COLUMN     "salario_piso" DECIMAL(12,2),
ADD COLUMN     "salario_teto" DECIMAL(12,2),
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "id_usuario_cadastrador" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "duracao_meses" INTEGER,
ADD COLUMN     "grade_curricular" TEXT,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "id_usuario_cadastrador" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Instituicao" ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "natureza" VARCHAR(10) NOT NULL DEFAULT 'PRIVADA',
ADD COLUMN     "regular_mec" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "site" VARCHAR(2048),
ALTER COLUMN "id_usuario_cadastrador" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Curso_Instituicao" ADD COLUMN     "ano_nota_corte" INTEGER,
ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "bolsas" TEXT,
ADD COLUMN     "fies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id_fonte_nota" BIGINT,
ADD COLUMN     "mensalidade_max" DECIMAL(10,2),
ADD COLUMN     "polo_bairro" VARCHAR(100),
ADD COLUMN     "polo_cidade" VARCHAR(100),
ADD COLUMN     "polo_estado" CHAR(2),
ADD COLUMN     "polo_latitude" DECIMAL(10,7),
ADD COLUMN     "polo_longitude" DECIMAL(10,7),
ADD COLUMN     "polo_nome" VARCHAR(200),
ADD COLUMN     "polo_rua" VARCHAR(200),
ADD COLUMN     "programa_nota_corte" VARCHAR(30),
ADD COLUMN     "prouni" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrilhaCargoCurso" ADD COLUMN     "id_rota" BIGINT;

-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "id_curso" BIGINT,
ADD COLUMN     "motivo_moderacao" TEXT,
ADD COLUMN     "nota" INTEGER,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'PUBLICADA';

-- AlterTable
ALTER TABLE "PerguntaVocacional" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "id_usuario_cadastrador" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HistoricoTesteVocacional" ALTER COLUMN "pontuacao_detalhada" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "FonteDados" (
    "id_fonte" BIGSERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "orgao" VARCHAR(150) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "consultado_em" TIMESTAMPTZ NOT NULL,
    "demonstracao" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FonteDados_pkey" PRIMARY KEY ("id_fonte")
);

-- CreateTable
CREATE TABLE "RotaFormacao" (
    "id_rota" BIGSERIAL NOT NULL,
    "id_cargo" BIGINT NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RotaFormacao_pkey" PRIMARY KEY ("id_rota")
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id_denuncia" BIGSERIAL NOT NULL,
    "id_avaliacao" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
    "resposta" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id_denuncia")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id_sessao" UUID NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "refresh_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "revogada_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id_sessao")
);

-- CreateTable
CREATE TABLE "RecuperacaoSenha" (
    "id_recuperacao" UUID NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "usado_em" TIMESTAMPTZ,

    CONSTRAINT "RecuperacaoSenha_pkey" PRIMARY KEY ("id_recuperacao")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id_favorito" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "tipo" VARCHAR(15) NOT NULL,
    "alvo_id" BIGINT NOT NULL,
    "id_cargo" BIGINT,
    "id_curso" BIGINT,
    "id_instituicao" BIGINT,
    "id_rota" BIGINT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id_favorito")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id_evento" BIGSERIAL NOT NULL,
    "id_instituicao" BIGINT,
    "titulo" VARCHAR(200) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "inicio" TIMESTAMPTZ NOT NULL,
    "fim" TIMESTAMPTZ,
    "descricao" TEXT,
    "url" VARCHAR(2048) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id_notificacao" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "alvo_id" BIGINT,
    "lida_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id_notificacao")
);

-- Preserva as etapas existentes em uma rota identificada como original.
INSERT INTO "RotaFormacao" (id_cargo,nome,descricao)
 SELECT DISTINCT id_cargo,'Rota original','Importada do DER anterior' FROM "TrilhaCargoCurso";
UPDATE "TrilhaCargoCurso" t SET id_rota=r.id_rota FROM "RotaFormacao" r WHERE t.id_cargo=r.id_cargo;
ALTER TABLE "TrilhaCargoCurso" ALTER COLUMN id_rota SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RotaFormacao_id_cargo_nome_key" ON "RotaFormacao"("id_cargo", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Denuncia_id_usuario_id_avaliacao_key" ON "Denuncia"("id_usuario", "id_avaliacao");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_refresh_hash_key" ON "Sessao"("refresh_hash");

-- CreateIndex
CREATE INDEX "Sessao_id_usuario_idx" ON "Sessao"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "RecuperacaoSenha_token_hash_key" ON "RecuperacaoSenha"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_id_usuario_tipo_alvo_id_key" ON "Favorito"("id_usuario", "tipo", "alvo_id");

-- CreateIndex
CREATE INDEX "Evento_status_inicio_idx" ON "Evento"("status", "inicio");

-- CreateIndex
CREATE INDEX "Notificacao_id_usuario_criado_em_idx" ON "Notificacao"("id_usuario", "criado_em");

-- CreateIndex
CREATE INDEX "Cargo_status_area_atuacao_idx" ON "Cargo"("status", "area_atuacao");

-- CreateIndex
CREATE INDEX "Curso_status_area_curso_modalidade_idx" ON "Curso"("status", "area_curso", "modalidade");

-- CreateIndex
CREATE INDEX "Instituicao_status_regular_mec_cidade_estado_idx" ON "Instituicao"("status", "regular_mec", "cidade", "estado");

-- CreateIndex
CREATE INDEX "Curso_Instituicao_status_id_curso_idx" ON "Curso_Instituicao"("status", "id_curso");

-- CreateIndex
CREATE INDEX "TrilhaCargoCurso_id_cargo_id_curso_idx" ON "TrilhaCargoCurso"("id_cargo", "id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "TrilhaCargoCurso_id_rota_id_curso_key" ON "TrilhaCargoCurso"("id_rota", "id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "TrilhaCargoCurso_id_rota_ordem_etapa_key" ON "TrilhaCargoCurso"("id_rota", "ordem_etapa");

-- CreateIndex
CREATE INDEX "ConsultaCurso_id_usuario_data_consulta_idx" ON "ConsultaCurso"("id_usuario", "data_consulta");

-- CreateIndex
CREATE INDEX "ConsultaCargo_id_usuario_data_consulta_idx" ON "ConsultaCargo"("id_usuario", "data_consulta");

-- CreateIndex
CREATE INDEX "Avaliacao_id_instituicao_status_idx" ON "Avaliacao"("id_instituicao", "status");

-- CreateIndex
CREATE INDEX "HistoricoTesteVocacional_id_usuario_data_realizada_idx" ON "HistoricoTesteVocacional"("id_usuario", "data_realizada");

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_id_fonte_fkey" FOREIGN KEY ("id_fonte") REFERENCES "FonteDados"("id_fonte") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso_Instituicao" ADD CONSTRAINT "Curso_Instituicao_id_fonte_nota_fkey" FOREIGN KEY ("id_fonte_nota") REFERENCES "FonteDados"("id_fonte") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaFormacao" ADD CONSTRAINT "RotaFormacao_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "Cargo"("id_cargo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "TrilhaCargoCurso_id_rota_fkey" FOREIGN KEY ("id_rota") REFERENCES "RotaFormacao"("id_rota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCurso" ADD CONSTRAINT "ConsultaCurso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaCargo" ADD CONSTRAINT "ConsultaCargo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_id_avaliacao_fkey" FOREIGN KEY ("id_avaliacao") REFERENCES "Avaliacao"("id_avaliacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaVocacional" ADD CONSTRAINT "PerguntaVocacional_id_usuario_cadastrador_fkey" FOREIGN KEY ("id_usuario_cadastrador") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoTesteVocacional" ADD CONSTRAINT "HistoricoTesteVocacional_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecuperacaoSenha" ADD CONSTRAINT "RecuperacaoSenha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "Cargo"("id_cargo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_id_instituicao_fkey" FOREIGN KEY ("id_instituicao") REFERENCES "Instituicao"("id_instituicao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_id_rota_fkey" FOREIGN KEY ("id_rota") REFERENCES "RotaFormacao"("id_rota") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_id_instituicao_fkey" FOREIGN KEY ("id_instituicao") REFERENCES "Instituicao"("id_instituicao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;


-- Restrições físicas do DER e dos campos adicionados.
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfil_lume_check" CHECK (perfil IN ('usuario','admin'));
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_geo_lume_check" CHECK ((latitude IS NULL)=(longitude IS NULL) AND (latitude IS NULL OR latitude BETWEEN -90 AND 90) AND (longitude IS NULL OR longitude BETWEEN -180 AND 180));
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_gps_lume_check" CHECK (origem_localizacao IN ('MANUAL','GPS') AND (origem_localizacao<>'GPS' OR (consentimento_gps AND latitude IS NOT NULL AND longitude IS NOT NULL)));
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_horas_lume_check" CHECK (carga_horaria>0 AND (duracao_meses IS NULL OR duracao_meses>0));
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_salarios_lume_check" CHECK ((salario IS NULL OR salario>=0) AND (salario_piso IS NULL OR salario_piso>=0) AND (salario_media IS NULL OR salario_media>=salario_piso) AND (salario_teto IS NULL OR salario_teto>=salario_media));
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_mec_lume_check" CHECK ((nota_mec IS NULL OR nota_mec BETWEEN 1 AND 5) AND natureza IN ('PUBLICA','PRIVADA'));
ALTER TABLE "Instituicao" ADD CONSTRAINT "Instituicao_geo_lume_check" CHECK ((latitude IS NULL)=(longitude IS NULL) AND (latitude IS NULL OR latitude BETWEEN -90 AND 90) AND (longitude IS NULL OR longitude BETWEEN -180 AND 180));
ALTER TABLE "Curso_Instituicao" ADD CONSTRAINT "Oferta_valores_lume_check" CHECK ((mensalidade IS NULL OR mensalidade>=0) AND (mensalidade_max IS NULL OR mensalidade_max>=mensalidade) AND (nota_corte IS NULL OR nota_corte BETWEEN 0 AND 1000));
ALTER TABLE "Curso_Instituicao" ADD CONSTRAINT "Oferta_geo_lume_check" CHECK ((polo_latitude IS NULL)=(polo_longitude IS NULL) AND (polo_latitude IS NULL OR polo_latitude BETWEEN -90 AND 90) AND (polo_longitude IS NULL OR polo_longitude BETWEEN -180 AND 180));
ALTER TABLE "TrilhaCargoCurso" ADD CONSTRAINT "Trilha_ordem_lume_check" CHECK (ordem_etapa>0);
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_nota_lume_check" CHECK ((nota IS NULL OR nota BETWEEN 1 AND 5) AND status IN ('PUBLICADA','OCULTA'));
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_alvo_lume_check" CHECK (
 (tipo='CARGO' AND id_cargo=alvo_id AND id_cargo IS NOT NULL AND id_curso IS NULL AND id_instituicao IS NULL AND id_rota IS NULL) OR
 (tipo='CURSO' AND id_curso=alvo_id AND id_curso IS NOT NULL AND id_cargo IS NULL AND id_instituicao IS NULL AND id_rota IS NULL) OR
 (tipo='INSTITUICAO' AND id_instituicao=alvo_id AND id_instituicao IS NOT NULL AND id_cargo IS NULL AND id_curso IS NULL AND id_rota IS NULL) OR
 (tipo='ROTA' AND id_rota=alvo_id AND id_rota IS NOT NULL AND id_cargo IS NULL AND id_curso IS NULL AND id_instituicao IS NULL));
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_datas_lume_check" CHECK (fim IS NULL OR fim>=inicio);
ALTER TABLE "Usuario" ALTER COLUMN atualizado_em DROP DEFAULT;
ALTER TABLE "Cargo" ALTER COLUMN atualizado_em DROP DEFAULT;
ALTER TABLE "Curso" ALTER COLUMN atualizado_em DROP DEFAULT;
ALTER TABLE "Instituicao" ALTER COLUMN atualizado_em DROP DEFAULT;
ALTER TABLE "Curso_Instituicao" ALTER COLUMN atualizado_em DROP DEFAULT;
COMMIT;
