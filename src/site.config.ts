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

  /* ── 评论 ────────────────────────────────────────────────
     两个值都填了，文章页底部才会出现评论区；没填就整块不渲染
     （不留一个「加载失败」的空壳）。

     为什么不是 Giscus / Waline / Twikoo：
       用户要的是「公开 / 匿名 / 仅双方可见」三种。前两个能公开也能匿名，
       但「仅双方可见」是要在服务端把行过滤掉，任何开箱即用的评论组件
       都做不到 —— 它们把评论列表一次性吐给所有访客。
       所以只能自己接一个 PostgREST 兼容后端（Supabase 免费版即可），
       用 RLS 挡住私密行，再用 RPC 按口令取回。
       建表 SQL 在 docs/comments-schema.sql，照着跑一遍就行。

     endpoint: 形如 https://xxxxxxxx.supabase.co
     anonKey: 形如 sb_publishable_xxx / eyJhbGciOi...（这是公开键，可以进前端）
     注意：service_role / secret key 绝对不能填在这里。 */
  comments: {
    endpoint: "",
    anonKey: "",
  },
};

export type Site = typeof site;
