import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import app from "../src/app";
import { prisma } from "../src/config/prisma";

test("API real: cadastro, login, isolamento de perfil, quiz e avaliacao moderada", { skip: process.env.RUN_INTEGRATION_TESTS !== "1" }, async () => {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  const base = "http://127.0.0.1:" + port + "/api";
  const email1 = "teste-" + Date.now() + "-a@lume.local";
  const email2 = "teste-" + Date.now() + "-b@lume.local";
  async function request(method: string, path: string, body?: unknown, token?: string) {
    const response = await fetch(base + path, { method, headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: "Bearer " + token } : {})
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data, setCookie: response.headers.get("set-cookie") };
  }
  let user1 = 0, user2 = 0;
  try {
    const wrong = await request("GET", "/usuarios/1");
    assert.equal(wrong.status, 401);
    const c1 = await request("POST", "/auth/cadastro", { nomeCompleto: "Usuario Teste Um", email: email1, senha: "senha-super-forte-001" });
    assert.equal(c1.status, 201, JSON.stringify(c1.data));
    user1 = c1.data.usuario.id;
    const c2 = await request("POST", "/auth/cadastro", { nomeCompleto: "Usuario Teste Dois", email: email2, senha: "senha-super-forte-002" });
    assert.equal(c2.status, 201, JSON.stringify(c2.data));
    user2 = c2.data.usuario.id;
    const token = c1.data.token;
    assert.ok(c1.setCookie?.includes("HttpOnly"), "Refresh cookie HttpOnly ausente");
    const refresh = await fetch(base + "/auth/refresh", {
      method: "POST", headers: { Cookie: c1.setCookie!.split(";")[0] }
    });
    assert.equal(refresh.status, 200);
    const rotated = await refresh.json();
    assert.ok(rotated.token);
    assert.equal((await request("GET", "/auth/me", undefined, rotated.token)).status, 200);
    assert.equal((await request("GET", "/usuarios/" + user2, undefined, token)).status, 403);
    assert.equal((await request("GET", "/usuarios/me", undefined, token)).status, 200);
    assert.equal((await request("PUT", "/usuarios/" + user2, { nomeCompleto: "Invasao" }, token)).status, 403);
    assert.equal((await request("GET", "/quiz/historico")).status, 401);
    const perguntas = await request("GET", "/quiz/perguntas");
    assert.equal(perguntas.status, 200);
    assert.ok(perguntas.data.length >= 2);
    const respostas = perguntas.data.map((q: { id: number }) => ({ perguntaId: q.id, opcaoIndex: 0 }));
    const resultado = await request("POST", "/quiz/resultado", { respostas }, token);
    assert.equal(resultado.status, 201, JSON.stringify(resultado.data));
    assert.ok(resultado.data.historico?.id);
    assert.equal((await request("GET", "/quiz/historico", undefined, token)).status, 200);
    const instituicoes = await request("GET", "/instituicoes");
    assert.ok(instituicoes.data.length > 0);
    const review = await request("PUT", "/avaliacoes/instituicao/" + instituicoes.data[0].id, { nota: 5, comentario: "Ambiente de teste" }, token);
    assert.equal(review.status, 200, JSON.stringify(review.data));
    assert.equal(review.data.status, "PENDENTE");
    assert.equal((await request("GET", "/avaliacoes/instituicao/" + instituicoes.data[0].id)).data.some((x: {id: number}) => x.id === review.data.id), false);
    assert.equal((await request("POST", "/auth/logout", undefined, rotated.token)).status, 204);
    assert.equal((await request("GET", "/auth/me", undefined, rotated.token)).status, 401);
    assert.equal((await request("POST", "/auth/refresh", undefined, c1.data.token)).status, 401);
  } finally {
    if (user1) await prisma.usuario.deleteMany({ where: { id: user1 } });
    if (user2) await prisma.usuario.deleteMany({ where: { id: user2 } });
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    await prisma.$disconnect();
  }
});
