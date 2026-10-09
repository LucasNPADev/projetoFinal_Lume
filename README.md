<div align="center">

# ✨ LUME
### GPS de Carreira

**Uma proposta de orientação vocacional e exploração de caminhos acadêmicos e profissionais.**

O LUME é um projeto de Trabalho de Conclusão de Curso (TCC) que busca aproximar estudantes de informações sobre carreiras, cursos e instituições de ensino, apoiando decisões mais conscientes sobre o futuro.

[![Backend CI](https://github.com/LucasNPADev/projetoFinal_Lume/actions/workflows/backend.yml/badge.svg?branch=dev)](https://github.com/LucasNPADev/projetoFinal_Lume/actions/workflows/backend.yml)
[![GitFlow CI](https://github.com/LucasNPADev/projetoFinal_Lume/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/LucasNPADev/projetoFinal_Lume/actions/workflows/ci.yml)
![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue)

**[Visão geral](#-sobre-o-lume) · [Funcionalidades](#-funcionalidades-e-estado-atual) · [Instalação](#-como-executar-localmente) · [API](#-contrato-atual-da-api) · [Insomnia](#-testes-com-insomnia) · [GitFlow](#-fluxo-de-trabalho-gitflow)**

</div>

---

## 🎯 Sobre o LUME

Escolher uma carreira envolve conhecer áreas de atuação, possibilidades de formação e instituições que oferecem cursos. O **LUME — GPS de Carreira** reúne esses conceitos em uma proposta de plataforma de orientação educacional e profissional.

O domínio do projeto contempla **estudantes, cargos, cursos, instituições, ofertas de cursos, trilhas formativas e informações relacionadas à orientação vocacional**. A implementação ocorre por etapas: **o que está modelado no banco de dados não necessariamente já possui uma rota HTTP ou uma tela funcional**.

> [!IMPORTANT]
> **Esta documentação descreve a branch `dev`.** O backend foi substituído integralmente pelo código enviado para o projeto e integrado no [PR #12](https://github.com/LucasNPADev/projetoFinal_Lume/pull/12). A `main` conserva a versão estável anterior até uma futura release. As duas versões **não têm o mesmo contrato de API nem o mesmo esquema de banco**.

## 🧭 Funcionalidades e estado atual

### ✅ Implementado no backend da `dev`

| Área | Implementação existente |
| :--- | :--- |
| **Autenticação** | Cadastro público de estudante, login por e-mail e senha, JWT e perfis `ESTUDANTE` / `ADMIN` |
| **Cursos** | Listagem com busca, filtros e paginação; consulta por ID; cadastro restrito a administrador |
| **Instituições** | Cadastro de instituição por administrador e vínculo entre instituição e curso |
| **Persistência** | PostgreSQL, Prisma, migração inicial e relações entre entidades |
| **Proteção das rotas** | Middleware de autenticação e autorização de administrador |
| **Qualidade** | Compilação TypeScript, testes de contrato e verificações na CI |
| **Testes manuais** | Coleção Insomnia com as oito operações HTTP implementadas |

O cadastro comum cria estudantes. A criação da conta administrativa é realizada por um **seed configurado pelo próprio desenvolvedor**, não por um endpoint público.

### 🖥️ Interface web existente

O repositório também contém um frontend **React + Vite + TypeScript**, com estrutura inicial e páginas de **Início**, **Carreiras** e **Quiz Vocacional**.

> [!WARNING]
> **Integração ainda pendente:** o frontend contém chamadas para `/cargos` e `/quiz/perguntas`, que **não existem no backend atual da `dev`**. Seu cliente HTTP também usa, por padrão, o prefixo `/api`, enquanto a nova API responde **sem esse prefixo**. Portanto, essas páginas não devem ser apresentadas como uma integração ponta a ponta concluída.

### 🗂️ Estrutura modelada no banco

O arquivo [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) possui **11 modelos**:

| Pessoas e orientação | Formação e instituições | Histórico e relacionamento |
| :--- | :--- | :--- |
| `Usuario` | `Curso` | `ConsultaCurso` |
| `Cargo` | `Instituicao` | `ConsultaCargo` |
| `PerguntaVocacional` | `Curso_Instituicao` | `Avaliacao` |
| `HistoricoTesteVocacional` | `TrilhaCargoCurso` | — |

**Atenção:** entidades como perguntas vocacionais, avaliações e trilhas fazem parte da **modelagem**, mas **não possuem endpoints próprios implementados nesta versão da API**.

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologias presentes no repositório |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, TypeScript, React Router e Axios |
| **Backend** | Node.js 22, Express 5 e TypeScript |
| **Validação** | Zod |
| **Autenticação** | JWT (`jsonwebtoken`) e hash de senha com `bcryptjs` |
| **Banco de dados** | PostgreSQL (versão 16 na CI) e Prisma ORM 6 |
| **Testes de API** | Insomnia (coleção Export v4), `node:test` e scripts de contrato |
| **Governança** | Git, GitHub, GitFlow, Pull Requests, rulesets e GitHub Actions |

## 🏗️ Organização do repositório

```text
projetoFinal_Lume/
├── .github/
│   ├── workflows/          # CI do backend, política de GitFlow e automações
│   └── rulesets/           # Configurações de proteção versionadas
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Modelagem de dados
│   │   ├── migrations/     # Migração inicial do backend atual
│   │   └── seed.ts         # Criação controlada de administrador local
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── routes.ts
│   │   └── server.ts
│   ├── tests/
│   ├── scripts/
│   ├── INSOMNIA.md
│   └── README.md
├── insomnia/                 # Coleção e guia oficial das 8 APIs
│   ├── colecao-lume.json
│   └── README.md
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/          # Home, Carreiras e Quiz
│       ├── services/
│       └── styles/
├── docs/                   # Organização para requisitos, diagramas,
│                            # monografia e pesquisas
├── scripts/                # Utilitários de governança
├── CONTRIBUTING.md
├── CHANGELOG.md
└── README.md
```

## 🚀 Como executar localmente

Os comandos abaixo usam **PowerShell no Windows**. É necessário ter **Git, Node.js 22, npm e PostgreSQL** instalados.

### 1. Clonar e acessar a branch de desenvolvimento

```powershell
cd "$HOME\Downloads"
git clone https://github.com/LucasNPADev/projetoFinal_Lume.git LUME_ATUALIZADO
cd .\LUME_ATUALIZADO
git switch dev
git pull --ff-only origin dev
```

> Se você já possui um **clone válido do LUME**, entre na pasta existente, confirme com `git remote -v` que o `origin` aponta para este repositório e atualize com `git fetch origin --prune` e `git pull --ff-only origin dev`. **Não execute comandos Git na pasta inicial do usuário do Windows.** Se houver alterações locais, preserve-as antes de atualizar.

### 2. Configurar o backend

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run prisma:generate
```

Edite o arquivo `backend/.env` e configure:

| Variável | Finalidade |
| :--- | :--- |
| `DATABASE_URL` | Conexão com um banco PostgreSQL **novo e vazio** de desenvolvimento |
| `JWT_SECRET` | Chave secreta aleatória e privada utilizada para assinar os JWTs |
| `JWT_EXPIRES_IN` | Tempo de validade do token; exemplo de desenvolvimento: `15m` |
| `PORT` | Porta HTTP (padrão: `3333`) |
| `ADMIN_NOME`, `ADMIN_EMAIL`, `ADMIN_SENHA` | Dados **definidos localmente pela equipe** para criar um administrador via seed |

Uma forma de gerar uma chave JWT localmente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copie a saída para `JWT_SECRET` no seu `.env`. **Nunca publique o valor real no GitHub.**

### 3. Preparar o banco e iniciar a API

Com o servidor PostgreSQL em execução e o `DATABASE_URL` configurado:

```powershell
npm run prisma:deploy
npm run dev
```

A API responderá em **`http://localhost:3333`** (ou na porta definida em `PORT`). Para verificar:

```powershell
Invoke-RestMethod http://localhost:3333/health
```

Resposta esperada:

```json
{ "status": "ok" }
```

**Para criar um administrador local (opcional):** antes de iniciar a API, informe `ADMIN_EMAIL` e `ADMIN_SENHA` reais **apenas no seu `.env` privado**, então execute `npm run seed`. O seed **não gera dados fictícios de cursos ou instituições**: ele apenas prepara a conta administrativa indicada. Utilize uma senha forte.

> [!CAUTION]
> **Migração do banco:** o schema atual possui 11 modelos e difere da versão antiga (19 modelos). A migration inicial foi preparada para um **banco vazio**. **Não execute `prisma:deploy` sobre o banco da versão anterior ou um banco com dados importantes** sem backup e um plano específico de migração. Não há script de conversão entre esses esquemas neste repositório.

### 4. Verificar a qualidade do backend

Em outro terminal, a partir de `backend/`:

```powershell
npm run typecheck
npm run build
npm run insomnia:validate
npm test
```

A CI executa essas verificações e também aplica migrations em um banco PostgreSQL temporário. Os testes atuais incluem verificações básicas de saúde da API e rejeição de requisições sem autenticação; **não substituem testes funcionais completos de toda a aplicação**.

### 5. Executar o frontend (interface inicial)

A partir da raiz do repositório:

```powershell
cd frontend
npm install
npm run dev
```

O Vite mostrará no terminal o endereço local para abrir no navegador.

**Importante:** o frontend **ainda precisa ser alinhado à API atual**. Em `frontend/.env.example`, a variável `VITE_API_URL` ainda utiliza `/api`, padrão do backend anterior. Ajustar a URL é apenas uma parte da integração: as rotas de carreiras e quiz também precisarão ser implementadas/adaptadas antes de funcionarem com dados reais.

## 🔌 Contrato atual da API

**URL-base:** `http://localhost:3333` — **sem `/api`**.

| Método | Endpoint | Acesso | Finalidade |
| :---: | :--- | :--- | :--- |
| `GET` | `/health` | Público | Verificar a resposta do servidor |
| `POST` | `/usuarios` | Público | Cadastrar estudante |
| `POST` | `/session` | Público | Autenticar usuário e obter JWT |
| `GET` | `/cursos` | Autenticado | Listar cursos, com filtros e paginação |
| `GET` | `/cursos/:id` | Autenticado | Consultar curso e suas ofertas ativas |
| `POST` | `/cursos` | Administrador | Cadastrar curso |
| `POST` | `/instituicoes` | Administrador | Cadastrar instituição |
| `POST` | `/instituicoes/:id/cursos` | Administrador | Vincular curso a instituição |

As rotas autenticadas utilizam o cabeçalho `Authorization: Bearer <token>`. A autorização do perfil `ADMIN` é validada no backend. Para detalhes, consulte o [guia técnico do backend](backend/README.md) e o [registro das rotas](backend/src/routes.ts).

## 🧪 Testes com Insomnia

A coleção oficial da `dev` está em **[`insomnia/colecao-lume.json`](insomnia/colecao-lume.json)** e corresponde às **oito operações HTTP** mostradas acima.

1. Abra o Insomnia e importe o arquivo JSON.
2. Configure `base_url` como `http://localhost:3333`.
3. Execute `GET /health` para testar o servidor.
4. Cadastre um estudante em `POST /usuarios` e autentique-se em `POST /session`.
5. Guarde o JWT na variável **local e privada** `token`; para ações administrativas, utilize `admin_token` de uma conta criada pelo seed.
6. Use os **IDs retornados pelo seu próprio banco** nas requisições que exigem curso ou instituição.

Os nomes, e-mails e dados nos exemplos da coleção são **exclusivamente ilustrativos para teste**, **não constituem cadastro verdadeiro do LUME**. Não inclua JWTs, senhas, tokens ou dados pessoais reais nos arquivos versionados.

Guia completo: **[Como testar no Insomnia](insomnia/README.md)**.

> **Segurança:** um PR antigo fechado (PR #11) registrou JWTs literais em seu diff. A coleção atual **não contém tokens de acesso**, mas o histórico pode permanecer acessível. É necessário que os responsáveis pelos ambientes que emitiram esses JWTs **rotacionem o `JWT_SECRET` fora do repositório**. Consulte as [instruções de segurança do Insomnia](insomnia/README.md#segurança--obrigatório).

## 🌿 Fluxo de trabalho (GitFlow)

O repositório mantém duas branches **permanentes e protegidas**:

| Branch | Finalidade |
| :--- | :--- |
| **`dev`** | Integração do trabalho das sprints e do backend recebido |
| **`main`** | Versão estável, atualizada apenas após homologação/release ou hotfix |

Fluxo de trabalho adotado:

```text
feature/* ──┐
bugfix/*  ──┼──> Pull Request ──> dev ──> release/* ──> Pull Request ──> main
docs/*    ──┘                                             │
                                          sincronizar main ─┘──> dev

hotfix/* (a partir de main) ──> main ──> sincronizar alterações para dev
```

- Alterações de documentação, funcionalidades e correções entram primeiro em **`dev` por Pull Request**.
- As regras de proteção exigem os checks **`Politica Git Flow`** e **`Backend CI`** antes do merge.
- A publicação na **`main` não é automática**: ocorre por um fluxo de release ou hotfix.
- Branches temporárias são removidas após integração; `main` e `dev` são preservadas.

Para colaborar: leia **[CONTRIBUTING.md](CONTRIBUTING.md)**, **[GitFlow](docs/GIT_FLOW.md)** e **[Proteções do repositório](docs/RULESETS.md)**.

## 📚 Documentação e histórico

| Recurso | Conteúdo |
| :--- | :--- |
| [Backend](backend/README.md) | Dependências, instalação, rotas e limitações |
| [Insomnia](insomnia/README.md) | Importação da coleção, variáveis locais, endpoints e segurança |
| [Schema Prisma](backend/prisma/schema.prisma) | Estrutura dos 11 modelos de dados |
| [GitFlow](docs/GIT_FLOW.md) | Estratégia de branches, PRs, releases e hotfixes |
| [Rulesets](docs/RULESETS.md) | Regras de proteção de `main` e `dev` |
| [Contribuição](CONTRIBUTING.md) | Convenções para o trabalho colaborativo |
| [CHANGELOG](CHANGELOG.md) | Histórico de versões anteriores |
| [`docs/`](docs/) | Pastas de organização para requisitos, diagramas, pesquisas e monografia |

> Algumas áreas em `docs/` são **estruturas de organização**; seus arquivos `README.md` não representam, por si só, a publicação integral dos documentos acadêmicos do grupo.

## 📌 Próximos pontos de integração

- **Alinhar frontend e backend:** base URL, autenticação e formatos de resposta.
- **Implementar ou adaptar endpoints ainda ausentes** para páginas de carreiras e quiz, caso permaneçam no escopo aprovado do TCC.
- **Validar o banco e os fluxos no ambiente do grupo**, preservando os dados e as regras realmente definidos pelo projeto.
- **Homologar uma release** antes de promover o backend atual da `dev` para a `main`.

---

<div align="center">

**LUME · GPS de Carreira**  
*Projeto de Conclusão de Curso — desenvolvimento e documentação técnica.*

[Voltar ao início ↑](#-lume)

</div>
