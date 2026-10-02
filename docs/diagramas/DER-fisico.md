# DER Físico — LUME

```mermaid
erDiagram
  USUARIO ||--o{ AVALIACAO : publica
  INSTITUICAO ||--o{ AVALIACAO : recebe
  USUARIO ||--o{ HISTORICO_TESTE_VOCACIONAL : realiza
  CURSO ||--o{ CURSO_INST : ofertado_em
  INSTITUICAO ||--o{ CURSO_INST : oferece
  CARGO ||--o{ TRILHA_CARGO_CURSO : possui
  CURSO ||--o{ TRILHA_CARGO_CURSO : compoe

  USUARIO {
    int id_user PK
    varchar nome
    varchar email UK
    varchar senha
    varchar endereco
    varchar rua
    varchar cidade
    varchar bairro
    char estado
    decimal latitude
    decimal longitude
  }

  INSTITUICAO {
    int id_instituicao PK
    varchar nome_instituicao
    text cursos
    decimal nota_avaliacoes
    decimal nota_mec
    varchar cnpj
    text contato
    varchar Telefone
    varchar Celular
    varchar email
    varchar endereco
    varchar rua
    varchar Cidade
    decimal latitude
    decimal longitude
    varchar bairro
    char Estado
    boolean status
  }

  ADMIN {
    int id_Admin PK
    varchar nome
  }

  CURSO {
    int id_curso PK
    varchar nome_curso
    varchar area_curso
    int carga_horario
    varchar modalidade
    decimal mensalidade
    decimal salario
    text descricao
    varchar grau_academico
  }

  CARGO {
    int id_Cargo PK
    varchar nome
    varchar curso
    varchar areaAtuacao
    varchar faixaSalarial
    decimal salario
    text Descricao
    text hard_skills
    text soft_skills
  }

  TRILHA_CARGO_CURSO {
    int id_trilha PK
    int cargo FK
    int curso FK
    int order_etapa
  }

  CURSO_INST {
    int id_cursoInst PK
    int curso FK
    int instituicao FK
    boolean status
    decimal mensalidade
    text formas_ingresso
    decimal nota_corte
  }

  AVALIACAO {
    int id_avaliacao PK
    int id_usuario FK
    int id_instituicao FK
    text comentario
    timestamp data_publicacao
  }

  PERGUNTA_VOCACIONAL {
    int id_pergunta PK
    text enunciado
    varchar area_afinidade
  }

  HISTORICO_TESTE_VOCACIONAL {
    int id_historico PK
    int id_usuario FK
    timestamp data_realizada
    text pontuacao_detalhada
  }
}
```

> O diagrama representa somente relações persistidas. Ações de consulta e navegação do estudante são operações da aplicação e não FKs.