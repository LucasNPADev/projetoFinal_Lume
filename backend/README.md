# LUME — API de orientação de carreira

Backend em **Node.js, Express, TypeScript, Prisma e PostgreSQL**, baseado no código, no DER e nos requisitos enviados. Não há Python na aplicação.

Inclui JWT e refresh token, contas, catálogo administrativo, cargos e rotas alternativas de formação, ofertas regionais, teste vocacional, favoritos, avaliações e moderação, comparativos, simulador ENEM, calendário e notificações no perfil.

## Começar em um banco novo

Requisitos: Node.js 20.11 ou superior, npm e PostgreSQL. No Windows, execute os comandos no PowerShell, dentro da pasta extraída `lume-backend`. `npm.cmd` evita o bloqueio de `npm.ps1` pela política do PowerShell. No macOS/Linux, use `npm`.

```powershell
npm.cmd ci
npm.cmd run configurar
```

O segundo comando cria `.env` com uma chave JWT aleatória e não sobrescreve um arquivo existente. Abra `.env` e troque a senha da conexão:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/lume_teste?schema=public"
```

Se a senha contiver caracteres reservados como `@`, `:`, `/` ou `#`, codifique-os para uso em uma URL. O `.env` é local e não está no ZIP.

No pgAdmin, abra o Query Tool do banco **postgres** e execute fora de uma transação:

```sql
CREATE DATABASE lume_teste;
```

Volte ao terminal:

```powershell
npm.cmd run db:deploy
npm.cmd run seed
npm.cmd run dev
```

URL: **http://localhost:3333**. Verifique `GET /health` e `GET /health/db`.

O `seed` cria somente o administrador configurado em `.env`. Credenciais locais de exemplo:

```json
{
  "email": "admin@lume.local",
  "senha": "LumeAdmin@123"
}
```

Configure seus próprios valores em `ADMIN_EMAIL` e `ADMIN_SENHA` antes de criar um administrador real. O seed preserva a senha de uma conta administrativa já existente e não promove um estudante.

## Testar no Insomnia

Importe `insomnia/LUME_Insomnia.json`, selecione o ambiente **Local**, ajuste as credenciais administrativas e siga as pastas na ordem. A primeira requisição prepara dados de teste. Os scripts das respostas salvam os tokens e os IDs recebidos do banco.

A coleção contém todas as **75 combinações de método e rota**, corpos JSON, filtros e códigos de resposta esperados. Veja [docs/GUIA_INSOMNIA.md](docs/GUIA_INSOMNIA.md).

Para o fluxo de criação da coleção, execute somente `seed` e deixe a coleção cadastrar o catálogo. Como alternativa, `npm.cmd run seed:demo` cria um catálogo fictício para consultas imediatas. O comando imprime os IDs e pode ser repetido sem duplicar seus exemplos. Salários, mensalidades, notas e instituições DEMO não representam pesquisa oficial.

## Atualizar o banco antigo

Para preservar um banco preenchido, mantenha um backup e aponte `DATABASE_URL` para ele. Se corresponde ao esquema original, execute:

```powershell
npm.cmd run db:adotar
npm.cmd run db:status
```

O script confere tabelas e colunas do esquema enviado, reconhece a estrutura inicial e aplica a extensão. Nomes de tabelas, registros e IDs são preservados. Perfis são normalizados no banco para `usuario`/`admin`, compatíveis com o CHECK do DER; nas respostas continuam `ESTUDANTE`/`ADMIN`.

Etapas antigas são reunidas em uma **Rota original** por cargo. A migração interrompe a atualização se encontrar cursos ou posições repetidos dentro da mesma trilha antiga. Instituições antigas recebem `regular_mec=false`, para validação administrativa. Duração dos cursos e fontes de cargos devem ser preenchidas, sem valores inventados. Notas antigas sem fonte/ano são preservadas, mas não entram na simulação.

Se o banco já possuir alterações ou migrations próprias, compare-o com `prisma/legacy/schema-original.prisma` e adapte a extensão antes de aplicá-la. A conferência do script não substitui essa comparação. Não use `migrate reset` para atualizar dados existentes.

## Contrato para o frontend

- Header protegido: `Authorization: Bearer <token>`. JSON: `Content-Type: application/json`.
- IDs BIGINT voltam como **strings** e podem ser enviados como strings. Decimais do Prisma voltam como strings; estimativas calculadas voltam como números.
- Cadastro público exige `aceitou_termos: true` e sempre cria estudante. Administradores: seed ou `npm.cmd run admin:create -- "Nome" "email@exemplo.com" "SenhaForte@123"`.
- Login e refresh retornam `token`, `refresh_token`, `expires_in` e `token_type`. Cada refresh substitui o anterior. Logout, troca e recuperação de senha revogam sessões.
- Novos cursos exigem `duracao_meses`. Modalidades: `PRESENCIAL`, `EAD`, `HIBRIDO`.
- Ofertas visíveis exigem curso e instituição ativos e `regular_mec=true`. Instituições públicas têm mensalidade zero. EAD exige polo na cidade e UF selecionadas.
- Rotas são alternativas orientativas; suas etapas não bloqueiam a navegação do estudante.
- Distâncias são em linha reta, em km. Sem coordenadas, a distância é `null`; a prioridade regional continua disponível. O frontend deve solicitar a permissão real de GPS do dispositivo.
- O teste exige uma resposta de 1 a 5 para **cada pergunta ativa**. O último organiza o feed; os anteriores permanecem no histórico.
- `DELETE` no catálogo arquiva. `DELETE /usuarios/me` exclui a conta e os dados pessoais associados, após senha e confirmação `EXCLUIR`.
- Atualizações de catálogo geram notificações consultáveis em `/notificacoes`. Não há envio push ao dispositivo.

## Recuperação de senha e publicação

Em desenvolvimento, `EMAIL_MODE=console` permite testar sem servidor de e-mail. A resposta de recuperação de uma conta existente contém `token_desenvolvimento`. Esse token não é retornado em produção ou no modo SMTP.

Para envio real, configure `EMAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` e `FRONTEND_URL`. O frontend deve implementar `/redefinir-senha?token=...` e enviar o token à API. Em produção, o backend exige SMTP.

Cadastre fontes e valores reais antes de publicar. Fontes aceitas são URLs HTTP(S) em domínios governamentais `.gov.br`. Novos vínculos com fontes demonstrativas são bloqueados em produção. A API não coleta automaticamente salários, notas de corte ou dados do MEC.

## Verificação

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
```

Para integração, crie um **banco novo exclusivo de testes**, aplique as migrations e não execute `seed:demo`:

```powershell
$env:DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/lume_api_test?schema=public"
npm.cmd run db:deploy
$env:TEST_DATABASE_URL=$env:DATABASE_URL
npm.cmd run test:api
```

Os testes integrados criam e arquivam registros. Comece com catálogo vazio; crie outro banco para repeti-los. Veja [docs/VALIDACAO.md](docs/VALIDACAO.md) para os resultados e as condições do ambiente usado.

Para iniciar a versão compilada: `npm.cmd run build` e `npm.cmd start`. HTTPS, alta disponibilidade, compatibilidade visual do frontend, SMTP real e a meta de 500 usuários/P95 de 2 segundos dependem da implantação e de verificações próprias.

O mapeamento do projeto está em [docs/REQUISITOS_IMPLEMENTADOS.md](docs/REQUISITOS_IMPLEMENTADOS.md).
