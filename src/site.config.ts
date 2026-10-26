/**
 * ============================================================
 *  站点信息 / 身份 / 主题开关
 * ============================================================
 *  只放「你是谁」和「站叫什么」，不放界面文案。
 *  界面上的每一句话都在 src/copy.ts。
 * ============================================================
 */

export const site = {
  name: "DHua",
  description: "DHua的个人博客",
  url: "https://w-flower.github.io",
  lang: "zh-CN",

  author: {
    name: "DHua",
    // 头像放 public/ 下，填 "/文件名"；留空则用名字首字母
    avatar: "/avatar.jpg",
    bio: "一个大学牲。",
  },

  /* ── 外链：填了才会显示图标，留空就不显示 ────────── */
  social: {
    github: "https://github.com/w-flower?tab=repositories",
    bilibili: "https://space.bilibili.com/1450118374",
    email: "1941938701@qq.com",
  },

  /* ── 怪元素开关：全部可单独关，关掉不影响构建 ────────── */
  quirks: {
    introReveal: true, // 首屏淡入
    seasonalLine: true, // 页脚随月份变化的一句话
    logoSecret: true, // 连点站名 5 次
  },
};

export type Site = typeof site;
