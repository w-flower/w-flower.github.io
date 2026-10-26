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
    mood: z.string().optional(), // 写这篇时的状态，详情页左栏显示
    tools: z.array(z.string()).default([]), // 用到的工具
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
    /* 列表卡片上那一行。不填就自动截正文开头 110 字。 */
    summary: z.string().optional(),
    /* 知识点标签（跟 course 分开：course 是「哪门课」，tags 是「讲了什么」） */
    tags: z.array(z.string()).default([]),
    mood: z.string().optional(),
    tools: z.array(z.string()).default([]),
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
    mood: z.string().optional(),
    tools: z.array(z.string()).default([]),
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
