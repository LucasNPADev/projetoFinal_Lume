# Sprint 4 — Organização do Frontend (sem alteração de código)

## Objetivo
Organizar os diretórios para facilitar o reuso de componentes, a manutenção e a governança do LUME. Esta etapa **não altera implementações**, não move arquivos existentes, não modifica APIs, não instala dependências e não executa migração de framework.

## Situação observada na branch `dev`
O frontend ainda possui uma estrutura React/Vite em `frontend/src`, com páginas em `pages/`, chamadas HTTP em `services/`, navegação em `routes/` e arquivos de configuração ainda pendentes. A versão Next.js da Sprint 4 foi desenvolvida separadamente; sua integração precisa ser planejada antes de substituir o frontend da `dev`.

## Diretórios de componentes reservados
| Pasta | Responsabilidade futura |
|---|---|
| `frontend/src/components/ui/` | Botões, campos, estados de carregamento, estados vazios, erros e modais genéricos |
| `frontend/src/components/layout/` | Cabeçalho, menu lateral, rodapé e estrutura compartilhada de páginas |
| `frontend/src/components/cargos/` | Cartões e filtros de carreiras |
| `frontend/src/components/cursos/` | Cartões, resumos e filtros de cursos |
| `frontend/src/components/instituicoes/` | Cartões e informações reutilizáveis de instituições |
| `frontend/src/components/formularios/` | Campos compostos e validações visuais reutilizáveis |
| `frontend/src/components/admin/` | Componentes específicos da administração |

Todas as pastas acima são reservas vazias, mantidas no Git por um arquivo `.gitkeep`. **Nenhum componente ou código foi movido para elas nesta etapa.**

## Estrutura existente que permanece
- `frontend/src/pages/`: páginas atuais.
- `frontend/src/services/`: integração HTTP atual.
- `frontend/src/routes/`: rotas atuais.
- `frontend/src/contexts/`: contextos existentes.
- `frontend/src/hooks/`: hooks existentes.
- `frontend/src/types/`: tipos existentes.
- `frontend/src/styles/`: estilos existentes.
- `backend/`, `insomnia/` e diretórios de banco de dados: intocados.

## Convenções sugeridas (para adoção posterior)
1. Criar componente compartilhado quando for reutilizado ou tiver responsabilidade própria.
2. Preferir nomes consistentes com os componentes e arquivos existentes.
3. Centralizar consumo de API nos serviços; não copiar requisições entre páginas.
4. Manter tipos compartilhados centralizados e evitar duplicatas.
5. Nunca commitar `.env`, `.env.local`, tokens JWT, senhas, chaves privadas ou dados pessoais.
6. Executar testes, checagem de tipos e build antes de integrar mudanças de código.
7. Em migração para Next.js, organizar `app/`, `components/`, `lib/` e `providers/` apenas após preservar contratos de API e atualizar imports.
8. Não substituir React/Vite pelo Next.js sem combinar a integração com a equipe.

## Próximas tarefas que **não foram realizadas**
- Corrigir os arquivos vazios `frontend/package.json`, `frontend/tsconfig.json`, `frontend/.gitignore`, `frontend/src/App.tsx` e `frontend/src/services/api.ts`.
- Migrar páginas e componentes para o Next.js.
- Configurar CI do frontend.
- Corrigir integrações e testar o banco de dados.
- Atualizar imports, dependências ou arquivos de configuração.

**Escopo deste registro:** organização inicial na `dev`, sem Pull Request e sem alteração de código-fonte.
