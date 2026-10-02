# LUME — Diagrama de Classes de Domínio

O modelo de classes do código acompanha as dez entidades do MER.

```text
Usuario
- id
- nomeCompleto
- email
- senhaHash
- endereco
- rua
- cidade
- bairro
- estado
- latitude
- longitude
        |
        | 1:N
        v
Avaliacao
- id
- usuarioId
- instituicaoId
- comentario
- dataPublicacao
        ^
        | N:1
Instituicao
- id
- nome
- cursos
- notaAvaliacoes
- notaMec
- cnpj
- contato
- telefone
- celular
- email
- endereco
- rua
- cidade
- latitude
- longitude
- bairro
- estado
- status
        |
        | 1:N
        v
CursoInstituicao <---------------- Curso
- id                              - id
- cursoId                         - nome
- instituicaoId                  - area
- status                         - cargaHoraria
- mensalidade                    - modalidade
- formasIngresso                 - mensalidade
- notaCorte                      - salario
                                  - descricao
                                  - grauAcademico

Cargo --------------------------< TrilhaCargoCurso >---------------- Curso
- id                              - id
- nome                            - cargoId
- curso                           - cursoId
- areaAtuacao                     - ordemEtapa
- faixaSalarial
- salario

PerguntaVocacional
- id
- enunciado
- areaAfinidade

HistoricoTesteVocacional
- id
- usuarioId
- dataRealizada
- pontuacaoDetalhada

Admin
- id
- nome
```

## Responsabilidades

- **Usuario:** identidade e localização do estudante.
- **Cargo:** representação profissional.
- **Curso:** formação.
- **TrilhaCargoCurso:** ordenação da rota de formação.
- **Instituicao:** organização de ensino.
- **CursoInstituicao:** oferta de um curso por instituição.
- **Avaliacao:** manifestação textual do usuário sobre instituição.
- **PerguntaVocacional:** catálogo do teste.
- **HistoricoTesteVocacional:** persistência do resultado.
- **Admin:** identificação do ator administrativo definido no MER.

A classe de domínio não deve ganhar atributos sem correspondência no banco ou em uma regra de negócio documentada.
