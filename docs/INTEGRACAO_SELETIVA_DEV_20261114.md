# Auditoria de integração seletiva — LUME (14/11/2026)

**Destino:** `dev`; origem principal: `feature/finalizacao-testes-lume` (`235e2e301f9abca746d9b993e2e17026665367dd`). Essa origem já contém `bugfix/atualizacao-lume` e `feature/testes-lume` por ancestralidade; não fazer merge duplicado dessas duas branches.
**Base preservada:** `dev` (`574e02c43d30b3b2abd5c6af5f31ee7006180cc0`). `main` e branches originais não são modificadas.

## Classificação do que foi mantido, substituído ou excluído

| Categoria | Decisão | Motivo |
|---|---|---|
| API Express, controllers, services, schemas, Prisma, Web React/Vite e Mobile Expo | **Integrar da origem final** | Compõem a versão funcional mais completa, mantendo os contratos de código correspondentes. |
| Testes CT001–CT013 para Web e API | **Integrar** | Rastreabilidade dos fluxos; aprovação ainda depende de execução de CI/ambiente de testes. |
| `.github/`, `docs/` e `insomnia/` da `dev` | **Preservar** | Não apagar governança, CI nem coleção histórica de API. |
| `feature/sprint4-organizacao` | **Importar apenas checklist de governança** | Reservas vazias `.gitkeep` e proposta de Next.js não refletem a implementação React/Vite atual. |
| `SiteResistration.tsx` | **Não importar** | Arquivo de cadastro duplicado, com grafia incorreta, não referenciado pelas rotas. A página real é `SiteRegistrationPage.tsx`. |
| Mock `mock-jwt-token` do frontend | **Remover** | Uma falha de rede não pode criar autenticação falsa; a interface agora exibe erro. |
| Controllers e serviços obsoletos da `dev` | **Substituir apenas quando ausentes na versão nova** | Evitar imports, contratos e tipos incompatíveis no compilador. |
| Migração `0_base` da origem | **Não importar** | É estruturalmente equivalente ao baseline já aplicado na `dev`, porém tem outro nome: aplicá-la novamente recriaria tabelas. |
| Migração incremental `1_lume_completo` | **Reaproveitar SQL como `20261114170000_lume_completo`** | Preservar baseline original da `dev` e adicionar mudanças sem recriar estrutura do zero. **Exige validação em cópia do banco.** |
| Documentação antiga do README | **Preservar como histórico** | Manter rastreabilidade do estado anterior, mas evitar apresentá-lo como API atual. |

## Pontos que exigem validação e não autorizam exclusões adicionais

1. **Banco com dados reais:** fazer backup consistente e simular `prisma migrate deploy` sobre uma cópia com o histórico de migração correspondente. Se o banco tiver sido criado com `0_base`, preparar reconciliação manual e **não aplicar automaticamente** esta cadeia.
2. **Backend:** `npm ci`, `prisma generate`, `prisma migrate deploy` em banco descartável, `npm run typecheck`, `npm run build`, `npm test`; analisar os CT001–CT013.
3. **Web:** `npm ci`, `npm run build`, `npm test`; testar autenticação real, administração, perfis, cadastro, catálogo e erros HTTP.
4. **Mobile:** `npm ci`, `npx tsc --noEmit`, testar o aplicativo Expo em dispositivo/emulador com URL correta da API.
5. **Governança:** aguardar checks `Politica Git Flow`, `Backend CI` e os novos `Web CI`/`Mobile CI`; fazer merge só após resultado satisfatório e revisão humana.
6. **Qualidade e proteção de dados:** não incluir `.env`, tokens ou arquivos de teste com dados pessoais reais; preservar evidências antes de qualquer remoção.

## Decisão operacional

Esta branch é uma **proposta rastreável** de integração, não confirmação de deploy nem de execução de todos os testes. Não exclua arquivos adicionais da `dev` ou force push; integre pelo PR e preserve as proteções da branch.

## Primeira execução de CI no PR #19 — correções guiadas por logs

O build da API, o `prisma migrate deploy` sobre banco novo, a validação do Insomnia, a compilação Web e a checagem Mobile passaram. A primeira rodada de testes backend identificou:
- CT012: limpeza tentava excluir Cargo ainda referenciado por ConsultaCargo; o teardown foi ajustado para eliminar os registros de consulta criados pelo teste.
- CT005: o teste verifica envio SMTP via `nodemailer` simulado, mas a configuração de CI usava modo console; o job agora injeta configuração SMTP fictícia exclusivamente na etapa de testes.
- CT008: o teste dependia de profissões existentes no seed; passa a criar, usar e limpar sua própria fonte, curso, cargos e rotas válidas.

Essas correções não removem validações de negócio nem modificam dados externos; apenas isolam e tornam verificáveis os testes de CI.
