# LUME — Sprint 2: Banco de Dados & Código Base

## Entregáveis contemplados

### Modelagem física
- MER preservado no Prisma.
- Tabelas e relacionamentos documentados.
- Dicionário físico com tipos SQL, PK/FK, nulidade, UNIQUE e DEFAULT.
- Migration SQL executável.

### Persistência
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20261002000000_init_lume/migration.sql`
- `backend/prisma/seed.ts`

### Software
- Layered Architecture.
- Classes de domínio correspondentes às entidades do banco.
- Backend Node.js/Express/TypeScript.
- REST/JSON.
- Frontend React/TypeScript.
- Mobile React Native/Expo/TypeScript.
- `.env.example` no backend, frontend e mobile.

### Primeiras operações
- cadastro e autenticação de usuário;
- consulta de cargos;
- consulta de cursos;
- consulta de instituições;
- consulta de ofertas curso/instituição;
- consulta de trilhas;
- avaliações textuais de instituições;
- perguntas e resultado do teste vocacional;
- histórico do teste quando o usuário está autenticado.

## Limites conhecidos

O MER entregue não possui entidades próprias para favoritos, notificações, vestibulares, simulador de ENEM, denúncias/moderação, relatórios e auditoria. Esses recursos aparecem no escopo/requisitos, mas não foram transformados em tabelas inventadas nesta Sprint 2.

Essa lacuna fica explicitamente registrada para a próxima revisão de modelagem, em vez de criar dados soltos.
