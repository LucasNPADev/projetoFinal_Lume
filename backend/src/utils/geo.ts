import { z } from "zod";
import { ApiError } from "../middlewares/errors";

export const coordenadasSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90).optional(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional(),
  raioKm: z.coerce.number().finite().min(1).max(250).default(50)
}).passthrough();

export function extrairLocalizacao(query: unknown) {
  const { latitude, longitude, raioKm } = coordenadasSchema.parse(query);
  if ((latitude === undefined) !== (longitude === undefined)) throw new ApiError(400, "Latitude e longitude devem ser informadas juntas.");
  return latitude === undefined || longitude === undefined ? null : { latitude, longitude, raioKm };
}
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (x: number) => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function caixaGeografica(latitude: number, longitude: number, raioKm: number) {
  const deltaLat = raioKm / 110.574;
  const deltaLon = Math.min(180, raioKm / (111.320 * Math.max(0.01, Math.cos(latitude * Math.PI / 180))));
  return {
    latitude: { gte: Math.max(-90, latitude - deltaLat), lte: Math.min(90, latitude + deltaLat) },
    longitude: longitude - deltaLon >= -180 && longitude + deltaLon <= 180
      ? { gte: longitude - deltaLon, lte: longitude + deltaLon }
      : undefined
  };
}
