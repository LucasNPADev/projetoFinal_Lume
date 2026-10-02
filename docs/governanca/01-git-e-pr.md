# LUME — Governança de Código

## Estratégia de branches

Estratégia adotada para o TCC:

- `main`: linha estável de entrega.
- `develop`: integração de funcionalidades concluídas.
- `feat/<escopo>`: desenvolvimento de funcionalidade ou sprint.
- `fix/<escopo>`: correção de defeito.
- `docs/<escopo>`: documentação sem alteração funcional.

A branch de trabalho desta etapa é `feat/sprint2-lume-base`.

## Pull Request

Todo PR deve informar:

1. objetivo;
2. requisitos/RN/RF relacionados;
3. arquivos ou módulos afetados;
4. impacto no banco;
5. migration/seed afetados;
6. como testar;
7. evidências da POC quando houver alteração de interface.

## Regras

- Não commitar `.env` ou credenciais.
- Toda alteração estrutural no banco deve passar pelo Prisma migration.
- O seed deve permanecer executável e reproduzível.
- Não alterar o MER silenciosamente no código.
- Campos novos precisam ser rastreados em documentação antes ou junto da implementação.
- Commits devem usar mensagens objetivas e no infinitivo/imperativo técnico.
- A branch de feature deve ser revisada antes do merge para `develop`.

## POC e versionamento

As versões de sprint devem ser marcadas com tags no padrão definido pela entrega acadêmica, por exemplo `v1.0-sprint1`, quando a equipe concluir a revisão correspondente.
