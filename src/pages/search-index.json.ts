/**
 * 全站全文索引 /search-index.json
 * ------------------------------------------------------------
 * 为什么单独出一个 JSON，而不是把正文塞进每张卡片的 data-q：
 *   - /notes/ 有 15 张卡，每篇正文 4000–8000 字。全塞进 HTML 就是
 *     每页多背 100KB，而且只能塞得下前 4000 字（截断之后一律搜不到，
 *     用户搜「罗尔」「开覆盖」永远 0 条 —— 这就是「搜索形同虚设」的根因）。
 *   - 单独出文件后，浏览器只在第一次搜索时拉一次，之后命中整篇。
 *
 * 字段尽量短（这个文件会被下载）：
 *   u  URL   t  标题   k  类型   g  标签串   s  摘要   b  正文纯文本
 * 顺序 = 日期倒序，命令面板空输入那一屏直接取前 8 条当「最近写的」。
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { isPublished } from "../lib/format";
import { plainText } from "../lib/plaintext";

const bodyOf = (e: unknown) => plainText((e as { body?: string }).body ?? "");

interface Doc {
  u: string;
  t: string;
  k: string;
  g: string;
  s: string;
  b: string;
}
interface Dated {
  at: number;
  doc: Doc;
}

export const GET: APIRoute = async () => {
  const bag: Dated[] = [];

  for (const n of await getCollection("notes")) {
    if (!isPublished(n.data)) continue;
    bag.push({
      at: +n.data.date,
      doc: {
        u: `/notes/${n.id}/`,
        t: n.data.title,
        k: "notes",
        g: [n.data.course, ...(n.data.tags ?? [])].join(" "),
        s: n.data.summary ?? "",
        b: bodyOf(n),
      },
    });
  }
  for (const p of await getCollection("posts")) {
    if (!isPublished(p.data)) continue;
    bag.push({
      at: +p.data.date,
      doc: {
        u: `/posts/${p.id}/`,
        t: p.data.title,
        k: "posts",
        g: (p.data.tags ?? []).join(" "),
        s: p.data.summary ?? "",
        b: bodyOf(p),
      },
    });
  }
  for (const sn of await getCollection("snippets")) {
    if (!isPublished(sn.data)) continue;
    bag.push({
      at: +sn.data.date,
      doc: {
        u: `/snippets/${sn.id}/`,
        t: sn.data.title,
        k: "snippets",
        g: [sn.data.std, ...(sn.data.tags ?? [])].join(" "),
        s: "",
        b: bodyOf(sn),
      },
    });
  }
  for (const m of await getCollection("micro")) {
    if (!isPublished(m.data)) continue;
    const b = bodyOf(m);
    bag.push({
      at: +m.data.date,
      doc: {
        u: "/micro/",
        t: b.slice(0, 30) || "随笔",
        k: "micro",
        g: m.data.mood ?? "",
        s: "",
        b,
      },
    });
  }

  bag.sort((a, b) => b.at - a.at);
  const body = JSON.stringify({ docs: bag.map((x) => x.doc) });

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
};
