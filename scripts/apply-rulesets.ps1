# GitFlow LUME: por padrao somente VERIFICA os rulesets, sem alteracoes.
# -Apply reaplica os JSON versionados com permissao Administration: write.
param([switch]$Apply)
$ErrorActionPreference = "Stop"
$repo = "LucasNPADev/projetoFinal_Lume"
$root = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) nao encontrado. Instale e autentique com gh auth login."
}
& gh auth status --hostname github.com
if ($LASTEXITCODE -ne 0) { throw "Faca gh auth login com acesso ao repositorio." }

$raw = & gh api "repos/$repo/rulesets"
if ($LASTEXITCODE -ne 0) { throw "Falha ao consultar os rulesets." }
$existing = @($raw | ConvertFrom-Json)

foreach ($branch in @("main", "dev")) {
  $path = Join-Path $root ".github/rulesets/$branch.json"
  $payload = Get-Content -Raw -Encoding UTF8 $path | ConvertFrom-Json
  if ($payload.enforcement -ne "active" -or
      $payload.conditions.ref_name.include.Count -ne 1 -or
      $payload.conditions.ref_name.include[0] -ne "refs/heads/$branch" -or
      $payload.bypass_actors.Count -ne 0) {
    throw "Ruleset $branch com configuracao insegura ou branch-alvo incorreta."
  }
  $matches = @($existing | Where-Object { $_.name -eq $payload.name })
  if ($matches.Count -gt 1) { throw "Rulesets duplicados: $($payload.name)" }
  if ($Apply) {
    if ($matches.Count -eq 1) {
      Write-Host "Atualizando $branch a partir do JSON versionado..."
      & gh api --method PUT "repos/$repo/rulesets/$($matches[0].id)" --input $path | Out-Null
    } else {
      Write-Host "Criando o ruleset $branch..."
      & gh api --method POST "repos/$repo/rulesets" --input $path | Out-Null
    }
    if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel aplicar o ruleset $branch." }
  } elseif ($matches.Count -eq 0) {
    throw "Ruleset $branch nao existe. Use -Apply SOMENTE se quiser cria-lo."
  }
}

# A verificacao final consulta as regras reais, e nao apenas o arquivo em Git.
foreach ($branch in @("main", "dev")) {
  $listRaw = & gh api "repos/$repo/rulesets"
  if ($LASTEXITCODE -ne 0) { throw "Falha ao verificar lista de rulesets." }
  $list = @($listRaw | ConvertFrom-Json)
  $rule = @($list | Where-Object { $_.name -eq "LUME | $branch | protecao obrigatoria" -and $_.enforcement -eq "active" })
  if ($rule.Count -ne 1) { throw "Ruleset $branch nao esta ativo." }
  $detailsRaw = & gh api "repos/$repo/rulesets/$($rule[0].id)"
  if ($LASTEXITCODE -ne 0) { throw "Falha ao ler configuracao de $branch." }
  $details = $detailsRaw | ConvertFrom-Json
  if ($details.conditions.ref_name.include.Count -ne 1 -or
      $details.conditions.ref_name.include[0] -ne "refs/heads/$branch" -or
      $details.bypass_actors.Count -ne 0) { throw "Ruleset $branch nao protege a ref correta ou tem bypass." }
  $types = @($details.rules | ForEach-Object { $_.type })
  foreach ($type in @("deletion","non_fast_forward","pull_request","required_status_checks")) {
    if ($types -notcontains $type) { throw "Ruleset $branch sem regra obrigatoria: $type" }
  }
  $checks = @($details.rules | Where-Object { $_.type -eq "required_status_checks" } |
    ForEach-Object { $_.parameters.required_status_checks } | ForEach-Object { $_.context })
  foreach ($needed in @("Politica Git Flow","Backend CI")) {
    if ($checks -notcontains $needed) { throw "Ruleset $branch sem check obrigatorio: $needed" }
  }
  Write-Host "OK: ruleset ativo e verificado para $branch (id $($rule[0].id))"
}
if (-not $Apply) { Write-Host "Modo consulta: nenhum ruleset foi alterado. Use -Apply apenas conscientemente." }
