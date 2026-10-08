# Aplica os rulesets de main e dev com a conta GitHub autorizada.
# Precisa do GitHub CLI e permissionamento "Administration: write".
$ErrorActionPreference = "Stop"
$repo = "LucasNPADev/projetoFinal_Lume"
$root = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) nao esta instalado. Instale e rode gh auth login."
}
& gh auth status --hostname github.com
if ($LASTEXITCODE -ne 0) { throw "Faca gh auth login antes de executar este script." }

$raw = & gh api "repos/$repo/rulesets"
if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel consultar os rulesets. Verifique credenciais e permissoes." }

$existing = @($raw | ConvertFrom-Json)
foreach ($branch in @("main", "dev")) {
  $path = Join-Path $root ".github/rulesets/$branch.json"
  $payload = Get-Content -Raw -Encoding UTF8 $path | ConvertFrom-Json
  if ($payload.enforcement -ne "active" -or
      $payload.conditions.ref_name.include.Count -ne 1 -or
      $payload.conditions.ref_name.include[0] -ne "refs/heads/$branch") {
    throw "Ruleset $branch nao esta ativo ou nao corresponde a branch pretendida."
  }
  $existingRule = @($existing | Where-Object { $_.name -eq $payload.name })
  if ($existingRule.Count -gt 1) { throw "Rulesets duplicados com nome $($payload.name); revise antes." }
  if ($existingRule.Count -eq 1) {
    Write-Host "Atualizando ruleset $branch (id $($existingRule[0].id))..."
    & gh api --method PUT "repos/$repo/rulesets/$($existingRule[0].id)" --input $path | Out-Null
  } else {
    Write-Host "Criando ruleset $branch..."
    & gh api --method POST "repos/$repo/rulesets" --input $path | Out-Null
  }
  if ($LASTEXITCODE -ne 0) { throw "Falha ao ativar ruleset $branch. Revise suas permissoes." }
}
$afterRaw = & gh api "repos/$repo/rulesets"
if ($LASTEXITCODE -ne 0) { throw "Erro ao verificar rulesets aplicados." }
$after = @($afterRaw | ConvertFrom-Json)
foreach ($branch in @("main","dev")) {
  $name = "LUME | $branch | protecao obrigatoria"
  $rule = @($after | Where-Object { $_.name -eq $name -and $_.enforcement -eq "active" })
  if ($rule.Count -ne 1) { throw "Ruleset $name nao confirmado como ativo." }
  Write-Host "CONFIRMADO: $name (id $($rule[0].id))"
}
Write-Host "Rulesets da main e dev ativados. Nao crie bypass sem revisao."
