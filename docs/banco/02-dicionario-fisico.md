# LUME — Dicionário de Dados Físico

> Os tipos abaixo são a materialização PostgreSQL dos tipos conceituais do documento original. Os nomes dos atributos e sua obrigatoriedade seguem o MER/dicionário entregue.

## 1. USUÁRIO — tabela `usuario`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_user | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| nome | VARCHAR(255) | — | NÃO | — | — |
| email | VARCHAR(255) | — | NÃO | SIM | — |
| senha | VARCHAR(255) | — | NÃO | — | — |
| endereco | VARCHAR(255) | — | SIM | — | — |
| rua | VARCHAR(255) | — | SIM | — | — |
| cidade | VARCHAR(120) | — | SIM | — | — |
| bairro | VARCHAR(120) | — | SIM | — | — |
| estado | CHAR(2) | — | SIM | — | — |
| latitude | DECIMAL(9,6) | — | SIM | — | — |
| longitude | DECIMAL(9,6) | — | SIM | — | — |

## 2. INSTITUIÇÃO — tabela `instituicao`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_instituicao | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| nome_instituicao | VARCHAR(255) | — | NÃO | — | — |
| cursos | TEXT | — | NÃO | — | — |
| nota_avaliacoes | DECIMAL(3,2) | — | NÃO | — | — |
| nota_mec | DECIMAL(3,2) | — | NÃO | — | — |
| cnpj | VARCHAR(18) | — | SIM | — | — |
| contato | TEXT | — | SIM | — | — |
| Telefone | VARCHAR(20) | — | SIM | — | — |
| Celular | VARCHAR(20) | — | SIM | — | — |
| email | VARCHAR(255) | — | SIM | — | — |
| endereco | VARCHAR(255) | — | SIM | — | — |
| rua | VARCHAR(255) | — | SIM | — | — |
| Cidade | VARCHAR(120) | — | NÃO | — | — |
| latitude | DECIMAL(9,6) | — | SIM | — | — |
| longitude | DECIMAL(9,6) | — | SIM | — | — |
| bairro | VARCHAR(120) | — | SIM | — | — |
| Estado | CHAR(2) | — | NÃO | — | — |
| status | BOOLEAN | — | NÃO | — | TRUE |

## 3. ADMIN — tabela `admin`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_Admin | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| nome | VARCHAR(255) | — | NÃO | — | — |

## 4. CURSO — tabela `curso`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_curso | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| nome_curso | VARCHAR(255) | — | NÃO | — | — |
| area_curso | VARCHAR(120) | — | NÃO | — | — |
| carga_horario | INTEGER | — | NÃO | — | — |
| modalidade | VARCHAR(50) | — | NÃO | — | — |
| mensalidade | DECIMAL(10,2) | — | SIM | — | — |
| salario | DECIMAL(10,2) | — | SIM | — | — |
| descricao | TEXT | — | SIM | — | — |
| grau_academico | VARCHAR(120) | — | SIM | — | — |

## 5. CARGO — tabela `cargo`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_Cargo | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| nome | VARCHAR(255) | — | NÃO | — | — |
| curso | VARCHAR(255) | — | SIM | — | — |
| areaAtuacao | VARCHAR(120) | — | NÃO | — | — |
| faixaSalarial | VARCHAR(120) | — | SIM | — | — |
| salario | DECIMAL(10,2) | — | SIM | — | — |
| Descricao | TEXT | — | SIM | — | — |
| hard_skills | TEXT | — | SIM | — | — |
| soft_skills | TEXT | — | SIM | — | — |

## 6. TRILHA CARGO CURSO — tabela `trilhaCargoCurso`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_trilha | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| cargo | INTEGER | FK → cargo.id_Cargo | NÃO | — | — |
| curso | INTEGER | FK → curso.id_curso | NÃO | — | — |
| order_etapa | INTEGER | — | NÃO | — | — |

Restrição técnica: `(cargo, curso, order_etapa)` é único para evitar duplicação da mesma etapa.

## 7. CURSO_INST — tabela `Curso_inst`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_cursoInst | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| curso | INTEGER | FK → curso.id_curso | NÃO | — | — |
| instituicao | INTEGER | FK → instituicao.id_instituicao | NÃO | — | — |
| status | BOOLEAN | — | NÃO | — | TRUE |
| mensalidade | DECIMAL(10,2) | — | SIM | — | — |
| formas_ingresso | TEXT | — | SIM | — | — |
| nota_corte | DECIMAL(5,2) | — | SIM | — | — |

Restrição técnica: um mesmo curso e instituição não são duplicados na tabela de oferta.

## 8. AVALIAÇÃO — tabela `avaliacao`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_avaliacao | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| id_usuario | INTEGER | FK → usuario.id_user | NÃO | — | — |
| id_instituicao | INTEGER | FK → instituicao.id_instituicao | NÃO | — | — |
| comentario | TEXT | — | SIM | — | — |
| data_publicacao | TIMESTAMP(3) | — | NÃO | — | CURRENT_TIMESTAMP |

## 9. PERGUNTA VOCACIONAL — tabela `perguntaVocacional`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_pergunta | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| enunciado | TEXT | — | NÃO | — | — |
| area_afinidade | VARCHAR(120) | — | NÃO | — | — |

## 10. HISTÓRICO TESTE VOCACIONAL — tabela `historicoTesteVocacional`

| Coluna | Tipo | PK/FK | Nulo | UNIQUE | DEFAULT |
|---|---|---|---|---|---|
| id_historico | SERIAL / INTEGER | PK | NÃO | — | autoincrement |
| id_usuario | INTEGER | FK → usuario.id_user | NÃO | — | — |
| data_realizada | TIMESTAMP(3) | — | NÃO | — | CURRENT_TIMESTAMP |
| pontuacao_detalhada | TEXT | — | NÃO | — | — |

## Integridade e rastreabilidade

O dicionário físico não adiciona entidades que não aparecem no MER. Recursos como favoritos, notificações, vestibulares e simulador de ENEM aparecem nos requisitos de produto, mas não foram inventados como tabelas nesta entrega porque não estão presentes no modelo físico fornecido. Eles devem ser modelados em uma revisão formal do MER antes de entrarem no banco.
