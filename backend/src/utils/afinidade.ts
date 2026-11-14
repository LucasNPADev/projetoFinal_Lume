import { normalizar } from "./geo";

export interface AreaAfinidade {
  area: string;
  percentual: number;
}

const equivalenciasArea: Record<string, string> = {
  "ciencias juridicas humanas": "direito",
  direito: "direito",
  "comunicacao e artes": "comunicacao",
  comunicacao: "comunicacao",
  "negocios e gestao": "negocios",
  negocios: "negocios",
};

export function normalizarAreaAfinidade(area?: string | null): string {
  const normalizada = normalizar(area)
    .replace(/&/g, " e ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  return equivalenciasArea[normalizada] ?? normalizada;
}

export function buscarAfinidadeArea(
  areas: AreaAfinidade[],
  area: string,
): number | null {
  const chave = normalizarAreaAfinidade(area);
  const correspondentes = areas.filter(
    (item) => normalizarAreaAfinidade(item.area) === chave,
  );
  if (correspondentes.length === 0) return null;
  return correspondentes.reduce((total, item) => total + item.percentual, 0);
}
