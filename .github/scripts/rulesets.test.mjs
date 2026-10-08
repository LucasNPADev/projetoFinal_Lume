import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const branch of ["main", "dev"]) {
  const json = JSON.parse(readFileSync(new URL("../rulesets/" + branch + ".json", import.meta.url), "utf8"));
  test("Ruleset " + branch + " ativo e sem bypass", () => {
    assert.equal(json.enforcement, "active");
    assert.equal(json.target, "branch");
    assert.deepEqual(json.bypass_actors, []);
    assert.deepEqual(json.conditions.ref_name.include, ["refs/heads/" + branch]);
    const types = new Map(json.rules.map(rule => [rule.type, rule]));
    for (const key of ["pull_request", "deletion", "non_fast_forward", "required_status_checks"]) {
      assert.ok(types.has(key), "Regra faltante: " + key);
    }
    assert.equal(types.get("pull_request").parameters.required_review_thread_resolution, true);
    assert.equal(types.get("required_status_checks").parameters.strict_required_status_checks_policy, true);
    const status = types.get("required_status_checks").parameters.required_status_checks.map(x => x.context).sort();
    assert.deepEqual(status, ["Backend CI", "Politica Git Flow"]);
  });
}
