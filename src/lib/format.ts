export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function byDateDesc<T extends { data: { date: Date } }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
}

export function isPublished(data: { draft?: boolean }): boolean {
  return data.draft !== true;
}
