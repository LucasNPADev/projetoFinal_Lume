# Insomnia — APIs oficiais do LUME (dev)

Aqui o grupo encontra a **única coleção Insomnia versionada da API atual**. São **8 operações implementadas** no backend recebido, com URL-base `http://localhost:3333` (sem `/api`).

## Como testar — passo a passo

1. Siga o [guia de instalação do backend](../backend/README.md). Use um banco PostgreSQL **novo e vazio**, nunca o banco do backend anterior.
2. No Insomnia: **Import > File > [colecao-lume.json](colecao-lume.json)**.
3. Confira no ambiente importado `base_url=http://localhost:3333`.
4. Teste `GET /health`: deve responder **200** e `{"status":"ok"}`.
5. Preencha no **seu próprio Insomnia**, sem subir ao GitHub, `nome_estudante`, `email_estudante` e `senha_estudante`. Execute `POST /usuarios`, seguido de `POST /session`; guarde o JWT retornado em `token` **somente localmente**.
6. Para ações administrativas, configure `ADMIN_EMAIL` e `ADMIN_SENHA` **apenas no `backend/.env` local**, rode `npm run seed`, faça login pelo `POST /session` e coloque o JWT em `admin_token` no Insomnia local.
7. Para os cadastros, preencha as variáveis locais `nome_curso`, `grau_academico`, `area_curso`, `nome_instituicao` e `cnpj_instituicao` com informações **válidas do ambiente de teste da equipe**. No corpo de criação de curso, substitua a carga horária ilustrativa pela carga horária do curso que está testando.
8. Use `curso_id` e `instituicao_id` correspondentes aos registros que **seu banco retornou**, não IDs inventados.

## Todas as rotas que já existem

| Método | Caminho | Quem pode acessar | Função |
| --- | --- | --- | --- |
| GET | `/health` | Público | Estado da API |
| POST | `/usuarios` | Público | Cadastro de estudante |
| POST | `/session` | Público | Login, retorna JWT |
| GET | `/cursos` | Autenticado | Lista, filtra e pagina cursos |
| GET | `/cursos/:id` | Autenticado | Detalhes e ofertas ativas |
| POST | `/cursos` | ADMIN | Cadastrar curso |
| POST | `/instituicoes` | ADMIN | Cadastrar instituição |
| POST | `/instituicoes/:id/cursos` | ADMIN | Vincular curso a instituição |

**Respostas esperadas:** `200` para consultas e login, `201` para criação, `400` para dados inválidos, `401` para ausência de autenticação, `403` para perfil não autorizado, `404` para entidade não encontrada, `409` para duplicidade e `500` para erro inesperado. Os casos devem ser confirmados por testes, não presumidos como integralmente cobertos.

Os contratos de entrada são definidos pelos [schemas](../backend/src/schemas/) e as rotas por [`routes.ts`](../backend/src/routes.ts). A coleção corresponde à API atual e não tenta representar recursos ainda pendentes, como rotas de quiz ou trilhas.

## Segurança — obrigatório

**Nunca faça commit ou compartilhe** JWT real, senhas, `JWT_SECRET`, `DATABASE_URL` privada, arquivos `.env` ou uma exportação do Insomnia após preencher seus tokens.

O arquivo `colecao-lume.json` contém referências como `{{ _.token }}` e `{{ _.admin_token }}`; os valores do ambiente ficam **vazios** no GitHub. As credenciais devem permanecer **apenas no Insomnia de cada integrante**.

**Sobre o incidente do PR #11:** aquela proposta não foi mesclada, mas incluiu um token literal no diff. O histórico de um PR fechado pode continuar visível. **Mover a coleção não apaga o segredo exposto anteriormente.** Quem administra o ambiente que emitiu o JWT deve **rotacionar `JWT_SECRET` e reiniciar o serviço** para invalidar tokens antigos; se outras credenciais foram expostas, também devem ser substituídas. Para pedir a remoção do conteúdo sensível do histórico, siga o procedimento do **suporte do GitHub**. Essas ações externas não podem ser realizadas apenas pelo PR.

## Manutenção da coleção

`npm run insomnia:validate` (dentro de `backend/`) confere que a coleção contém exatamente os oito métodos/caminhos atuais, com tokens parametrizados e sem JWT literal. Atualize coleção, documentação e teste **somente quando a implementação real da API mudar**.

A coleção está em formato **Insomnia Export v4**; não depende de Postman nem altera o banco de dados por si só.
