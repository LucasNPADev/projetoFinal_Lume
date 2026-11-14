export const GRANDE_ABC = [
  "São Bernardo do Campo",
  "Santo André",
  "São Caetano do Sul",
  "Diadema",
  "Mauá",
  "Ribeirão Pires",
  "Rio Grande da Serra",
];
export function normalizar(v?: string | null): string {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
export function distanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = (n: number) => (n * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return (
    Math.round(
      6371 *
        2 *
        Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a))) *
        100,
    ) / 100
  );
}
export function ordemRegiao(
  cidade: string | null | undefined,
  referencia: string | null | undefined,
) {
  if (normalizar(cidade) === normalizar(referencia)) return 0;
  if (
    GRANDE_ABC.some((c) => normalizar(c) === normalizar(cidade)) &&
    GRANDE_ABC.some((c) => normalizar(c) === normalizar(referencia))
  )
    return 1;
  return 2;
}
