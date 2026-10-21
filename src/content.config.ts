import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const base = {
  title: z.string(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
};

// 技术长文
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z.object({
    ...base,
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

// 学习笔记：status 标记成熟度 seed -> growing -> evergreen
const notes = defineCollection({
  loader: glob({ base: "./src/content/notes", pattern: "**/*.md" }),
  schema: z.object({
    ...base,
    title: z.string(),
    course: z.string(),
    status: z.enum(["seed", "growing", "evergreen"]).default("seed"),
  }),
});

// C++ 代码片段：run 指向 Compiler Explorer
const snippets = defineCollection({
  loader: glob({ base: "./src/content/snippets", pattern: "**/*.md" }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    std: z.string().default("c++17"),
    run: z.string().url().optional(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 随笔：无标题，1-3 句
const micro = defineCollection({
  loader: glob({ base: "./src/content/micro", pattern: "**/*.md" }),
  schema: z.object({
    date: z.coerce.date(),
    mood: z.enum(["高", "中", "低"]).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, notes, snippets, micro };
