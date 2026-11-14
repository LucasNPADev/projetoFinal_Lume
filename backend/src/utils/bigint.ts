// IDs BIGINT são serializados como string para preservar precisão no front-end.
Object.defineProperty(BigInt.prototype, "toJSON", {
  value: function (this: bigint) {
    return this.toString();
  },
  configurable: true,
});
export {};
