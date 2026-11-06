# Planejamento de Implementação de Testes - Sistema LUME (TCC)

Este documento detalha o roteiro de implementação da suíte de testes do sistema LUME. A abordagem seguirá a regra de **um commit por caso de teste implementado**, garantindo rastreabilidade e organização no controle de versão.

## 🚀 Boas Práticas de Implementação
- **Isolamento:** Cada teste deve rodar de forma independente, sem depender do estado deixado por outro teste.
- **Limpeza (Teardown):** Garantir que os dados criados no banco de dados durante o teste (ex: usuários de teste) sejam apagados ou revertidos após a execução.
- **Padrão de Commits:** Utilizar *Conventional Commits* com o prefixo `test(escopo): descrição`.

---

## 📱 Fase 1: Ambiente de Usuário - Autenticação e Onboarding

- [x] **CT001 - Cadastro de Novo Estudante no Aplicativo com Dados Válidos**
  - **Objetivo:** Validar a criação de conta e persistência com hash bcrypt.
  - **Commit sugerido:** `test(auth): implementa CT001 para cadastro valido de estudante`

- [x] **CT002 - Bloqueio de Cadastro com E-mail Já Existente no Sistema**
  - **Objetivo:** Validar o status HTTP 409 e o alerta no frontend.
  - **Commit sugerido:** `test(auth): implementa CT002 para bloqueio de email duplicado`

- [x] **CT003 - Autenticação de Estudante (Login)**
  - **Objetivo:** Validar retorno do HTTP 200 OK, gravação do token JWT e redirecionamento.
  - **Commit sugerido:** `test(auth): implementa CT003 para login de estudante com sucesso`

- [x] **CT004 - Bloqueio de Autenticação com Senha Incorreta**
  - **Objetivo:** Validar retorno HTTP 401 e recusa de acesso.
  - **Commit sugerido:** `test(auth): implementa CT004 para bloqueio de login com senha incorreta`

- [x] **CT005 - Solicitação de recuperação de senha com e-mail válido**
  - **Objetivo:** Validar o fluxo de SMTP e geração de link/token de recuperação.
  - **Commit sugerido:** `test(auth): implementa CT005 para solicitacao de recuperacao via SMTP`

---

## 🧭 Fase 2: Ambiente de Usuário - Funcionalidades Principais

- [x] **CT006 - Resolução Completa do Teste Vocacional com Geração de Perfil**
  - **Objetivo:** Validar o algoritmo de afinidade e a geração do gráfico final.
  - **Commit sugerido:** `test(vocational): implementa CT006 para resolucao completa do teste`

- [x] **CT007 - Cancelamento do Envio do Teste Vocacional com Respostas Pendentes**
  - **Objetivo:** Validar a obrigatoriedade de 100% de preenchimento do form.
  - **Commit sugerido:** `test(vocational): implementa CT007 para bloqueio de teste incompleto`

- [x] **CT008 - Consulta e Busca de Cargos/Profissões por Palavra-Chave**
  - **Objetivo:** Validar o filtro em tempo real de listagem de cargos.
  - **Commit sugerido:** `test(search): implementa CT008 para busca de cargos por palavra-chave`

- [x] **CT009 - Consulta e Filtragem de Cursos por Modalidade (EAD e Presencial)**
  - **Objetivo:** Validar a aplicação de filtros combinados (modalidade + texto).
  - **Commit sugerido:** `test(search): implementa CT009 para filtro de cursos por modalidade`

---

## ⚙️ Fase 3: Ambiente de Admin (Portal Web)

- [ ] **CT010 - Autenticação Administrativa e Concessão de Permissão (ROLE_ADMIN)**
  - **Objetivo:** Validar o RBAC (Role-Based Access Control) e acesso ao painel.
  - **Commit sugerido:** `test(admin): implementa CT010 para autenticacao exclusiva ROLE_ADMIN`

- [ ] **CT011 - Cadastramento de Perguntas para o Teste Vocacional**
  - **Objetivo:** Validar a persistência de novas perguntas e pesos no banco.
  - **Commit sugerido:** `test(admin): implementa CT011 para cadastro de novas perguntas`

- [ ] **CT012 - Cadastramento de Novo Cargo e Especificação de Requisitos**
  - **Objetivo:** Validar a inclusão de um novo cargo e sua disponibilidade no app.
  - **Commit sugerido:** `test(admin): implementa CT012 para criacao de novo cargo`

- [ ] **CT013 - Cadastramento de Instituições de Ensino e Inclusão de Cursos**
  - **Objetivo:** Validar relacionamento entre Instituição e Curso no banco relacional.
  - **Commit sugerido:** `test(admin): implementa CT013 para cadastro de instituicao e cursos`