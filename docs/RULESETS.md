# Aplicar rulesets ativos do LUME

Os arquivos **.github/rulesets/main.json** e **.github/rulesets/dev.json** sao
configuracoes da API REST do GitHub. Versionar os arquivos **nao ativa** as
regras automaticamente: execute o script com uma conta GitHub autorizada.

## Protecoes de main e dev

Cada ruleset:
- somente a branch exata `main` ou `dev`;
- `enforcement: active` e `bypass_actors: []`;
- proibe exclusao e force push da branch permanente;
- exige pull request antes de integrar mudancas;
- exige todas as conversas do PR resolvidas;
- exige os dois checks `Politica Git Flow` e `Backend CI`;
- exige estar atualizado com a base antes de integrar;
- exige **zero** aprovacoes formais, para nao bloquear equipes sem
  um segundo colaborador; para exigir aprovacao humana, altere
  `required_approving_review_count` para 1 nos JSON antes de aplicar.
  O GitHub nao aceita autoaprovacao do autor do PR.

O job Backend CI roda em **todos** os PRs para `main` e `dev`,
inclusive mudancas documentais, evitando status check obrigatorio
ficar permanentemente pendente.

## Aplicar no GitHub (PowerShell)

Requer GitHub CLI (`gh`) autenticado com permissão **Administration:
write** sobre o repositorio. Execute na raiz do clone:

```powershell
gh auth login
.\scripts\apply-rulesets.ps1
```

O script cria ou atualiza exatamente os dois rulesets pelo nome,
usa a autenticacao local do GitHub CLI (nao inclui tokens no repositorio)
e verifica a ativacao apos salvar.

Alternativa: abra
[Settings > Rules > Rulesets](https://github.com/LucasNPADev/projetoFinal_Lume/settings/rules)
e crie manualmente os dois rulesets usando os JSON como referencia.

Sem autenticação de administrador e resultado confirmado da API, o
repositório **nao deve ser descrito como protegido**. Verifique os
rulesets ativos em:

```powershell
gh api repos/LucasNPADev/projetoFinal_Lume/rulesets --jq '.[] | [.name, .enforcement] | @tsv'
```

A limpeza de branches legadas foi executada com sucesso no GitHub Actions.
O workflow temporario foi removido apos a execucao.
As duas branches permanentes sao **main** e **dev**. Nunca remova essas branches.
Branches temporarias de trabalhos futuros devem ser excluidas depois de
mescladas, revisadas e sincronizadas. A ativacao dos rulesets permanece
dependente das permissoes administrativas conforme as instrucoes acima.
