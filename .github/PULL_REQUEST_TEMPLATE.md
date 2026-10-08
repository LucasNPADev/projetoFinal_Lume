## Objetivo e contexto

<!-- O que mudou? Relacione com issue/requisito/sprint do TCC. -->

**Issue / Sprint:**
**Tipo:** feature / bugfix / release / hotfix / docs / ci

## Git Flow

- [ ] Destino correto: trabalho normal -> `dev`; somente `release/*` ou `hotfix/*` -> `main`
- [ ] `feature/*` nasceu de `dev`; `release/*` nasceu de `dev`; `hotfix/*` nasceu de `main`
- [ ] Release/hotfix tambem sera integrado de volta a `dev` (incluindo correcoes aplicadas)
- [ ] Nao altera uma migration antiga aplicada nem reescreve historico

## Testes e qualidade

- [ ] CI / Politica Git Flow aprovou este PR
- [ ] Executei os testes relevantes e descrevi os resultados
- [ ] Se backend: Prisma + migration, typecheck, build, testes
- [ ] Se API: documentacao e Postman atualizados
- [ ] Sem `.env`, credenciais ou dados pessoais sensiveis
- [ ] Possiveis riscos e rollback avaliados

**Como testar:**

**Resultados dos testes:**

**Riscos / observacoes:**

## Revisao

- [ ] Reviewer conferiu o destino e os requisitos
- [ ] Reviewer conferiu os cenarios de autorizacao e regressao
