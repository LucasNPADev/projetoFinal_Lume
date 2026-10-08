import assert from "node:assert/strict";
import test from "node:test";
import { distanciaKm, extrairLocalizacao } from "../src/utils/geo";

test("distancia mesma coordenada e zero", () => assert.equal(distanciaKm(-23.7, -46.56, -23.7, -46.56), 0));
test("distancia S Bernardo a Santo Andre e positiva", () => {
  const d = distanciaKm(-23.6914, -46.5646, -23.6639, -46.5383);
  assert.ok(d > 0 && d < 20);
});
test("coordenada exige latitude e longitude", () => assert.throws(() => extrairLocalizacao({ latitude: "-23.7" })));
test("filtragem rejeita raio excessivo", () => assert.throws(() => extrairLocalizacao({ latitude: -23.7, longitude: -46.5, raioKm: 1000 })));
