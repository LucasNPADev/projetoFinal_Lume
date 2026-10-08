# Git Flow — LUME (TCC)

O LUME usa **Git Flow** para separar as entregas em desenvolvimento do codigo estavel. A branch padrao do GitHub continua sendo `main`; `dev` concentra o trabalho das sprints. As duas sao permanentes.

## Estrutura e destinos de pull request

| Origem | Criada a partir de | Destino do PR | Quando usar |
| --- | --- | --- | --- |
| `feature/<slug>` | `dev` | `dev` | Nova funcionalidade |
| `bugfix/<slug>` | `dev` | `dev` | Correcao em desenvolvimento |
| `docs/<slug>`, `chore/<slug>`, `ci/<slug>`, `test/<slug>`, `refactor/<slug>` | `dev` | `dev` | Documentacao, manutencao ou testes |
| `release/vx.y.z` (ou `release/x.y.z`) | `dev` | `main` **e** `dev` | Homologar e preparar versao estavel |
| `hotfix/<slug>` (ou `hotfix/x.y.z`) | `main` | `main` **e** `dev` | Corrigir bug critico de producao |
| `main` | permanente | `dev` | Apenas sincronizar release/hotfix |

Use nomes em minusculas e hifens: `feature/login-estudante`,
`bugfix/quiz-resposta-invalida`, `release/v1.0.0` ou `hotfix/erro-login-prod`.
Releases usam versao semantica opcionalmente com `v` no nome. Hotfix pode ter descricao em `slug` ou versao.
Nao apague `main` nem `dev`; exclua apenas branches temporarias apos merge e sincronizacao.

O workflow `CI / Politica Git Flow` rejeita PRs cujo nome ou
destino nao respeite estas convencoes. Ele **nao consegue impedir push
direto**; para isso, configure a protecao de branches mais abaixo.

## Preparar seu clone (PowerShell)

Antes de tudo, confirme que esta na pasta correta. Houve anteriormente
um `origin` apontando para outro projeto: **nao modifique o remote da
pizzaria**. Prefira clonar uma copia limpa do LUME caso necessario:

```powershell
cd "$HOME\Downloads"
git clone https://github.com/LucasNPADev/projetoFinal_Lume.git projetoFinal_Lume_gitflow
cd .\projetoFinal_Lume_gitflow
git remote -v
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
```

Em um clone existente **que voce confirmou ser realmente o LUME**, basta:

```powershell
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
```

## Funcionalidade / Sprint

```powershell
git switch dev
git pull --ff-only origin dev
git switch -c feature/catalogo-cursos
# implementar e testar
git add .
git commit -m "feat: criar filtro de cursos"
git push -u origin feature/catalogo-cursos
```

Abra PR da `feature/catalogo-cursos` para a `dev`. Preencha
o template, aguarde a CI e revisao. Depois do merge, pode excluir
a branch `feature/*` remota e local.

O mesmo procedimento vale para `bugfix/*`, `docs/*` e `ci/*`.

## Release

```powershell
git switch dev
git pull --ff-only origin dev
git switch -c release/v1.0.0
# somente revisao e correcao de homologacao
git push -u origin release/v1.0.0
```

Abra PR `release/v1.0.0 -> main`. So faca merge com os testes
e aceite funcional concluidos. Depois de aprovar e atualizar `main`:

```powershell
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "LUME 1.0.0"
git push origin v1.0.0
```

Em seguida, reincorpore correcoes de homologacao na `dev`
com PR `release/v1.0.0 -> dev` (se a branch ainda existir) ou
PR `main -> dev`. Confira que a `dev` contem
as correcoes **antes** de apagar `release/v1.0.0`.
Nao crie duas tags com o mesmo numero.

## Hotfix

```powershell
git switch main
git pull --ff-only origin main
git switch -c hotfix/erro-login-prod
# corrigir e validar regressao
git add .
git commit -m "fix: corrigir regressao"
git push -u origin hotfix/erro-login-prod
```

Abra PR `hotfix/erro-login-prod -> main`, faca merge apos revisao,
crie a tag `v1.0.1` no commit da `main` e leve o hotfix
tambem a `dev` por PR `hotfix/* -> dev` ou `main -> dev`.
Isso impede que a regressao retorne no proximo release.

## Protecoes ativas — rulesets no GitHub

