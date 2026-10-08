# LUME — GPS de Carreira

Plataforma de apoio à orientação profissional, estudo de carreiras e
comparação de cursos/instituições, desenvolvida como Trabalho de Conclusão de Curso.

## Branches

- **[main](../../tree/main):** entrega estável, publicada somente após CI e revisão.
- **[dev](../../tree/dev):** integrações de sprint, novas rotas e correções.
- **feature/**, **bugfix/**, **release/** e **hotfix/**: branches temporárias via PR, conforme [Git Flow](docs/GIT_FLOW.md).

## Componentes e versões de referência

| Componente | Tecnologia | Versão |
| --- | --- | --- |
| Backend REST | Node.js + Express + TypeScript | LUME 1.1.2 — Node 22.x, Express 5.1.0, TS 5.9.2 |
| ORM | Prisma CLI + Prisma Client | 6.19.0 |
| Banco | PostgreSQL | 16.x (versão da CI) |
| Gerenciador | npm | 10.x |
| Frontend em desenvolvimento | React + Vite + TypeScript | Consulte `frontend/package.json` |
| Testes HTTP | Insomnia | Export v4 |

As versões de dependências **diretas e transitivas do backend** estão
congeladas em `backend/package-lock.json`. Use `npm ci` no backend.
O frontend continua como base/protótipo separado; seu desenvolvimento
não é requisito para exercitar a API no Insomnia.

## Iniciar o backend (PowerShell, Windows)

Requer Node.js 22, npm 10 e PostgreSQL 16 rodando localmente.

```powershell
git clone https://github.com/LucasNPADev/projetoFinal_Lume.git
cd projetoFinal_Lume\backend
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Configure a chave gerada como `JWT_SECRET` e ajuste `DATABASE_URL`
no seu `.env`. Para inserir registros **fictícios**, configure `SEED_DEMO=true`,
somente no banco local de teste.

```powershell
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run typecheck
npm run insomnia:validate
npm test
npm run dev
```

API local: `http://localhost:3333/api`.
Teste inicial: `GET http://localhost:3333/api/health`;
prontidão do banco: `GET http://localhost:3333/api/ready`.

Se estiver trabalhando em uma sprint:
```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
```

## Testes das rotas no Insomnia

Importe **[backend/insomnia.collection.json](backend/insomnia.collection.json)**
no Insomnia, selecione `base_url=http://localhost:3333/api` e siga o
[passo a passo](backend/INSOMNIA.md).

A coleção contém os endpoints de saúde, cadastro/login, sessões,
quiz, cargos/cursos/instituições, trilhas, ofertas, avaliações,
comparações, eventos, favoritos, notificações e administração.

As rotas são efetivamente registradas em
[backend/src/routes/routes.ts](backend/src/routes/routes.ts)
e implementadas em `backend/src/routes/*.routes.ts`.
A CI confere automaticamente a cobertura das rotas pela coleção.

**Atenção:** login normal usa JWT Bearer, refresh usa cookie HttpOnly;
admin tem credenciais e token próprios. Dados de salários,
mensalidades e instituições inseridos pelo seed demo são fictícios.
Nenhuma API pública fica online somente por enviar código ao GitHub.

## Documentação

- [Backend — endpoints e instalação](backend/README.md)
- [Insomnia — guia de teste](backend/INSOMNIA.md)
- [Git Flow e sprints](docs/GIT_FLOW.md)
- [Histórico de versões](CHANGELOG.md)
- [Contribuição](CONTRIBUTING.md)
- [Modelo de Pull Request](.github/PULL_REQUEST_TEMPLATE.md)

A CI do backend instala dependências com `npm ci`,
gera Prisma Client, aplica migrations em PostgreSQL descartável,
executa seed sintético, valida rotas do Insomnia e roda testes.
Para implantação real ainda são necessários dados oficiais,
HTTPS, backups, segredos seguros e revisão de proteção de dados.

## Protecao das branches

As rulesets de `main` e `dev` foram confirmadas ativas no GitHub em 08/10/2026,
com exigencia de PR, checks `Politica Git Flow` e `Backend CI`, sem exclusao
ou force push. Detalhes e verificacao atualizada: [docs/RULESETS.md](docs/RULESETS.md).
O GitFlow usa `feature/* -> dev`, `release/* -> main`, `hotfix/* -> main`
e sempre sincroniza `main -> dev` apos publicar. Branches de trabalho
sao temporarias e podem ser removidas apos merge.
