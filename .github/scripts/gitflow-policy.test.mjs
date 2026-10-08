import assert from "node:assert/strict";
import test from "node:test";
import { validarGitFlow } from "./gitflow-policy.mjs";
for (const [origem, destino] of [
  ["feature/autenticacao", "dev"], ["feature/sprint-3-backend", "dev"],
  ["bugfix/quiz", "dev"], ["docs/der", "dev"],
  ["ci/pipeline", "dev"], ["chore/deps", "dev"],
  ["refactor/catalogo", "dev"], ["test/integracao", "dev"],
  ["release/1.0.0", "main"], ["release/1.0.0", "dev"],
  ["release/1.2.3-rc.1", "main"], ["hotfix/1.0.1", "main"],
  ["hotfix/1.0.1", "dev"], ["main", "dev"]
]) test("aceita " + origem + " -> " + destino, () =>
  assert.equal(validarGitFlow(origem, destino).ok, true));
for (const [origem, destino] of [
  ["feature/autenticacao", "main"], ["bugfix/quiz", "main"],
  ["dev", "main"], ["feature/Token", "dev"],
  ["feature/a/b", "dev"], ["release/semver", "main"],
  ["hotfix/versao-1", "main"], ["hotfix/1.0.1", "qualquer"],
  ["main", "main"], ["master", "dev"], ["feature/", "dev"], ["", "dev"]
]) test("rejeita " + origem + " -> " + destino, () =>
  assert.equal(validarGitFlow(origem, destino).ok, false));
