/**
 * 搜索的客户端侧：拉一次 /search-index.json，之后在内存里做子串匹配。
 *
 * 为什么不用 Pagefind：
 *   查过资料 —— Pagefind 建索引和查查询用的是两套中文分词策略
 *   （建索引走 Rust 侧 n-gram，查询 v1.5+ 走浏览器的 Intl.Segmenter），
 *   中文连续词经常对不上，社区普遍要额外拿 Intl.Segmenter 再处理一遍
 *   查询词才能用。我的内容只有十几篇、全是中文短词，直接子串匹配
 *   反而更准、更简单，还零依赖零构建步骤。
 *
 * 代价：索引要一次全下（现在约 60–80KB，gzip 后 20KB 上下）。
 * 内容涨到几百篇时再换 Pagefind，判断标准写在 MEMORY 里。
 */

export interface IndexDoc {
  /** 文章 URL */
  u: string;
  /** 标题 */
  t: string;
  /** 类型：notes / posts / snippets / micro */
  k: string;
  /** 标签 + 课程 */
  g: string;
  /** 摘要 */
  s: string;
  /** 正文纯文本 */
  b: string;
}

let cache: Promise<IndexDoc[]> | null = null;

/** 小写化后的可搜索串，算一次存在 WeakMap 里，别每次按键都重算 8KB */
const hayCache = new WeakMap<IndexDoc, string>();
export function hay(d: IndexDoc): string {
  let h = hayCache.get(d);
  if (h === undefined) {
    h = `${d.t} ${d.g} ${d.s} ${d.b}`.toLowerCase();
    hayCache.set(d, h);
  }
  return h;
}

/** 多关键词 AND：空格分词，全部命中才算命中 */
export function hits(d: IndexDoc, terms: string[]): boolean {
  const h = hay(d);
  for (const t of terms) if (!h.includes(t)) return false;
  return true;
}

export interface Hit {
  pre: string;
  hit: string;
  post: string;
}

/**
 * 在正文里找第一处命中，切出上下文。
 * 标题里命中就不切正文了（标题本身就是最好的上下文）。
 */
export function snippet(d: IndexDoc, term: string, radius = 34): Hit | null {
  if (!term) return null;
  const at = d.b.toLowerCase().indexOf(term);
  if (at === -1) return null;
  const start = Math.max(0, at - radius);
  const end = Math.min(d.b.length, at + term.length + radius);
  return {
    pre: (start > 0 ? "…" : "") + d.b.slice(start, at),
    hit: d.b.slice(at, at + term.length),
    post: d.b.slice(at + term.length, end) + (end < d.b.length ? "…" : ""),
  };
}

/** 拉索引。失败就返回空数组，不要抛 —— 搜索坏了不该让整页挂掉。 */
export function loadIndex(): Promise<IndexDoc[]> {
  if (!cache) {
    const base = import.meta.env.BASE_URL || "/";
    const url = (base.endsWith("/") ? base : base + "/") + "search-index.json";
    cache = fetch(url)
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((j: { docs?: IndexDoc[] }) => j.docs ?? [])
      .catch(() => [] as IndexDoc[]);
  }
  return cache;
}

/** 按 URL 建表，卡片/节点靠 href 对上全文 */
export function byUrl(docs: IndexDoc[]): Map<string, IndexDoc> {
  const m = new Map<string, IndexDoc>();
  for (const d of docs) m.set(d.u, d);
  return m;
}
