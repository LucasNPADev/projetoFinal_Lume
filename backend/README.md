# Backend LUME (versao recebida para a branch dev)

Substitui o backend anterior na **dev**, sem promover para a `main`.
Express 5, Prisma 6/PostgreSQL, JWT e Zod. Codigo-fonte trazido de `BACKEND.zip`,
sem publicar `.env` nem `node_modules` da maquina de origem.

## Preparacao

1. Node.js 22, npm e PostgreSQL. `cp .env.example .env` e personalize.
2. Gere segredo seguro para `JWT_SECRET` (32+ caracteres) e configure
   `DATABASE_URL` apontando para **banco novo de desenvolvimento**.
3. Execute: `npm ci`, `npm run prisma:generate`, `npm run prisma:deploy`,
   `npm run seed` (com `ADMIN_EMAIL` e `ADMIN_SENHA` apenas no ambiente local),
   `npm run typecheck`, `npm test` e `npm run dev`.

> **Incompatibilidade de dados:** o schema novo, de 11 modelos e IDs BIGINT,
> nao e compativel com a estrutura antiga, de 19 modelos. A migration de
> inicializacao e somente para um banco vazio. Nunca aplique em um banco antigo
> sem planejar uma migracao de dados e backup; não existem scripts de conversao.

## Rotas (sem /api)

| Metodo | Rota | Perfil |
| --- | --- | --- |
| GET | /health | publico |
| POST | /usuarios | publico |
| POST | /session | publico |
| GET | /cursos | autenticado |
| GET | /cursos/:id | autenticado |
| POST | /cursos | admin |
| POST | /instituicoes | admin |
| POST | /instituicoes/:id/cursos | admin |

Importe a colecao descrita em [INSOMNIA.md](INSOMNIA.md).
**Funcionalidades ausentes em relacao a main:** quizzes, trilhas, favoritos,
notificacoes, avaliacoes, eventos e diversas rotas administrativas anteriores.
O frontend/Insomnia legado precisa adaptar os endpoints. Para producao,
revisar autenticacao, endurecer senha e CORS, limites de requisicoes e plano
de migracao de dados.