Os rulesets foram confirmados ativos em 08/10/2026. Para consultar ou alterar, abra
[Settings > Rules > Rulesets](https://github.com/LucasNPADev/projetoFinal_Lume/settings/rules)
com a sua conta administradora. Os dois rulesets existentes exigem:

1. Exigir pull request e impedir pushes diretos.
2. Exigir revisao/aprovacao de outra pessoa, se houver colegas
   revisores; caso seja trabalho individual, ajuste o numero
   conscientemente para nao criar bloqueio impossivel.
3. Exigir resolucao de conversas, bloquear force push e exclusao.
4. Exigir o status check **Politica Git Flow** do workflow **CI**.
5. Aplicar regras tambem aos administradores quando possivel.

O job **Backend CI** executa em todos os PRs para `main` e `dev`, inclusive
alteracoes em documentacao, para que status checks obrigatorios nao fiquem pendentes.

**A protecao efetiva depende do estado das regras no servidor GitHub.**
A verificacao de policy rejeita `dev -> main` e permite `main -> dev`.
Uma vez aprovado o PR `release/* -> main` ou `hotfix/* -> main`,
abra um PR `main -> dev` para trazer a integracao da versao estavel.
O merge gera um commit na `dev`; **SHAs diferentes entre main e dev
sao normais** mesmo quando nenhum arquivo difere.

## Criterios de aceite por PR

- Issue, requisito ou sprint identificado no template.
- Testes e CI concluidos; para backend, migration/Prisma, TypeScript
  e integracao PostgreSQL.
- Atualizar contrato REST e colecao Postman quando necessario.
- Revisar segredos, dados pessoais, autorizacao e cenarios de falha.
- Nao reescrever migrations ja aplicadas.
- Antes da release: homologacao funcional e roteiro para banca.

O utilitario local `git-flow` e opcional. Os comandos Git acima
funcionam sem extensao. Se voce tiver `git flow` instalado, configure
`main` como production e `dev` como development.

## Regras versionadas para main/dev

Os payloads estao em [../.github/rulesets](../.github/rulesets) e o
procedimento de ativacao em [RULESETS.md](RULESETS.md). Rode
`scripts/apply-rulesets.ps1` usando GitHub CLI autenticado para **consultar** as regras
sem alteracoes. **Nao rode com `-Apply` sem revisar as configuracoes vigentes:**
a aplicacao pode sobrescrever ajustes manuais. Consulte [RULESETS.md](RULESETS.md).

A branch legada `develop` foi substituida por `dev` preservando o
historico. A limpeza das branches antigas foi executada e o workflow
temporario removido. O Git Flow do LUME usa `main` e `dev`
como as duas branches permanentes.

## Conceito de branches temporarias

O pedido de manter somente `main` e `dev` se refere as duas **branches permanentes**.
No Git Flow completo, branches de suporte existem somente durante a tarefa:

- `feature/*`: nasce de `dev`, nova funcionalidade, PR volta para `dev`.
- `release/*`: nasce de `dev`, estabilizacao, apenas ajustes finos e documentacao; PR para `main` e sincronizacao para `dev` apos o merge. Tag `vX.Y.Z` no commit de `main`.
- `hotfix/*`: nasce de `main` para erro urgente, PR para `main` e sincronizacao para `dev`.
- `bugfix/*` (opcional): nasce de `dev` e retorna para `dev` para bugs normais.

Exemplo simplificado:

```text
feature/nova-tela -----\
                       v
main ------------------------<release/v1.0.0>----<hotfix/erro-login-prod>--
                       ^                     |
dev ------<feature>-----+----<release>-------+----<hotfix>---------------
```

Depois de finalizados os PRs e sincronizados os fixes, as branches temporarias
podem ser apagadas: o historico fica em `main` e `dev` e nas tags de release.
A regra automatica de PR verifica **nome e destino**; nao verifica sozinha se
uma feature foi originalmente criada a partir de `dev`. Isso deve ser
conferido na revisao (ou com verificacao de ancestralidade especifica).

**IMPORTANTE:** as configuracoes em `.github/rulesets/*.json` so entram em vigor
apos serem aplicadas com permissao administrativa; arquivos versionados
nao equivalem a rulesets ativos no GitHub. Veja [RULESETS.md](RULESETS.md).

## Limpeza automatica de branches temporarias

O workflow [GitFlow - limpeza apos merge](../.github/workflows/gitflow-cleanup.yml)
remove branches temporarias do proprio repositorio apos PR mesclado em
`main` ou `dev`, conservando sempre as duas permanentes. Ele confere
nome, commit esperado, origem do PR e merge concluido antes da exclusao.
A limpeza nao deve ser feita antes de sincronizar correcoes de releases
ou hotfixes com `dev`; por isso recomenda-se o PR `main -> dev`
apos a publicacao. Se a limpeza ocorrer antes, o commit mesclado em
`main` ainda pode ser trazido por `main -> dev`.
