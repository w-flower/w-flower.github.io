/**
 * 相关条目计算
 * ------------------------------------------------------------
 * 复用知识库那套"桥梁"思路：
 *   - 笔记之间靠 course 关联（同课程按标题＝章节顺序排，给出上一节/下一节）
 *   - 文章 / 代码之间靠 tags 关联
 *   - 跨内容的共标签也会连上
 * 取共享标签最多的前 N 篇；同课程笔记里再按章节顺序排，让"相关"是真相关，
 * 而不是随便几篇最近的。
 */
import { getCollection } from "astro:content";
import { isPublished } from "./format";

export interface RelatedItem {
  href: string;
  title: string;
  kind: "notes" | "posts" | "snippets";
  color: string;
}

const KIND_COLOR: Record<RelatedItem["kind"], string> = {
  notes: "#5DCAA5",
  posts: "#378ADD",
  snippets: "#EF9F27",
};

type Flat = {
  kind: RelatedItem["kind"];
  id: string;
  href: string;
  title: string;
  course: string;
  tags: string[];
  date: Date;
};

export async function getRelated(opts: {
  kind: RelatedItem["kind"];
  id: string;
  course?: string;
  tags?: string[];
  limit?: number;
}): Promise<RelatedItem[]> {
  const limit = opts.limit ?? 3;
  const tags = opts.tags ?? (opts.course ? [opts.course] : []);

  const [notes, posts, snippets] = await Promise.all([
    getCollection("notes"),
    getCollection("posts"),
    getCollection("snippets"),
  ]);

  const all: Flat[] = [
    ...notes
      .filter((e) => isPublished(e.data))
      .map((e) => ({
        kind: "notes" as const,
        id: e.id,
        href: `/notes/${e.id}/`,
        title: e.data.title,
        course: e.data.course,
        tags: [e.data.course],
        date: e.data.date,
      })),
    ...posts
      .filter((e) => isPublished(e.data))
      .map((e) => ({
        kind: "posts" as const,
        id: e.id,
        href: `/posts/${e.id}/`,
        title: e.data.title,
        course: "",
        tags: e.data.tags,
        date: e.data.date,
      })),
    ...snippets
      .filter((e) => isPublished(e.data))
      .map((e) => ({
        kind: "snippets" as const,
        id: e.id,
        href: `/snippets/${e.id}/`,
        title: e.data.title,
        course: "",
        tags: e.data.tags,
        date: e.data.date,
      })),
  ];

  const scored = all
    .filter((e) => !(e.kind === opts.kind && e.id === opts.id))
    .map((e) => ({
      ...e,
      shared: e.tags.filter((t) => tags.includes(t)).length,
    }));

  const sameCourse = opts.course;
  const byShared = scored
    .filter((e) => e.shared > 0)
    .sort((a, b) => {
      if (b.shared !== a.shared) return b.shared - a.shared;
      // 同课程笔记：按标题（章节顺序）排，给出相邻的"上一节 / 下一节"
      if (
        a.kind === "notes" &&
        b.kind === "notes" &&
        sameCourse &&
        a.course === sameCourse &&
        b.course === sameCourse
      ) {
        return a.title.localeCompare(b.title);
      }
      return b.date.getTime() - a.date.getTime();
    });

  let picks = byShared.slice(0, limit);

  // 关联太少（比如新发的、还没同类的），用同集合最近的两篇补上，
  // 保证这个区块不会空着、也不会只挂一篇显得孤零零
  if (picks.length < 2) {
    const pickedHrefs = new Set(picks.map((p) => p.href));
    const fillers = scored
      .filter((e) => e.kind === opts.kind && !pickedHrefs.has(e.href))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    picks = [...picks, ...fillers].slice(0, limit);
  }

  return picks.map((e) => ({
    href: e.href,
    title: e.title,
    kind: e.kind,
    color: KIND_COLOR[e.kind],
  }));
}
