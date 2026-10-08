# Como contribuir para o LUME

O LUME segue o modelo [Git Flow](docs/GIT_FLOW.md).
Use `main` para versoes estaveis e `dev` para integrar as sprints.

1. Confira `git remote -v` e atualize a `dev`.
2. Abra `feature/<slug>` ou `bugfix/<slug>` a partir de `dev`.
3. Faca commits pequenos, com prefixos sugeridos: `feat:`,
   `fix:`, `docs:`, `test:`, `ci:` e `chore:`.
4. Abra PR para `dev` e preencha o template do repositorio.
5. Espere verificacoes e revisao antes do merge.
6. Para estabilizar, use `release/x.y.z`; para emergencia,
   `hotfix/x.y.z`. Ambos devem voltar a `dev`.

No backend, trabalhe em `backend/` e execute
`npm install`, `npm run prisma:generate`,
`npm run typecheck`, `npm run build` e `npm test`.
O CI do backend usa PostgreSQL e migrations reais com seed sintetico.
Nunca inclua segredos, `.env` de verdade ou dados pessoais.

O workflow de Git Flow valida os PRs, mas so as regras do
GitHub (Settings > Rules > Rulesets) podem bloquear pushes diretos.
