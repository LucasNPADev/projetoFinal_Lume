# LUME — Quiz Vocacional: persistência e regra

## O que pertence ao banco

A tabela Pergunta Vocacional do MER possui somente:

- id_pergunta;
- enunciado;
- area_afinidade.

Por isso, a base não recebe uma coluna ou JSON de alternativas que não esteja no modelo entregue.

## O que pertence à aplicação

As alternativas exibidas pela POC são uma configuração da camada de serviço em `backend/src/services/quiz.service.ts`. Cada alternativa contém texto, área e peso. A resposta do usuário é enviada como `perguntaId + opcaoIndex`.

Esse é um dado de configuração da regra do teste, não uma entidade persistida no banco nesta Sprint 2.

## Histórico

Depois do cálculo, o backend serializa o ranking e as respostas em `pontuacao_detalhada`, exatamente no atributo de texto definido pelo MER.

## Regra de negócio

O resultado seleciona a área com maior pontuação para priorização de recomendações. Ele não exclui permanentemente outras áreas, mantendo a regra documentada do LUME.