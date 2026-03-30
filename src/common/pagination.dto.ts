export function paginate(page: any = 1, limit: any = 20) {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  return { skip: (p - 1) * l, take: l };
}
