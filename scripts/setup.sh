#!/usr/bin/env bash
set -euo pipefail
echo "=== LUME | instalação completa ==="
node --version
npm --version
npm install
npm run prisma:generate
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
echo "LUME instalado."
