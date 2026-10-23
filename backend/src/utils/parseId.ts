import { AppError } from './AppError';

export function parseId(raw: string | undefined, nome = 'id'): bigint {
  if (!raw || !/^\d+$/.test(raw)) {
    throw new AppError(`Parâmetro "${nome}" inválido`, 400);
  }
  return BigInt(raw);
}
