# LUME — GPS de Carreira

Projeto de TCC do LUME, uma plataforma para apoiar a descoberta de carreiras e a comparação de cursos e instituições.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- API: REST/JSON

## Estrutura

```
backend/
  prisma/
    migrations/
    seed.ts
  src/
    config/
    controllers/
    routes/
    services/
    middlewares/
    utils/

frontend/
  src/
    components/
    contexts/
    hooks/
    pages/
    routes/
    services/
    styles/
    types/
```

## Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

API: http://localhost:3333/api

Health check: http://localhost:3333/api/health

## Endpoints iniciais

- GET /api/health
- GET /api/cargos
- GET /api/cargos/:id
- GET /api/cursos?area=Saúde
- GET /api/instituicoes?cidade=São Bernardo do Campo
- GET /api/instituicoes/:id
- GET /api/quiz/perguntas
- POST /api/quiz/resultado
- GET /api/usuarios/:id
- PUT /api/usuarios/:id

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Sprint 2

Esta base adapta a estrutura existente para o domínio LUME e prioriza a entrega de Banco de Dados & Código Base: schema lógico no Prisma, migration PostgreSQL, seed, cliente de banco, organização em controllers/services/routes, variáveis de ambiente, health check e primeiros endpoints consumidos pelo frontend.

As telas do protótipo continuam como referência visual para as próximas sprints.