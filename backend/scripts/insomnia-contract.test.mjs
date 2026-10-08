import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const insomnia = JSON.parse(read("insomnia.collection.json"));
const requests = insomnia.resources.filter((r) => r._type === "request");
const normalized = (s) => s.replace(/\/$/, "") || "/";
const names = new Set(requests.map((r) => r.name));

function rotasDeclaradas() {
  const mounted = read("src/routes/routes.ts");
  const rxMount = /\{\s*prefixo:\s*"([^"]+)",\s*router:\s*(\w+)Routes\s*\}/g;
  const mounts = [...mounted.matchAll(rxMount)];
  assert.equal(mounts.length, 10, "Esperados dez modulos montados em routes.ts");
  const resultado = new Set();
  function scan(nomeModulo, prefixo) {
    const arquivo = read("src/routes/" + nomeModulo + ".routes.ts");
    const regex = new RegExp("\\b" + nomeModulo + "Routes\\.(get|post|put|patch|delete)\\(\\s*[\"']([^\"']+)[\"']", "g");
    for (const match of arquivo.matchAll(regex)) {
      const rota = normalized(prefixo + (match[2] === "/" ? "" : match[2]));
      resultado.add(match[1].toUpperCase() + " " + rota);
    }
    // Routers aninhados: favoritos e notificacoes sob /usuarios/me.
    if (nomeModulo === "usuario") {
      const nested = /usuarioRoutes\.use\(\s*"([^"]+)"\s*,\s*(\w+)Routes\s*\)/g;
      for (const match of arquivo.matchAll(nested)) {
        scan(match[2], prefixo + match[1]);
      }
    }
  }
  for (const match of mounts) scan(match[2], match[1]);
  resultado.add("GET /api/health");
  resultado.add("GET /api/ready");
  return resultado;
}

test("Insomnia export format v4 e workspace valido", () => {
  assert.equal(insomnia._type, "export");
  assert.equal(insomnia.__export_format, 4);
  assert.equal(insomnia.resources.filter((r) => r._type === "workspace").length, 1);
  assert.ok(insomnia.resources.some((r) => r._type === "environment" && r.data.base_url === "http://localhost:3333/api"));
});

test("todos os endpoints Express possuem requisicao no Insomnia", () => {
  const expected = rotasDeclaradas();
  assert.ok(expected.size >= 60, "Poucos endpoints encontrados: checar scanner");
  for (const route of expected) {
    assert.ok(names.has(route), "Rota ausente no Insomnia: " + route);
  }
  assert.equal(new Set(requests.map((r) => r.name)).size, requests.length, "Requisicoes duplicadas");
  assert.equal(expected.size, requests.length, "Colecao possui rota que nao existe na API");
});

test("JSON de corpo e URL Insomnia validos", () => {
  const ids = new Set();
  for (const r of insomnia.resources) {
    assert.ok(r._id && !ids.has(r._id), "ID Insomnia ausente/duplicado: " + r._id);
    ids.add(r._id);
  }
  for (const r of requests) {
    assert.ok(r.url.startsWith("{{ _.base_url }}/"), "URL deve usar base_url: " + r.name);
    assert.ok(["GET","POST","PUT","PATCH","DELETE"].includes(r.method), "Metodo invalido");
    if (r.body?.text) assert.doesNotThrow(() => JSON.parse(r.body.text), "Body nao e JSON valido: " + r.name);
    if (r.name.startsWith("POST /api/admin") && !r.name.endsWith("/login")) assert.equal(r.authentication?.type, "bearer");
    if (r.name.startsWith("GET /api/admin")) assert.equal(r.authentication?.type, "bearer");
    if (r.name.startsWith("PATCH /api/admin")) assert.equal(r.authentication?.type, "bearer");
  }
});

test("Amostras obrigatorias estao presentes", () => {
  for (const required of [
    "POST /api/auth/cadastro", "POST /api/auth/login", "GET /api/quiz/perguntas",
    "POST /api/quiz/resultado", "GET /api/usuarios/me",
    "GET /api/comparacoes/ofertas", "GET /api/eventos",
    "GET /api/admin/resumo", "POST /api/admin/ofertas",
  ]) assert.ok(names.has(required), required);
});
