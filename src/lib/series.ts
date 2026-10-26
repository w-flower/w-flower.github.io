/**
 * 笔记的「连载顺序」。
 *
 * 这 15 篇是同一门课的一条线：01 → 02 → … → 13 → 附录 A → 附录 B。
 * 顺序不写在 frontmatter 里，而是从标题前缀读出来 —— 标题本来就这么写了，
 * 再维护一份 order 字段迟早会和标题对不上。
 *
 * 返回 { n, ord }：
 *   n   = 显示用的短标号（"01" / "A"）
 *   ord = 排序用的数值（附录排在 13 后面）
 */

export interface SeriesUnit {
  n: string;
  ord: number;
}

export function seriesOrd(title: string): SeriesUnit {
  const num = title.match(/^\s*(\d{1,3})/);
  if (num) {
    const v = Number(num[1]);
    return { n: String(v).padStart(2, "0"), ord: v };
  }
  const ap = title.match(/^\s*附录\s*([A-Za-z0-9]+)/);
  if (ap) {
    const k = ap[1].toUpperCase();
    const base = k.charCodeAt(0);
    /* A → 1001, B → 1002，永远排在正文之后 */
    const ord = base >= 65 && base <= 90 ? 1000 + (base - 64) : 1900;
    return { n: k, ord };
  }
  return { n: "·", ord: 9000 };
}

export interface SeriesLink {
  n: string;
  ord: number;
  title: string;
  href: string;
  id: string;
}

/** 把集合里的笔记排成一条连载线 */
export function toSeries(
  notes: { id: string; data: { title: string } }[]
): SeriesLink[] {
  return notes
    .map((x) => {
      const { n, ord } = seriesOrd(x.data.title);
      return {
        n,
        ord,
        title: x.data.title,
        href: `/notes/${x.id}/`,
        id: x.id,
      };
    })
    .sort((a, b) => a.ord - b.ord || a.title.localeCompare(b.title));
}
