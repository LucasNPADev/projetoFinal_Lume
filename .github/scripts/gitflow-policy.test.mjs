import assert from "node:assert/strict";
import test from "node:test";
import { validarGitFlow } from "./gitflow-policy.mjs";

const aceitos = [
  ["feature/autenticacao-jwt", "dev"],
  ["feature/favoritar-curso", "dev"],
  ["feature/sprint-3-backend", "dev"],
  ["bugfix/ajuste-quiz", "dev"],
  ["docs/der", "dev"],
  ["ci/pipeline", "dev"],
  ["chore/deps", "dev"],
  ["refactor/catalogo", "dev"],
  ["test/integracao", "dev"],
  ["release/1.0.0", "main"],
  ["release/v1.0.0", "main"],
  ["release/v1.0.0", "dev"],
  ["release/1.2.3-rc.1", "main"],
  ["release/v1.2.3-rc.1", "dev"],
  ["hotfix/erro-login-prod", "main"],
  ["hotfix/erro-login-prod", "dev"],
  ["hotfix/1.0.1", "main"],
  ["hotfix/v1.0.1", "dev"],
  ["main", "dev"],
];
for (const [origem, destino] of aceitos) {
  test("aceita " + origem + " -> " + destino, () => {
    assert.equal(validarGitFlow(origem, destino).ok, true);
  });
}

const rejeitados = [
  ["feature/autenticacao-jwt", "main"],
  ["bugfix/quiz", "main"],
  ["dev", "main"],
  ["feature/Token", "dev"],
  ["feature/a/b", "dev"],
  ["release/versao-pronta", "main"],
  ["release/v1.0", "main"],
  ["release/v01.2.3", "main"],
  ["hotfix/Erro-Login", "main"],
  ["hotfix/1.0.1", "qualquer"],
  ["main", "main"],
  ["develop", "dev"],
  ["feature/", "dev"],
  ["", "dev"],
];
for (const [origem, destino] of rejeitados) {
  test("rejeita " + origem + " -> " + destino, () => {
    assert.equal(validarGitFlow(origem, destino).ok, false);
  });
}
