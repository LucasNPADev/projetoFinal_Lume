# LUME — Contrato de Dados e Rastreabilidade

Este documento é a ponte entre documentação acadêmica, banco e código.

| Fonte | Implementação |
|---|---|
| MER | `backend/prisma/schema.prisma` |
| Dicionário físico | `docs/banco/02-dicionario-fisico.md` |
| DDL | `backend/prisma/migrations/20261002000000_init_lume/migration.sql` |
| Dados iniciais | `backend/prisma/seed.ts` |
| API | `backend/src/routes/routes.ts` + controllers/services |
| Web | `frontend/` |
| Mobile | `mobile/` |
| Arquitetura | `docs/arquitetura/01-arquitetura.md` |
| UML de domínio | `docs/software/01-uml-classes.md` |
| Governança | `docs/governanca/01-git-e-pr.md` |

## Regra principal

Um dado só pode existir no sistema se houver uma destas origens:

1. atributo do MER/dicionário;
2. regra de negócio/requisito;
3. transformação explicitamente documentada.

Não são permitidos campos "temporários" no frontend ou backend que simulem informações inexistentes no banco.

## Transformações documentadas

- `Usuario.nomeCompleto` → coluna física `usuario.nome`.
- `Usuario.senhaHash` → coluna física `usuario.senha`; o valor persistido continua sendo hash bcrypt, apesar do nome conceitual `senha`.
- `Curso.nome` → `curso.nome_curso`.
- `Curso.area` → `curso.area_curso`.
- `Cargo.nome` → `cargo.nome`.
- `Cargo.descricao` → `cargo.Descricao`.
- `CursoInstituicao.cursoId` → FK física `Curso_inst.curso`.
- `CursoInstituicao.instituicaoId` → FK física `Curso_inst.instituicao`.

## Campos não inventados

O código não cria colunas para favoritos, notificações, vestibulares, simulador de ENEM, denúncias, relatórios ou auditoria nesta Sprint 2, porque essas entidades não aparecem no MER físico fornecido. Antes de implementar persistência para esses recursos, o DER e o dicionário precisam ser atualizados.
