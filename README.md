# LUME - GPS de Carreira

Repositorio do TCC LUME. GitFlow com as branches permanentes **main**
(estavel) e **dev** (integracao das funcionalidades).

## Estado do backend por branch

- **main:** ultimo backend estavel antes da substituicao solicitada;
  permanece intacto ate uma release futura.
- **dev:** backend enviado em BACKEND.zip e atualizado em uma feature
  por PR, sem arquivos .env ou node_modules. A API recebida tem
  11 modelos Prisma e 8 operacoes HTTP, sem prefixo `/api`.
  Consulte [backend/README.md](backend/README.md) e
  [backend/INSOMNIA.md](backend/INSOMNIA.md).

A nova estrutura **nao e compativel diretamente** com o schema anterior
(19 modelos Prisma, 67 requests). Para executar a POC do backend novo,
use **banco PostgreSQL vazio**: nao aplique a migration inicial sobre
um banco usado pelo backend antigo sem um plano de migracao e backup.
O frontend legado tambem depende de adaptacao para novas rotas.

## Fluxo de colaboracao

`feature/* -> dev`; depois de estabilizar e homologar, `release/* -> main`;
correcoes urgentes por `hotfix/* -> main`; ao publicar, sincronize
`main -> dev` por PR. Rulesets exigem checks de GitFlow e do backend.
As features sao temporarias e removidas apos merge.

- [GitFlow](docs/GIT_FLOW.md)
- [Rulesets](docs/RULESETS.md)
- [Backend e instalacao](backend/README.md)
- [Colecao Insomnia](backend/insomnia.collection.json)
