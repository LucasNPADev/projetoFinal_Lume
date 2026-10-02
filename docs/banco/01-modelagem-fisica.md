# LUME — Modelagem Física de Banco de Dados

## Fonte de verdade

A modelagem física implementada no Prisma é derivada do MER entregue para o LUME e do dicionário de dados do documento de projeto. O diagrama apresenta as entidades **USUÁRIO, INSTITUIÇÃO, ADMIN, CURSO, CARGO, TRILHA CARGO CURSO, CURSO_INST, AVALIAÇÃO, PERGUNTA VOCACIONAL e HISTÓRICO TESTE VOCACIONAL**.

O arquivo `backend/prisma/schema.prisma` preserva os nomes conceituais por meio de `@map`/ `@@map`, permitindo que o código TypeScript use nomes de domínio sem substituir o modelo físico.

## Entidades

1. **usuario** — dados do estudante e sua localização.
2. **instituicao** — cadastro da instituição de ensino, avaliação/MEC, endereço, contato e status.
3. **admin** — identificação do administrador.
4. **curso** — formação acadêmica, área, carga horária, modalidade, mensalidade, salário e grau acadêmico.
5. **cargo** — profissão/cargo, área de atuação, faixa salarial, descrição e competências.
6. **trilhaCargoCurso** — associação ordenada entre cargo e curso.
7. **Curso_inst** — associação entre curso e instituição, com status, mensalidade, formas de ingresso e nota de corte.
8. **avaliacao** — comentário de um usuário sobre uma instituição.
9. **perguntaVocacional** — pergunta e área de afinidade.
10. **historicoTesteVocacional** — histórico do teste por usuário.

## Cardinalidades persistidas

| Relação | Cardinalidade | Implementação |
|---|---|---|
| Usuário → Avaliação | 1:N | `avaliacao.id_usuario` |
| Instituição → Avaliação | 1:N | `avaliacao.id_instituicao` |
| Usuário → Histórico do teste | 1:N | `historicoTesteVocacional.id_usuario` |
| Curso → Curso_inst | 1:N | `Curso_inst.curso` |
| Instituição → Curso_inst | 1:N | `Curso_inst.instituicao` |
| Cargo → Trilha | 1:N | `trilhaCargoCurso.cargo` |
| Curso → Trilha | 1:N | `trilhaCargoCurso.curso` |
| Cargo ↔ Curso | N:M | entidade associativa `trilhaCargoCurso` |
| Curso ↔ Instituição | N:M | entidade associativa `Curso_inst` |

As ações de **consulta** do estudante não são armazenadas como relacionamentos físicos entre usuário, cargo e curso. Elas são operações de leitura da aplicação.

## Regras de integridade

- Chaves primárias são geradas pelo PostgreSQL.
- E-mail do usuário é único, conforme a regra de cadastro/autenticação.
- Relações de trilha e oferta usam FKs.
- Exclusão de um cargo/curso/instituição com dependências usa `ON DELETE CASCADE` na camada relacional definida pela migration.
- `status` da instituição e da oferta `Curso_inst` possui `DEFAULT TRUE`.
- Datas de publicação/realização possuem `DEFAULT CURRENT_TIMESTAMP`.
- O Prisma é a fonte de geração do cliente e a migration é a fonte executável da estrutura.

## Observação de rastreabilidade

O dicionário fornecido usa tipos conceituais como **Número, Texto, Verdadeiro ou falso e Data**, e não especifica o SQL exato para cada atributo. Portanto, os tipos `VARCHAR`, `TEXT`, `INTEGER`, `DECIMAL`, `BOOLEAN` e `TIMESTAMP` registrados no dicionário físico deste repositório são a **materialização técnica** desses tipos conceituais. Isso não altera as entidades/atributos do MER.
