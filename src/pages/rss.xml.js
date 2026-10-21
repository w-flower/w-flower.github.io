import { getCollection } from "astro:content";
import { site } from "../site.config";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const base = (site.url || "https://example.com").replace(/\/$/, "");

  const posts = (await getCollection("posts")).filter((p) => !p.data.draft);
  const notes = (await getCollection("notes")).filter((n) => !n.data.draft);

  const items = [
    ...posts.map((p) => ({
      title: p.data.title,
      desc: p.data.summary,
      date: p.data.date,
      link: `${base}/posts/${p.id}/`,
    })),
    ...notes.map((n) => ({
      title: n.data.title,
      desc: `${n.data.course} · ${n.data.status}`,
      date: n.data.date,
      link: `${base}/notes/${n.id}/`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${esc(base)}</link>
    <description>${esc(site.description)}</description>
    <language>${esc(site.lang)}</language>
${items
  .map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid>${esc(i.link)}</guid>
      <description>${esc(i.desc)}</description>
      <pubDate>${i.date.toUTCString()}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
