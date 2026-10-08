# Insomnia - API do backend recebido (branch dev)

Importe `backend/insomnia.collection.json` no Insomnia (Export v4). A API original
recebida atende em `http://localhost:3333`, **sem prefixo `/api`**.
Use `base_url=http://localhost:3333` e variaveis `token`/`admin_token`
no ambiente local, sem nunca commitá-las.

1. `GET /health` → `200`.
2. `POST /usuarios` e `POST /session` → copie o `token` de estudante.
3. O administrador deve ser criado pelo seed, com `ADMIN_EMAIL` e `ADMIN_SENHA`
   definidos apenas no `.env` local, e depois autenticado por `POST /session`.
4. Para criar cursos/instituicoes e vincula-los, use o Bearer de admin.
5. `GET /cursos` e `/cursos/:id` exigem Bearer de usuario autenticado.

Esta colecao descreve **somente as oito operacoes HTTP atualmente implementadas**;
a colecao anterior com 67 requests pertence a uma API diferente e nao se aplica
apos substituir o backend. O contrato deve ser revisado com a equipe de TCC.
