# Git Flow — LUME (TCC)

O LUME usa **Git Flow** para separar as entregas em desenvolvimento do codigo estavel. A branch padrao do GitHub continua sendo `main`; `develop` concentra o trabalho das sprints. As duas sao permanentes.

## Estrutura e destinos de pull request

| Origem | Criada a partir de | Destino do PR | Quando usar |
| --- | --- | --- | --- |
| `feature/<slug>` | `develop` | `develop` | Nova funcionalidade |
| `bugfix/<slug>` | `develop` | `develop` | Correcao em desenvolvimento |
| `docs/<slug>`, `chore/<slug>`, `ci/<slug>`, `test/<slug>`, `refactor/<slug>` | `develop` | `develop` | Documentacao, manutencao ou testes |
| `release/x.y.z` | `develop` | `main`, depois `develop` | Homologar entrega estavel |
| `hotfix/x.y.z` | `main` | `main`, depois `develop` | Corrigir producao |
| `main` | permanente | `develop` | Apenas sincronizar release/hotfix |

Use nomes em minusculas e hifens: `feature/login-estudante`,
`bugfix/quiz-resposta-invalida`, `release/1.0.0` ou `hotfix/1.0.1`.
Release e hotfix devem usar versao semantica `x.y.z`.
Nao apague `main` nem `develop`; exclua apenas branches temporarias apos merge e sincronizacao.

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
git switch develop
git pull --ff-only origin develop
```

Em um clone existente **que voce confirmou ser realmente o LUME**, basta:

```powershell
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
```

## Funcionalidade / Sprint

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/catalogo-cursos
# implementar e testar
git add .
git commit -m "feat: criar filtro de cursos"
git push -u origin feature/catalogo-cursos
```

Abra PR da `feature/catalogo-cursos` para a `develop`. Preencha
o template, aguarde a CI e revisao. Depois do merge, pode excluir
a branch `feature/*` remota e local.

O mesmo procedimento vale para `bugfix/*`, `docs/*` e `ci/*`.

## Release

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c release/1.0.0
# somente revisao e correcao de homologacao
git push -u origin release/1.0.0
```

Abra PR `release/1.0.0 -> main`. So faca merge com os testes
e aceite funcional concluidos. Depois de aprovar e atualizar `main`:

```powershell
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "LUME 1.0.0"
git push origin v1.0.0
```

Em seguida, reincorpore correcoes de homologacao na `develop`
com PR `release/1.0.0 -> develop` (se a branch ainda existir) ou
PR `main -> develop`. Confira que a `develop` contem
as correcoes **antes** de apagar `release/1.0.0`.
Nao crie duas tags com o mesmo numero.

## Hotfix

```powershell
git switch main
git pull --ff-only origin main
git switch -c hotfix/1.0.1
# corrigir e validar regressao
git add .
git commit -m "fix: corrigir regressao"
git push -u origin hotfix/1.0.1
```

Abra PR `hotfix/1.0.1 -> main`, faca merge apos revisao,
crie a tag `v1.0.1` no commit da `main` e leve o hotfix
tambem a `develop` por PR `hotfix/* -> develop` ou `main -> develop`.
Isso impede que a regressao retorne no proximo release.

## Protecoes recomendadas — configuracao manual no GitHub

Abra [Settings > Rules > Rulesets](https://github.com/LucasNPADev/projetoFinal_Lume/settings/rules)
com sua conta administradora. Crie um ruleset ativo para `main`
e outro para `develop`:

1. Exigir pull request e impedir pushes diretos.
2. Exigir revisao/aprovacao de outra pessoa, se houver colegas
   revisores; caso seja trabalho individual, ajuste o numero
   conscientemente para nao criar bloqueio impossivel.
3. Exigir resolucao de conversas, bloquear force push e exclusao.
4. Exigir o status check **Politica Git Flow** do workflow **CI**.
5. Aplicar regras tambem aos administradores quando possivel.

Cuidado: o job `backend` roda apenas quando ha alteracoes em
`backend/**`; nao o marque como status obrigatorio em TODOS os PRs,
pois PR apenas de documentacao ficaria bloqueado. Ele pode ser exigido
em revisoes de backend ou tornar-se check sempre executado no futuro.

**Sem Rulesets ativos, um push direto continua possivel** mesmo
com o workflow de validacao dos PRs. Git Flow e uma convencao;
as protecoes sao configuradas no servidor do GitHub, nao nos arquivos.

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
`main` como production e `develop` como development.
