// Os IDs do banco são BIGINT (BigInt no JS), e JSON.stringify não sabe serializar BigInt.
// Este patch faz todo BigInt virar string nas respostas da API.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export {};
