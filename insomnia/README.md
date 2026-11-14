# Insomnia · APIs e testes do LUME

**Central de testes da branch `dev` — exatamente 7 APIs de negócio.**

A API atual também expõe `GET /health` para verificação técnica do servidor. **`/health` não faz parte das sete operações de negócio nem da coleção Insomnia**. Não foram criadas nem removidas rotas do backend.

## Organização da pasta

```text
insomnia/
├── colecao-lume.json           # Importar no Insomnia: 7 requests, em 3 grupos
├── tests/
│   ├── colecao.test.mjs        # Confere 7 rotas, acesso, variáveis e segurança
│   └── api.test.ts             # Testes HTTP das 7 rotas e verificação de /health
├── .gitignore                  # Proteção de arquivos locais
└── README.md                   # Este manual
```

> **Referência do grupo:** a exportação `insomnia-export.TCC---LUME.1791556221273.zip` foi analisada. Ela contém várias requisições-modelo **sem URL**, e **seis requisições com URL configurada**. A organização acima mantém as operações compatíveis com o backend, acrescentando a listagem `GET /cursos` que existe em `backend/src/routes.ts`. As requisições-modelo incompletas não foram versionadas.

## As 7 APIs — nenhuma a mais, nenhuma a menos

| # | Grupo | Método | Caminho | Autorização | Finalidade |
| :-: | --- | :---: | --- | --- | --- |
| 1 | Autenticação | POST | `/usuarios` | Pública | Cadastrar estudante |
| 2 | Autenticação | POST | `/session` | Pública | Fazer login e receber JWT |
| 3 | Cursos | GET | `/cursos` | Estudante ou ADMIN | Listar e filtrar cursos |
| 4 | Cursos | GET | `/cursos/:id` | Estudante ou ADMIN | Consultar os detalhes de um curso |
| 5 | Cursos | POST | `/cursos` | ADMIN | Cadastrar curso |
| 6 | Instituições | POST | `/instituicoes` | ADMIN | Cadastrar instituição |
| 7 | Instituições | POST | `/instituicoes/:id/cursos` | ADMIN | Vincular curso a uma instituição |

**Não existem, no backend atual da `dev`, endpoints para editar/inativar cursos ou cargos, favoritos, quiz ou avaliações.** Essas requisições aparecem como modelos vazios na exportação recebida, mas não entram na coleção de APIs prontas.

## Como importar e testar (passo a passo)

1. Configure o backend seguindo [`backend/README.md`](../backend/README.md), com Node.js 22 e um PostgreSQL **novo/vazio de desenvolvimento**.
2. Inicie com `npm run dev` dentro de `backend/`.
3. Abra o Insomnia e importe [`colecao-lume.json`](colecao-lume.json) por **Import from File**.
4. Confira o ambiente `base_url=http://localhost:3333` (sem `/api`). **Todas as variáveis pessoais e de autenticação devem ser preenchidas somente no Insomnia local**, não na coleção do GitHub.
5. Preencha `nome_estudante`, `email_estudante` e `senha_estudante` com dados válidos **do seu ambiente de teste**. Execute **Cadastrar_usuário** e, em seguida, **Autenticar_usuário**. Copie o `token` retornado para a variável local `token`.
6. Execute **Listar_cursos**. Para **Buscar_curso_por_id**, utilize `curso_id` de um curso realmente existente no banco.
7. Para criar cursos e instituições, configure `ADMIN_EMAIL` e `ADMIN_SENHA` no `backend/.env` **local**, rode `npm run seed`, faça login em **Autenticar_usuário** com essa conta e preencha `admin_token` **somente no Insomnia**.
8. Preencha `nome_curso`, `grau_academico`, `area_curso`, `carga_horaria`, `nome_instituicao` e `cnpj_instituicao` com os dados válidos que a equipe decidir usar no banco local. Cadastre o curso e a instituição; use os IDs retornados nas variáveis `curso_id` e `instituicao_id`.
9. Execute **Curso_instituicao** para vincular os registros. Ao contrário da exportação recebida, o ID da instituição pertence à **URL**, não precisa constar no corpo JSON.

`POST /cursos` aceita modalidade `PRESENCIAL`, `EAD` ou `HIBRIDO`. O campo `carga_horaria` deve ser um inteiro positivo. `POST /instituicoes` exige CNPJ válido. Consulte os [schemas Zod](../backend/src/schemas/) para os demais campos e critérios reais.

**Segurança:** os tokens `{{ _.token }}` e `{{ _.admin_token }}` são **referências**, não credenciais. Não exporte nem faça commit da coleção após preencher variáveis, senhas ou dados pessoais. Mantenha o arquivo versionado sem credenciais.

## Testes automatizados centralizados

O backend continua disponibilizando os comandos abaixo para facilitar a CI, mas **o código dos testes está somente nesta pasta**:

```powershell
cd backend
npm ci
npm run prisma:generate
npm run insomnia:validate
npm test
```

- `npm run insomnia:validate` executa [`insomnia/tests/colecao.test.mjs`](tests/colecao.test.mjs): garante **sete** operações únicas, grupos corretos, caminhos reais, Bearers parametrizados e ausência de JWT literal nos arquivos JSON/YAML versionados.
- `npm test` executa [`insomnia/tests/api.test.ts`](tests/api.test.ts): **sete testes HTTP negativos** (rejeição de entrada inválida ou falta de autenticação), mais um teste técnico de `/health`. Esses testes **não** demonstram todos os fluxos de sucesso com gravação no PostgreSQL; esses cenários devem ser documentados por evidências reais dos testes manuais.

Os resultados esperados variam conforme a operação: `200` para login/consulta, `201` para cadastros/vínculo, `400` para dados inválidos, `401` para token ausente ou inválido, `403` para usuário sem perfil ADMIN, `404` para registro não encontrado e `409` para duplicidade. Registre a resposta real de cada teste no Insomnia, sem copiar tokens para screenshots.

### Evidência para a Sprint 3

Para cada uma das sete rotas, a equipe pode guardar: **nome da operação, objetivo, pré-condições, corpo/cabeçalhos sem credenciais, status e resposta obtidos, resultado esperado, data e responsável**. Só marque um teste como concluído após executá-lo no ambiente da equipe.

## Aviso sobre o JWT do PR #11

O PR #11 não foi mesclado, mas seu diff registrou JWTs. Os arquivos atuais estão parametrizados; **isso não apaga conteúdos antigos do histórico e não invalida tokens previamente emitidos**. Os responsáveis pelos ambientes que os emitiram devem trocar o `JWT_SECRET` com segurança e reiniciar a API; se necessário, solicitar a remoção de dados sensíveis históricos ao suporte do GitHub. Não inclua as credenciais novas no repositório.
