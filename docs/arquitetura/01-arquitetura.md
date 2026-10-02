# LUME — Arquitetura de Software

## Stack documentada

O documento do LUME define:

- TypeScript;
- React;
- Node.js;
- Express;
- Prisma ORM;
- PostgreSQL;
- REST API / JSON;
- GitHub;
- Beekeeper Studio.

O projeto mantém essa stack no backend e frontend web. Para atender ao requisito de aplicação móvel, foi criada uma pasta `mobile/` usando **React Native com Expo**. A documentação original especifica React + TypeScript e produto web/móvel, mas não fixa um framework móvel; React Native/Expo é a materialização técnica adotada para a POC móvel.

## Arquitetura adotada

### Backend — Layered Architecture

`routes → controllers → services → Prisma → PostgreSQL`

- **Routes:** define os endpoints REST.
- **Controllers:** valida entrada HTTP e formata respostas.
- **Services:** contém regras de negócio e acesso ao Prisma.
- **Prisma:** mapeia entidades de domínio para o modelo físico.
- **PostgreSQL:** persistência relacional.

O arquivo `backend/src/routes/routes.ts` é o ponto central de composição das rotas.

### Frontend web

`React pages/components → Axios → REST API`

O frontend é mobile-first e mantém páginas separadas para carreira, curso, instituição, quiz, autenticação e perfil.

### Mobile

`React Native/Expo → Axios → REST API → Backend`

O aplicativo móvel não possui banco próprio. Ele consome a mesma API e, consequentemente, a mesma base PostgreSQL.

## Contrato de dados

O backend não deve criar campos de resposta que não possuam origem no banco, regra de negócio ou transformação explicitamente documentada. Quando um dado é derivado, a transformação deve estar no service.

Exemplo: a API pode apresentar `nomeCompleto`, enquanto a coluna física é `nome`; isso é uma transformação de domínio do Prisma e não uma nova coluna.

## Localização

A documentação define filtro geográfico e uso de localização do usuário, com foco inicial no Grande ABC. O banco mantém `latitude`, `longitude`, cidade, bairro e estado no modelo físico. O cálculo de distância deve permanecer na camada de serviço até que a regra de cálculo seja formalizada no documento de requisitos.
