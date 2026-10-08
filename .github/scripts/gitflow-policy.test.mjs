import assert from "node:assert/strict";
import test from "node:test";
import { validarGitFlow } from "./gitflow-policy.mjs";
for (const [origem, destino] of [
  ["feature/autenticacao", "develop"], ["feature/sprint-3-backend", "develop"],
  ["bugfix/quiz", "develop"], ["docs/der", "develop"],
  ["ci/pipeline", "develop"], ["chore/deps", "develop"],
  ["refactor/catalogo", "develop"], ["test/integracao", "develop"],
  ["release/1.0.0", "main"], ["release/1.0.0", "develop"],
  ["release/1.2.3-rc.1", "main"], ["hotfix/1.0.1", "main"],
  ["hotfix/1.0.1", "develop"], ["main", "develop"]
]) test("aceita " + origem + " -> " + destino, () =>
  assert.equal(validarGitFlow(origem, destino).ok, true));
for (const [origem, destino] of [
  ["feature/autenticacao", "main"], ["bugfix/quiz", "main"],
  ["develop", "main"], ["feature/Token", "develop"],
  ["feature/a/b", "develop"], ["release/semver", "main"],
  ["hotfix/versao-1", "main"], ["hotfix/1.0.1", "qualquer"],
  ["main", "main"], ["master", "develop"], ["feature/", "develop"], ["", "develop"]
]) test("rejeita " + origem + " -> " + destino, () =>
  assert.equal(validarGitFlow(origem, destino).ok, false));
