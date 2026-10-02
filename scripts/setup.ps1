$ErrorActionPreference = "Stop"

Write-Host "=== LUME | instalação completa ===" -ForegroundColor Yellow
node --version
npm --version

Write-Host "[1/5] Instalando workspaces..." -ForegroundColor Cyan
npm install
Write-Host "[2/5] Gerando Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate
Write-Host "[3/5] Subindo PostgreSQL..." -ForegroundColor Cyan
docker compose up -d postgres
Write-Host "[4/5] Aplicando migration..." -ForegroundColor Cyan
npm run prisma:migrate
Write-Host "[5/5] Populando dados..." -ForegroundColor Cyan
npm run prisma:seed

Write-Host "LUME instalado." -ForegroundColor Green
