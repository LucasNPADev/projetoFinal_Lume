# LUME — GPS de Carreira

Projeto de TCC para apoiar estudantes, vestibulandos e pessoas em transição de carreira na exploração de profissões, caminhos de formação, cursos e instituições.

## Stack documentada

- Frontend Web: React + TypeScript + Vite
- Mobile: React Native + Expo + TypeScript
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- API: REST/JSON
- Administração/inspeção de banco: Beekeeper Studio
- Versionamento: Git/GitHub

## Fonte de verdade do domínio

O modelo físico implementado deve ser lido junto com:

- docs/banco/01-modelagem-fisica.md
- docs/banco/02-dicionario-fisico.md
- docs/CONTRATO-DE-DADOS.md
- docs/arquitetura/01-arquitetura.md
- docs/software/01-uml-classes.md

O Prisma e a migration não inventam entidades fora do MER fornecido.

## Domínio

1. Carreiras: profissão, área, descrição, faixa salarial, salário de referência, hard skills e soft skills.
2. Formação: cursos e trilhas orientativas relacionadas a cada carreira.
3. Instituições: localização, cursos ofertados, mensalidades, ingresso, notas e avaliações.
4. Quiz vocacional: perguntas, priorização de áreas de afinidade e cursos relacionados. O resultado não elimina outras possibilidades.

O foco inicial do projeto é o Grande ABC, com São Bernardo do Campo como referência.

## Estrutura

backend/
  prisma/
    migrations/
    schema.prisma
    seed.ts
  src/
    config/
    controllers/
    middlewares/
    routes/
      routes.ts
    services/

frontend/
  src/
    contexts/
    pages/
    routes/
    services/
    styles/

mobile/
  src/
  App.tsx
  app.json
  package.json

docs/
  banco/
  arquitetura/
  software/
  governanca/
  poc/

## API

### Infraestrutura
- GET /api/health

### Autenticação
- POST /api/auth/register
- POST /api/auth/login

### Usuário
- GET /api/usuarios/:id — autenticado
- PUT /api/usuarios/:id — autenticado

### Carreiras
- GET /api/cargos
- GET /api/cargos/:id

Filtros: area e busca.

### Cursos
- GET /api/cursos
- GET /api/cursos/:id

Filtros: area e modalidade.

### Instituições
- GET /api/instituicoes
- GET /api/instituicoes/:id
- GET /api/instituicoes/:id/avaliacoes
- POST /api/instituicoes/:id/avaliacoes — autenticado

Filtro: cidade e status.

### Quiz
- GET /api/quiz/perguntas
- POST /api/quiz/resultado
- GET /api/quiz/resultado — autenticado

O POST recebe respostas no formato { perguntaId, opcaoIndex }.

## Banco de dados

As dez entidades físicas da Sprint 2 são:

usuario, instituicao, admin, curso, cargo, trilhaCargoCurso, Curso_inst, avaliacao, perguntaVocacional e historicoTesteVocacional.

A estrutura executável está em backend/prisma/schema.prisma e backend/prisma/migrations/20261002000000_init_lume/migration.sql.

O seed reproduz uma base mínima de POC.

## Execução

### Backend

cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev

API: http://localhost:3333/api

### Frontend Web

cd frontend
npm install
cp .env.example .env
npm run dev

### Mobile

cd mobile
npm install
cp .env.example .env
npm start

Para Android Emulator, EXPO_PUBLIC_API_URL usa 10.0.2.2 para acessar o backend local.

## Sprint 2

A base atual prioriza Banco de Dados & Código Base: modelagem física, dicionário, migration/DDL, seed, conexão, autenticação, organização em controllers/services/routes, primeiras operações REST, frontend web e aplicativo móvel.

## Limites de modelagem

Os requisitos mencionam favoritos, notificações, vestibulares, simulador ENEM, denúncias/moderação, relatórios e auditoria. Como essas entidades não estão presentes no MER físico fornecido, elas não foram transformadas em tabelas fictícias nesta Sprint 2. A ampliação deve ocorrer por revisão formal do DER/dicionário e nova migration.

## Instalação completa

O repositório possui um workspace raiz para instalar backend, frontend e mobile de uma vez:

    npm install
    npm run prisma:generate
    docker compose up -d postgres
    npm run prisma:migrate
    npm run prisma:seed

Scripts auxiliares: scripts/setup.ps1 (Windows) e scripts/setup.sh (Linux/macOS).

A instalação local inclui node_modules, Prisma Client e, opcionalmente, imagens/volumes Docker. Esses artefatos não são versionados no Git. Portanto, o tamanho da pasta local após a instalação será muito maior que o tamanho dos arquivos do repositório, mas varia conforme o ambiente.
