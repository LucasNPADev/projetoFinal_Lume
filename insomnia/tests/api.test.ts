import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../backend/src/app';

test('GET /health responde status ok', async () => {
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

test('GET /cursos rejeita acesso sem Bearer', async () => {
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('servidor sem porta');
    const response = await fetch(`http://127.0.0.1:${address.port}/cursos`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});
