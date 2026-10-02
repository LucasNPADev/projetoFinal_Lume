# LUME — GPS de Carreira

Projeto de TCC para apoiar estudantes, vestibulandos e pessoas em transição de carreira na exploração de profissões, caminhos de formação, cursos e instituições.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- API: REST/JSON
- Versionamento: Git/GitHub

## Domínio

O LUME organiza o fluxo em quatro núcleos principais:

1. **Carreiras:** profissão, área, descrição, faixa salarial, demanda, hard skills e soft skills.
2. **Formação:** cursos e trilhas orientativas relacionadas a cada carreira.
3. **Instituições:** localização, modalidade, cursos, mensalidades, ingresso e avaliações.
4. **Quiz vocacional:** perguntas objetivas, priorização de áreas de afinidade e cursos relacionados. O resultado não elimina possibilidades.

O foco inicial do projeto é a região do Grande ABC, com São Bernardo do Campo como referência.

## Estrutura

```
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
```

## API

### Infraestrutura
- GET `/api/health`

### Autenticação
- POST `/api/auth/register`
- POST `/api/auth/login`

### Usuário
- GET `/api/usuarios/:id` — autenticado
- PUT `/api/usuarios/:id` — autenticado

### Carreiras
- GET `/api/cargos`
- GET `/api/cargos/:id`

Filtros disponíveis: `area`, `busca` e `altaDemanda`.

### Cursos
- GET `/api/cursos`
- GET `/api/cursos/:id`

Filtros disponíveis: `area` e `modalidade`.

### Instituições
- GET `/api/instituicoes`
- GET `/api/instituicoes/:id`
- GET `/api/instituicoes/:id/avaliacoes`
- POST `/api/instituicoes/:id/avaliacoes` — autenticado

Filtros disponíveis: `cidade` e `tipo`.

### Quiz
- GET `/api/quiz/perguntas`
- POST `/api/quiz/resultado`
- GET `/api/quiz/resultado` — autenticado

O POST recebe respostas no formato `{ perguntaId, opcaoIndex }`. O backend calcula o ranking de áreas e retorna cursos relacionados.

## Banco de dados

O Prisma mantém as entidades centrais do projeto: Usuário, Admin, Instituição, Curso, Cargo, relação Curso-Instituição, trilha Cargo-Curso, Avaliação, Pergunta Vocacional e Histórico do Teste Vocacional.

## Execução

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

API: `http://localhost:3333/api`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Sprint 2

A base atual prioriza Banco de Dados & Código Base: Prisma, PostgreSQL, seed, conexão, autenticação, organização em controllers/services/routes, rotas centralizadas, endpoints REST e consumo inicial pelo frontend.
