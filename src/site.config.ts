export const site = {
  name: "未命名",
  tagline: "把想明白的事记下来，把没想明白的也记下来。",
  description: "学习笔记、C++ 代码与日常随笔。",
  url: "https://example.com",
  lang: "zh-CN",

  author: {
    name: "DHua",
    // 头像放在 public/ 下，改文件名即可
    avatar: "",
    bio: "在读，写代码，偶尔写点别的。",
  },

  nav: [
    { label: "文章", href: "/posts" },
    { label: "笔记", href: "/notes" },
    { label: "代码", href: "/snippets" },
    { label: "随笔", href: "/micro" },
  ],

  // 怪元素开关：全部可关，关掉不影响构建
  quirks: {
    introReveal: true,
    seasonalLine: true,
    cursorDot: false,
    logoSecret: true,
    floatingQuote: true,
  },
} as const;

export type Site = typeof site;
