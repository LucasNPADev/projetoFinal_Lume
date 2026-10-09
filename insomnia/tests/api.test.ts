import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../backend/src/app';

test('GET /health verifica a infraestrutura (nao faz parte das 7 APIs do Insomnia)', async () => {
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('servidor sem porta');
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    server.close();
  }
});

const testCases = [
  // Rotas publicas: payload invalido deve ser rejeitado sem consultar o banco.
  { method: 'POST', path: '/usuarios', expected: 400, body: {} },
  { method: 'POST', path: '/session', expected: 400, body: {} },
  // Rotas protegidas: devem rejeitar acesso sem JWT.
  { method: 'GET', path: '/cursos', expected: 401 },
  { method: 'GET', path: '/cursos/1', expected: 401 },
  { method: 'POST', path: '/cursos', expected: 401, body: {} },
  { method: 'POST', path: '/instituicoes', expected: 401, body: {} },
  { method: 'POST', path: '/instituicoes/1/cursos', expected: 401, body: {} },
] as const;

test('As 7 APIs possuem protecao ou validacao inicial', async (t) => {
  assert.equal(testCases.length, 7);
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('servidor sem porta');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    for (const scenario of testCases) {
      await t.test(`${scenario.method} ${scenario.path} retorna ${scenario.expected}`, async () => {
        const response = await fetch(baseUrl + scenario.path, {
          method: scenario.method,
          headers: { 'Content-Type': 'application/json' },
          ...('body' in scenario ? { body: JSON.stringify(scenario.body) } : {}),
        });
        assert.equal(response.status, scenario.expected);
      });
    }
  } finally {
    server.close();
  }
});
