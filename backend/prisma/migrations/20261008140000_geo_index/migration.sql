-- Suporte a buscas geograficas por bounding box.
CREATE INDEX "Instituicao_latitude_longitude_idx" ON "Instituicao"("latitude", "longitude");
