# Instalação completa do LUME

O projeto é um monorepo com backend, frontend e mobile, usando PostgreSQL como banco.

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker Desktop para PostgreSQL
- Expo Go ou emulador para o mobile

## Instalação

Na raiz do projeto:

    npm install
    npm run prisma:generate
    docker compose up -d postgres
    npm run prisma:migrate
    npm run prisma:seed

No Windows, também existe scripts/setup.ps1.

## Execução

    npm run dev:backend
    npm run dev:frontend
    npm run dev:mobile

## Sobre tamanho

node_modules, imagens Docker e o volume PostgreSQL não devem ser versionados no Git. Eles aumentam o tamanho da instalação local de forma legítima. O tamanho exato varia por sistema operacional, arquitetura e versões resolvidas pelo npm.

O repositório não deve ser inflado artificialmente apenas para atingir 800 MB.
