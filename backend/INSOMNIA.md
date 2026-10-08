# Testar o backend no Insomnia — LUME

O repositório contém uma coleção **Insomnia Export v4** com **todas as rotas reais** declaradas em `backend/src/routes/*.routes.ts`, incluindo autenticação, quiz, catálogo, favoritos, ofertas, avaliação, administração e notificações.

Arquivos:
- [insomnia.collection.json](insomnia.collection.json) — importe no aplicativo Insomnia (Import > File)
- [src/routes/routes.ts](src/routes/routes.ts) — registro central dos routers Express
- [scripts/insomnia-contract.test.mjs](scripts/insomnia-contract.test.mjs) — confere automaticamente se todas as rotas estão cobertas
- [README.md](README.md) — referência de contratos, regras e instalação

## Requisitos técnicos

| Dependência | Versão de referência |
| --- | --- |
| Node.js | 22.x (>=22.12.0, <23) |
| npm | 10.x |
| PostgreSQL | 16 (mesma major da CI) |
| Prisma CLI + Client | 6.19.0 em ambos |
| Express | 5.1.0 |
| TypeScript | 5.9.2 |
| Zod | 3.25.76 |
| Insomnia | versão que aceite coleção Export v4 |

As dependências diretas ficam com versões exatas no `backend/package.json`. O comando `npm install` precisa de rede e poderá resolver versões transitivas: **até existir um `package-lock.json` versionado, a árvore de dependências não fica integralmente congelada**. O CI valida instalação/compilação. Não alterar Prisma isoladamente sem atualizar @prisma/client, migrations e testes.

## Iniciar API de testes local

Instale Node 22 e PostgreSQL, inicie um servidor PostgreSQL local, configure `DATABASE_URL`. No PowerShell:

```powershell
cd "$HOME\Downloads\projetoFinal_Lume_gitflow\backend"
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Cole a chave acima no `JWT_SECRET` do arquivo `.env` e configure o PostgreSQL em `DATABASE_URL`. Defina `SEED_DEMO=true` **somente em banco de testes**, nunca em produção.

```powershell
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run typecheck
npm run insomnia:validate
npm run dev
```

Antes de usar um banco com dados reais, faça backup e revisões; a migration existente pode rejeitar registros duplicados em vez de apagá-los.

## Importar e executar

1. Abra Insomnia > **Import/Export > Import Data > From File** (texto exato pode variar por versão); selecione `backend/insomnia.collection.json`.
2. Selecione o ambiente **Base Environment**. Confira `base_url = http://localhost:3333/api`.
3. Execute **00 - Saúde e conexão > GET /api/health** e depois `GET /api/ready`. O primeiro deve retornar status `ok`; o segundo depende do PostgreSQL.
4. Execute **01 - Autenticação > POST /api/auth/cadastro** ou login. Em `POST /api/auth/login`, copie o valor `token` da resposta JSON e cole na variável de ambiente `token`.
5. Para login admin, execute `POST /api/auth/admin/login`. Crie o administrador **localmente**, primeiro configurando `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env`, executando `npm run prisma:seed`, e depois removendo essas variáveis. Copie o token do login admin para `admin_token`.
6. Atualize no ambiente os IDs (`cargo_id`, `curso_id`, `instituicao_id`, `oferta_id`, etc.) conforme os registros retornados pelos GETs de catálogo. Os números são **exemplos**, não IDs garantidos.
7. Para quiz, consulte `GET /api/quiz/perguntas`, copie os IDs reais e envie uma resposta para **cada pergunta ativa** em `POST /api/quiz/resultado`. O body de exemplo pressupõe 12 perguntas do seed, com IDs consecutivos. Se o banco mudou, ajuste-o.
8. Cadastre/edite dados DEMO em ambiente separado. Avaliações entram como `PENDENTE` e só ficam públicas após a aprovação por admin. Teste favoritos + edição de oferta para verificar novas notificações.

**Importante:** nas solicitações protegidas, o header é `Authorization: Bearer <token>`; a coleção usa `token` para estudante e `admin_token` para admin. O cliente Insomnia armazena o cookie HttpOnly retornado pelo login: `POST /api/auth/refresh` depende desse cookie, e não de um JWT no body.

## Respostas esperadas e problemas comuns

| Resultado | Significado |
| --- | --- |
| `200/201` | Consulta ou alteração concluída |
| `204` | Alteração/exclusão concluída sem body |
| `400` | Body, ID ou filtros inválidos |
| `401` | JWT ausente, inválido, expirado ou sessão revogada |
| `403` | Usuário sem permissão; a ação precisa de admin ou dono |
| `404` | Registro/rota inexistente ou inativa |
| `409` | Conflito de registro único |
| `429` | Rate limit: muitas chamadas em pouco tempo |
| `503` | Quiz não configurado corretamente ou SMTP de recuperação indisponível |

O Insomnia testa o **servidor local**, não o repositório GitHub. O GitHub armazena código, não executa uma API permanente. Para disponibilizar endpoints fora da sua máquina é necessário realizar um deploy e configurar banco, HTTPS e variáveis de ambiente.

## Conferência de rotas

```powershell
cd backend
npm run insomnia:validate
```

A verificação inspeciona todos os arquivos `src/routes/*.routes.ts`, incluindo os routers aninhados de favoritos e notificações, e falha quando a coleção não cobre uma rota ou contém endpoints inexistentes. Também valida IDs e corpos JSON. O GitHub Actions roda essa checagem automaticamente nos PRs.
