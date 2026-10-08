# Histórico de versões — LUME

## v1.1.2 — 08/10/2026

**Hotfix de automação GitHub Actions:** corrige a leitura do evento de
execução pelo caminho oficial `GITHUB_EVENT_PATH`, garantindo que o
workflow de tags e o de limpeza de branches sejam executados. Em caso
de falha anterior, a tarefa de tag reconcilia versões já mescladas sem
sobrescrever tags existentes. Hotfix publicado pelo fluxo
`hotfix/* -> main -> dev`. Nenhuma alteração de endpoints, Prisma ou
lógica de negócio.

## v1.1.1 — 08/10/2026

**Correções de processo e reprodutibilidade de GitFlow** (sem alteração
das rotas HTTP, schema Prisma, frontend ou aplicativo móvel):

- `main` e `dev` mantidas como únicas branches permanentes e protegidas
  por rulesets ativos, com PR obrigatório, sem force push e sem exclusão;
- CI de Git Flow e integração PostgreSQL exigidas nas duas branches;
- sincronização `main -> dev` pelo PR #6, após a integração do PR #5;
- espelhos JSON atualizados conforme rulesets ativos; utilitário PowerShell
  consulta por padrão e só altera regras quando recebe `-Apply`;
- limpeza segura de branches temporárias após PRs mesclados;
- release preparada a partir de `dev` e publicada para `main` via PR;
- versão do backend atualizada de 1.1.0 para 1.1.1 sem atualizar suas
  dependências, preservando o lockfile npm;
- processo de criação de tag `v1.1.1` automatizado na `main`.

## v1.1.0 — 08/10/2026

- Backend Express/Prisma com autenticação JWT, usuários, catálogos,
  quiz, avaliações, favoritos, eventos, notificações e administração.
- Coleção Insomnia com 67 requisições e validação automatizada de rotas.
- `package-lock.json` para instalação reproduzível com `npm ci`.
- Testes automatizados de TypeScript, migrations e PostgreSQL.

Dados iniciais demonstrativos não equivalem a informações oficiais.
