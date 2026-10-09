export function paginar<T>(data: T[], page: number, limit: number) {
  return {
    data: data.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: data.length,
    totalPages: Math.ceil(data.length / limit),
  };
}
