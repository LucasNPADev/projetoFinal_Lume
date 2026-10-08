# Rulesets obrigatorios do LUME

Os rulesets **LUME | main | protecao obrigatoria** e **LUME | dev | protecao obrigatoria**
foram confirmados **Active no GitHub em 08/10/2026**. Protegem as branches
permanentes `main` e `dev`, sem bypass, com PR obrigatorio, sem force push
ou exclusao e com os checks `Politica Git Flow` e `Backend CI` obrigatorios.

Os JSONs versionados em `.github/rulesets/` documentam a configuracao
consultada na API GitHub na data acima. Sao um **snapshot**: alteracoes
manuais futuras devem ser verificadas antes de sobrescrever os rulesets.
Versao em arquivo por si so nao cria protecao; a autoridade e o GitHub.

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

**Sem parametros, o script apenas consulta e verifica os rulesets ativos;
nao faz alteracoes.** Para recriar ou reaplicar os JSONs versionados,
execute explicitamente:

```powershell
.\\scripts\\apply-rulesets.ps1 -Apply
```

**Atencao:** `-Apply` substitui a configuracao atual pela versao dos arquivos.
Se mudou aprovacoes, revisores, checks ou outras opcoes pela interface do
GitHub, primeiro atualize os arquivos ou mantenha apenas o modo consulta.
O script nao armazena tokens.

Alternativa: abra
[Settings > Rules > Rulesets](https://github.com/LucasNPADev/projetoFinal_Lume/settings/rules)
e crie manualmente os dois rulesets usando os JSON como referencia.

Para verificar a configuracao que **realmente** esta ativa no momento, consulte:

```powershell
gh api repos/LucasNPADev/projetoFinal_Lume/rulesets --jq '.[] | [.name, .enforcement] | @tsv'
```

A limpeza de branches legadas foi executada com sucesso no GitHub Actions.
O workflow temporario foi removido apos a execucao.
As duas branches permanentes sao **main** e **dev**. Nunca remova essas branches.
Branches temporarias de trabalhos futuros devem ser excluidas depois de
mescladas, revisadas e sincronizadas. As configuracoes permanecem administradas pelo GitHub. Para alterar regras ativas, use uma conta com permissao administrativa.

## Politica operacional

- **main:** destino apenas de PR de `release/*` ou `hotfix/*`, nunca `dev -> main` diretamente.
- **dev:** integra `feature/*` / `bugfix/*` e recebe `main -> dev` para sincronizacao apos releases e hotfixes.
- **Temporarias:** excluidas apos merge e sincronizacao, mantendo somente duas branches permanentes.
- **Status checks:** dois checks obrigatorios executados em PRs para `main` e `dev`; edicoes so documentais tambem os disparam.
- **Atualizacao da base:** ambos os rulesets exigem checks atualizados com sua branch-base.
- **Revisao humana:** configurada com 0 aprovacoes obrigatorias na data consultada; para obrigar outra pessoa revisar, configure 1 e nao habilite bypass.
