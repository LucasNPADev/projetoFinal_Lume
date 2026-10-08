# LUME — API backend

API REST do TCC LUME (Node.js + Express 5 + TypeScript + PostgreSQL + Prisma 6).
Este diretório é independente do frontend e do aplicativo móvel. **Não use este servidor com um banco de produção sem revisão de segurança, backup e execução de testes.**

## Preparação (Node.js 22.x / npm 10.x / PostgreSQL 16)

1. Instale Node.js e PostgreSQL 16+ (Docker é opcional).
2. Entre em `backend/`, copie `.env.example` para `.env` e **troque JWT_SECRET por uma chave aleatória com >=32 bytes** (p.ex. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. Ajuste `DATABASE_URL` e `CORS_ORIGINS`. Para popular dados fictícios, defina `SEED_DEMO=true`.
4. Execute em ordem:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run typecheck
npm run insomnia:validate
npm test
npm run dev
```

Em desenvolvimento, para criar **nova** migration, use `npm run prisma:migrate`. Para aplicar migrations imutáveis em staging/CI utilize `prisma:deploy`. **Não edite a migration inicial já aplicada.** A nova migration falha de propósito se existirem avaliações duplicadas para um mesmo usuário/instituição; resolva a divergência sem excluir dados automaticamente.

Para testes de integração completos use um banco descartável com dados sintéticos, defina `RUN_INTEGRATION_TESTS=1` e `SEED_DEMO=true` e rode `npm test`. CI faz esses passos com PostgreSQL.

## API e contratos

Todos os endpoints estão sob `/api`, retornam JSON (exceto respostas 204) e erros como `{"error":{"code":"VALIDATION_ERROR","message":"Dados invalidos.","details":[...]}}`. IDs são inteiros positivos, datas ISO 8601, valores monetários JSON são representados pelo Prisma como strings decimais. Nunca envie `senhaHash` ao cliente. Rotas autenticadas esperam `Authorization: Bearer <token>`. JWT HS256 de acesso expira em 15 minutos, com issuer/audience fixos; refresh opaco em cookie HttpOnly com rotacao e sessao revogavel expira em 30 dias. Senha de cadastro: 12–72 bytes.

| Método | Endpoint | Acesso | Função |
|---|---|---|---|
| GET | `/health` | público | Liveness |
| POST | `/auth/cadastro` | público | Novo estudante |
| POST | `/auth/login` | público | Login estudante |
| POST | `/auth/admin/login` | público | Login administrador |
| POST | `/auth/refresh` | cookie HttpOnly | Rotacionar refresh e obter novo JWT |
| POST | `/auth/logout`, `/auth/logout-todos` | autenticado | Revogar sessão atual/todas |
| POST | `/auth/senha/alterar` | estudante | Alterar senha e revogar sessões |
| POST | `/auth/senha/solicitar-recuperacao` | público | Solicitar link por SMTP configurado |
| POST | `/auth/senha/redefinir` | token de e-mail | Definir nova senha e revogar sessões |
| GET | `/auth/me` | autenticado | Tipo e perfil da sessão |
| GET, PATCH, DELETE | `/usuarios/me` | estudante | Perfil e eliminação de conta |
| GET, PUT | `/usuarios/:id` | próprio estudante | Compatibilidade; proibido IDOR |
| GET | `/usuarios/me/favoritos` | estudante | Favoritos salvos |
| PUT, DELETE | `/usuarios/me/favoritos/:tipo/:id` | estudante | `tipo` = cargos, cursos, instituicoes, trilhas (ID da etapa) |
| GET | `/usuarios/me/notificacoes` | estudante | Caixa de notificacoes; filtro `naoLidas=true` |
| PATCH | `/usuarios/me/notificacoes/:id/lida` | estudante | Marcar aviso proprio como lido |
| DELETE | `/usuarios/me/notificacoes/:id` | estudante | Remover aviso proprio |
| GET | `/cargos` | público | Catálogo com `area`, `busca`, `pagina`, `limite`, `personalizado=true` |
| GET | `/cargos/:id` | público | Detalhes, rotas orientativas e ofertas ativas |
| GET | `/cursos`, `/cursos/:id` | público | Cursos e vínculos ativos |
| GET | `/instituicoes`, `/instituicoes/:id` | público | Instituições, cursos, avaliações e distância opcional (`latitude`, `longitude`, `raioKm`) |
| GET, POST, PATCH | `/eventos`, `/eventos/:id` | GET publico; alteracoes admin | Calendario de vestibulares, ENEM e bolsas com URL de fonte; `/eventos/admin` lista inclusive inativos |
| GET | `/comparacoes/ofertas?ids=1,2` | público | Comparação objetiva de 2–6 ofertas com notas e distância opcional |
| GET | `/comparacoes/cargos/:id` | público | Comparação de rotas, salários e mensalidades |
| GET | `/comparacoes/enem?nota=700` | público | Referência indicativa por nota de corte cadastrada, sem garantia |
| GET | `/quiz/perguntas` | público | Questões ativas; opções textuais, sem pesos |
| POST | `/quiz/resultado` | público/estudante | Apura afinidade e grava histórico somente se logado |
| GET | `/quiz/historico` | estudante | Últimos 50 resultados |
| GET | `/avaliacoes/instituicao/:id` | público | Avaliações aprovadas |
| PUT | `/avaliacoes/instituicao/:id` | estudante | Cria/atualiza sua avaliação, volta para fila de moderação |
| DELETE | `/avaliacoes/:id` | estudante autor | Apaga sua avaliação |
| POST | `/avaliacoes/:id/denuncias` | estudante | Denúncia de avaliação aprovada |
| GET | `/admin/resumo` | admin | Indicadores operacionais |
| GET, POST, PATCH | `/admin/cargos`, `/admin/cargos/:id` | admin | Gerenciar cargos |
| GET, POST, PATCH | `/admin/cursos`, `/admin/cursos/:id` | admin | Gerenciar cursos |
| GET, POST, PATCH | `/admin/instituicoes`, `/admin/instituicoes/:id` | admin | Gerenciar instituições |
| GET, POST, PATCH | `/admin/ofertas`, `/admin/ofertas/:id` | admin | Ofertas curso-instituição |
| GET, POST, PATCH, DELETE | `/admin/trilhas`, `/admin/trilhas/:id` | admin | Etapas de rotas alternativas |
| GET, POST, PATCH | `/admin/perguntas`, `/admin/perguntas/:id` | admin | Instrumento do quiz |
| GET | `/admin/avaliacoes?status=PENDENTE` | admin | Fila de moderação |
| PATCH | `/admin/avaliacoes/:id/moderacao` | admin | Aprovar/rejeitar |
| GET | `/admin/denuncias` | admin | Fila de denúncias |
| PATCH | `/admin/denuncias/:id` | admin | Resolver/descartar |

Listagens públicas continuam retornando **arrays**, mantendo o contrato do frontend legado, com paginação padrão de 20 itens e limite de 100. As rotas de detalhe podem ter novos campos, nunca expondo senhas.

### Exemplos mínimos

Cadastro:
```json
{"nomeCompleto":"Pessoa Exemplo","email":"pessoa@example.org","senha":"minha-senha-longa-segura","cidade":"São Bernardo do Campo","estado":"SP"}
```

Quiz (o resultado é calculado **exclusivamente no servidor**; o cliente não escolhe a área):
```json
{"respostas":[{"perguntaId":1,"opcaoIndex":0},{"perguntaId":2,"opcaoIndex":1}]}
```
É necessário responder **todas as perguntas ativas**; os IDs devem vir de `GET /quiz/perguntas`. A ordem/quantidade do exemplo não corresponde necessariamente ao banco. O JSON de `PerguntaVocacional.opcoes` persistido é `[{"texto":"...","pesos":{"Tecnologia":3}}]`, não um array de strings. O resultado traz `resultadoArea`, `ranking`, `cargosRecomendados`, `versaoInstrumento` e aviso de metodologia exploratória.

Atualização de perfil:
```json
{"nomeCompleto":"Pessoa Exemplo","cidade":"Santo André","estado":"SP","consentimentoLocalizacao":false}
```

Avaliação:
```json
{"nota":4,"comentario":"Relato pessoal sem dados sensíveis","ano":2026}
```

Admin cria trilha alternativa:
```json
{"cargoId":1,"cursoId":2,"rota":"tecnologo","etapa":"Tecnólogo","ordem":1}
```

A área vocacional **prioriza** cargos, não os elimina. A página de cargo exige ao menos um curso ligado a alguma trilha ativa, mas o conteúdo das trilhas é **orientativo**. O modo `personalizado=true` usa o teste mais recente apenas quando o usuário está autenticado.

## Segurança, privacidade e governança

- Segredos via ambiente, sem fallback público; tokens não armazenados no banco; autorização aplicada no servidor com verificação da conta a cada requisição; não existe endpoint público para cadastrar administrador.
- Bootstrap de **admin local**: somente fora de produção, defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no arquivo local e rode `npm run prisma:seed`; retire essas variáveis em seguida. Usuário admin existente não tem senha redefinida pelo seed.
- Avaliações são `PENDENTE` até moderação; denúncias têm fluxo próprio. Favoritos usam FKs verdadeiras e chaves compostas.
- Um usuário pode pedir exclusão via `DELETE /usuarios/me`, eliminando também históricos, favoritos, avaliações e denúncias relacionadas. Garanta política de retenção e cópias de segurança compatíveis com LGPD antes de operação real.
- A API armazena cidade/UF do usuário, mas não coordenadas pessoais; coordenadas presentes são das instituições. Não há serviço de geocodificação/rota externo implementado.
- `dadosDemonstracao=true` e `fonteSalario="FICTICIO..."` identificam dados inventados para testes. **Salários, mensalidades e instituições do seed NÃO são dados reais**.
- O quiz é **exploratório, não um teste psicométrico validado**, e não constitui diagnóstico ou aconselhamento profissional individual.
- Para produção: revisar configuração HTTPS/reverse proxy, secrets, backups, auditoria administrativa, rate limiting distribuído, política de privacidade, moderação e fontes oficiais dos dados. Não se declara conformidade plena à LGPD somente por ter middleware.
- A base Prisma de `main` e o MER/dicionário acadêmico histórico têm divergências, incluindo nomes e campos. Esta implementação preserva a migration existente e registra evolução incremental; atualizar DER/dicionário do TCC com acompanhamento docente antes da homologação.

## Limites conhecidos

Este trabalho entrega **backend e documentação da API**, não UI, aplicativo mobile, geolocalização de deslocamento real, dados oficiais MEC ou salários oficiais, notificações, simulador ENEM, job scheduler nem implantação em produção. É necessário validar o consumo de novos endpoints pela UI em etapa separada.

## Renovacao de sessao e SMTP

No web, habilite `withCredentials: true` ao chamar `POST /api/auth/refresh`; o token de renovacao fica em cookie **HttpOnly**, `SameSite=Strict` e `Secure` em producao. Nao persista JWT de acesso em localStorage; prefira estado somente em memoria e renove o acesso no momento necessario. Para apps nativos e integrações fora do mesmo site, planeje um fluxo de armazenamento seguro compatível antes de homologar login persistente. `POST /api/auth/logout` revoga imediatamente a sessao no banco. APIs abertas de login, cadastro e refresh ignoram eventual Bearer expirado.

Recuperacao de senha exige `SMTP_HOST`, `SMTP_FROM`, `WEB_RESET_URL` e, quando necessario, `SMTP_USER` e `SMTP_PASSWORD` válidos. Sem SMTP, solicitacao retorna 503; não sao enviados emails por um serviço fictício. Tokens sao aleatorios, de uso unico, armazenados apenas pelo hash SHA-256 e expiram em 30 min. URL de redefinicao deve usar HTTPS em producao. Toda alteracao/redefinicao revoga todas as sessoes. Implementar a tela web de redefinicao e configurar provedor de e-mail real sao tarefas de integracao externas ao backend.

## Geolocalizacao e comparacoes

As coordenadas recebidas pela API sao parâmetros transitórios de requisição, não são gravadas no perfil do estudante. O dispositivo precisa obter autorização explícita antes de captá-las. Para localização manual use `?cidade=Sao%20Bernardo`. As distâncias são geodésicas em linha reta (Haversine), **não** tempos de deslocamento nem rotas rodoviárias. Instituições sem coordenadas só aparecem em buscas sem filtro GPS. Filtros espaciais usam bounding box no PostgreSQL e depois distância exata em memória. Simulador ENEM apenas compara com valores `notaCorte` já cadastrados, que devem ser verificados no edital correspondente; fonte/ciclo das notas ainda precisam ser modelados antes de uso decisório real.

## Calendario, notificacoes, trilhas e referencias oficiais

`GET /api/eventos?tipo=VESTIBULAR&de=2026-10-01&ate=2027-10-01` retorna eventos cadastrados e ativos. Criacao e alteracao exigem administrador, titulo, periodo e `urlFonte` para que estudantes possam conferir o edital. Eventos sintéticos devem marcar `dadosDemonstracao=true`; **nunca apresentam datas ficticias como oficiais**.

Quando o administrador altera preço/bolsa/status/nota de corte de uma oferta, o backend notifica **dentro do aplicativo** os estudantes que favoritaram o curso ou a instituição. Quando publica evento ligado a curso/instituição, envia um aviso in-app a esses favoritos. Não há integração de push/email transacional nessa etapa.

`TrilhaCargoCurso.duracaoMeses` permite registrar duração de cada etapa. O comparador soma o total de uma rota **somente se todas as etapas tiverem duração informada**; senão o total retorna nulo para evitar estimativa artificial. O favorito de trilha usa a FK de uma etapa da rota, de forma íntegra no banco.

Para notas de corte, a API agora aceita `anoNotaCorte` e `fonteNotaCorte`. O simulador ENEM somente exibe referência quando os três dados (`notaCorte`, ano e fonte) estão presentes, com alerta de que nota acima do corte não garante vaga. **Não existe alimentação automática de MEC, SiSU ou Prouni**: o administrador deve inserir referências confiáveis e manter o ciclo atualizado.

## Colecao Postman e integridade de ofertas

Importe `backend/postman.collection.json` no Postman. Configure `baseUrl` e credenciais de estudante. O login captura o JWT de acesso para a colecao; para renovar sessao habilite o envio de cookies no Postman. Nenhum segredo de producao esta incluido.

A coluna `CursoInstituicao.turno` passou a ser obrigatoria, usando o valor explicito `Não informado` na ausencia de turno. A regra impede duplicatas silenciosas na chave composta (curso, instituicao, modalidade e turno). A migration nao remove registros: eventual conflito historico deve ser resolvido manualmente.

## Insomnia e rotas centralizadas

Importe [insomnia.collection.json](insomnia.collection.json) no Insomnia. O passo a passo para executar login, obter tokens, testar permissões de admin, quiz, instituições, favoritos e notificações está em [INSOMNIA.md](INSOMNIA.md). **As rotas de cada módulo continuam em `src/routes/*.routes.ts`, e o registro central está em [src/routes/routes.ts](src/routes/routes.ts).** O comando `npm run insomnia:validate` confere que a coleção cobre todos os endpoints e valida corpos JSON.

As dependências diretas do backend foram fixadas às versões especificadas no `package.json` (Node 22, npm 10, Prisma 6.19, Express 5.1, TypeScript 5.9). São versões compatíveis verificadas pelo CI, não necessariamente as mais recentes. O `package-lock.json` congela também dependências transitivas; use `npm ci`.
