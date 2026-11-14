# Recuperação de branches consolidadas no LUME

**Data:** 14/11/2026. **Destino dos históricos:** branch `dev` do repositório `LucasNPADev/projetoFinal_Lume`.

## Por que este registro existe

As quatro branches de trabalho abaixo têm códigos e testes que foram selecionados e integrados na `dev` pelo **PR #19**. Entretanto, integração seletiva de arquivos não é a mesma coisa que importar a ancestralidade dos commits. Para preservar os **commits originais**, quatro commits de merge de histórico foram criados, cada um com **dois pais**, com a árvore do código mantida exatamente igual à `dev` anterior. Esses merges não reaplicam arquivos antigos nem migrações incompatíveis.

| Branch original | Commit HEAD antes da exclusão | Merge histórico criado |
|---|---|---|
| `bugfix/atualizacao-lume` | [`5d3f97d282dec98acba48ed063cf89cc20999a96`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/5d3f97d282dec98acba48ed063cf89cc20999a96) | [`ce216f3e34d764d1f5162f9edb1eb7185dd561a1`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/ce216f3e34d764d1f5162f9edb1eb7185dd561a1) |
| `feature/testes-lume` | [`c34d8204a102d3f7c4a967a1491501b5c22a116b`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/c34d8204a102d3f7c4a967a1491501b5c22a116b) | [`34cd3e51cacd34f05b0243f96943dbe4aa4e37a9`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/34cd3e51cacd34f05b0243f96943dbe4aa4e37a9) |
| `feature/finalizacao-testes-lume` | [`235e2e301f9abca746d9b993e2e17026665367dd`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/235e2e301f9abca746d9b993e2e17026665367dd) | [`5ed616d38b06b0769144b808695b08f5538a4a0f`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/5ed616d38b06b0769144b808695b08f5538a4a0f) |
| `feature/sprint4-organizacao` | [`d871c558c3a2713293e0cfeb4be317edcc1421a7`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/d871c558c3a2713293e0cfeb4be317edcc1421a7) | [`c184a956810ed59c2e7b817c101a7d172d84a196`](https://github.com/LucasNPADev/projetoFinal_Lume/commit/c184a956810ed59c2e7b817c101a7d172d84a196) |

**Base preservada antes do arquivamento:** `cac2ab0eea56123dadee0497e97a22b0db531eba`.

**Árvore de arquivos durante os quatro merges de histórico:** `6ece64b230280d96094b080c961ceac87ecf186e` — idêntica à `dev` anterior. O único arquivo novo destinado à `dev` com este PR é este registro documental. O `main` não é alterado.

## Como recriar uma branch excluída

Depois de integrar este PR na `dev`, a história original estará alcançável por `git log`. Para restaurar qualquer branch no GitHub:

```bash
git clone https://github.com/LucasNPADev/projetoFinal_Lume.git
cd projetoFinal_Lume
git fetch origin dev
git switch -c bugfix/atualizacao-lume 5d3f97d282dec98acba48ed063cf89cc20999a96
git push -u origin bugfix/atualizacao-lume
git switch dev

git switch -c feature/testes-lume c34d8204a102d3f7c4a967a1491501b5c22a116b
git push -u origin feature/testes-lume
git switch dev

git switch -c feature/finalizacao-testes-lume 235e2e301f9abca746d9b993e2e17026665367dd
git push -u origin feature/finalizacao-testes-lume
git switch dev

git switch -c feature/sprint4-organizacao d871c558c3a2713293e0cfeb4be317edcc1421a7
git push -u origin feature/sprint4-organizacao
git switch dev
```

Os quatro comandos acima são alternativas independentes: execute **apenas o par** de criação e push da branch que deseja restaurar. Em uma cópia local que já exista, basta fazer `git fetch origin dev` e depois criar a branch do SHA desejado.

Alternativa para ver os commits sem restaurar uma branch: `git log --graph --oneline --all --decorate` ou `git log dev --ancestry-path` (ajuste conforme a linha de base). Para validar a inclusão de cada ponta original: `git merge-base --is-ancestor <sha_original> origin/dev`.

## Como conferir se a dev manteve os arquivos essenciais

- **API Web Mobile:** `backend/`, `frontend/`, `mobile/`.
- **Governança, CI e testes:** `.github/`, `docs/`, `insomnia/`.
- **Schema e migrações Prisma:** nunca restaurar/rodar automaticamente a migration `0_base` das branches antigas em um banco atual; consultar `docs/INTEGRACAO_SELETIVA_DEV_20261114.md`.
- **PR #19** já consolidou seletivamente o conteúdo necessário. Este PR apenas traz os commits históricos + este documento.

## Regras para exclusão segura

1. Confirmar que este PR de preservação foi integrado e que todas as quatro pontas acima são ancestrais de `dev`.
2. Confirmar que a árvore de arquivos da `dev` continua igual à base exceto este documento.
3. Somente então excluir **as quatro branches de trabalho**; preservar `dev` e `main`.
4. A exclusão de ref Git **não remove automaticamente os commits** que se tornaram ancestrais de `dev`.
5. Recriar uma branch a partir do SHA original se necessário; não usar `git reset --hard` em `dev` como forma de restauração.

## Aviso
Históricos preservados podem incluir código de teste antigo ou versões inseguras, mesmo que não estejam presentes no código em execução; use a `dev` atual para desenvolver. Não publique senhas ou arquivos `.env` ao restaurar branches.
