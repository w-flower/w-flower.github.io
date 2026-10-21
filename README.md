# 个人博客

用 Astro 搭的静态博客。内容全是 Markdown，界面文案和配置都抽成了单文件，改东西不用翻代码。

视觉参考：[wuhobin/homepage](https://github.com/wuhobin/homepage)（深暖墨 + 朱橙，Bento 网格，只有深色）。

---

## 一、日常三步

| 动作 | 操作 |
|---|---|
| 打开 | 双击 **`start.cmd`**，浏览器自动打开 `http://localhost:4321` |
| 写 | 在 `src/content/` 下编辑 Markdown |
| 存档 | 双击 **`save.cmd`** |

`start.cmd` 弹出的黑窗口就是服务器，**别关**，关了页面就打不开。

详细写作说明见 **[写作指南.md](./写作指南.md)**。

---

## 二、我想改 X，该动哪个文件

**这是全篇最重要的一张表。绝大多数需求都不用碰页面代码。**

| 我想改 | 改这里 |
|---|---|
| 站名、署名、个人简介、头像 | `src/site.config.ts` |
| 界面上的任何一句话（标题、按钮、提示、404 文案、页脚） | `src/copy.ts` |
| 颜色（强调色、底色、文字色） | `src/styles/global.css` 顶部 `:root` |
| 字体、字号、行高、圆角 | `src/styles/global.css` |
| 打开/关闭怪元素（淡入、彩蛋、页脚那句话） | `src/site.config.ts` 的 `quirks` |
| 文章正文 | `src/content/` 下对应的文件夹 |
| 布局结构（加一栏、改网格列数） | `src/pages/` 和 `src/styles/global.css` |

只有最后一行需要碰代码，其余都是改字符串。

---

## 三、文案接口：`src/copy.ts`

打开这个文件，里面每个 block 对应界面上一个位置，注释已经标好了。改完保存，浏览器自动刷新。

### 对应关系

| `copy.ts` 里的字段 | 出现在哪 |
|---|---|
| `nav` | 右上角导航栏，顺序即显示顺序 |
| `hero.line1 / line2 / highlight / tail` | 首页最大的那句话。`highlight` 会被染成强调色 |
| `stats.posts` 等 | 首页那排小标签，前面自动拼数字，如「3 条随笔」 |
| `marqueeExtra` | 首页那条滚动字幕。会自动合并你文章的 `tags` |
| `sections.*` | 首页各区块的标题，如「文章 / Posts」 |
| `sections.more` | 区块右上角那个「全部 →」 |
| `listPages.*` | 四个列表页顶部的大标题和小字 |
| `noteStatus.*` | 笔记的三种状态显示成什么字 |
| `snippet.runnable / readonly` | 代码列表卡片右下角的标记 |
| `snippet.openInCE / repoLabel / repoLink` | 代码详情页的「去 Compiler Explorer」和 GitHub 链接 |
| `back.*` | 详情页底部的返回链接 |
| `empty.posts` | 一篇文章都没有时显示的话 |
| `notFound.*` | 404 页。`lines` 里随机挑一条显示 |
| `footer.meta` | 页脚那一行小字 |
| `secret` | 连点左上角站名 5 次弹出的话 |
| `monthly` | 页脚那句随月份变的话，数组第 1 项是 1 月 |

### 几个例子

**改首页那句话：**

```ts
hero: {
  line1: "白天写代码，",
  line2: "晚上写",
  highlight: "写不出来的东西",
  tail: "。",
},
```

变成：「白天写代码，/ 晚上写**写不出来的东西**。」中间会自动换行，`highlight` 那段是橙色。

**不想要滚动字幕：**

```ts
marqueeExtra: [],
```

把数组清空，再把自己文章的 `tags` 也删掉，字幕就不出现了（不会留一条空白）。

**改 404 的调性：**

```ts
notFound: {
  title: "404",
  lines: ["这里什么都没有。", "你走错门了。"],
  home: "回去",
  micro: "随便看看",
},
```

---

## 四、站点信息：`src/site.config.ts`

```ts
export const site = {
  name: "未命名",              // 左上角站名，也会进标题栏
  description: "…",            // SEO 描述
  url: "https://example.com",  // 部署后改成真实域名
  lang: "zh-CN",

  author: {
    name: "DHua",              // 页脚署名
    avatar: "",                // 头像文件名，放 public/ 下，留空不显示
    bio: "在读，写代码…",       // 首页标题下面那句话
  },

  quirks: {
    introReveal: true,    // 首屏淡入
    seasonalLine: true,   // 页脚随月份变化的那句话
    logoSecret: true,     // 连点站名 5 次的彩蛋
  },
};
```

三个 `quirks` 全部可以单独关，关掉不影响构建，也不会留下空位。

---

## 五、颜色与排版

全在 `src/styles/global.css` 顶部的 `:root`：

```css
--background: #16110e;   /* 暖墨底 */
--surface:    #201914;   /* 卡片面 */
--surface-2:  #2a211a;   /* 更亮一档的表面 */
--ink:        #f5efe6;   /* 主文字 */
--muted:      #bfb2a3;   /* 次要文字 */
--faint:      #7d6f62;   /* 提示文字 */
--line:       #3a302a;   /* 分隔线 */
--accent:     #ff5a1f;   /* 朱橙，全站唯一强调色 */
--accent-soft:#ff7a45;
--radius-card: 18px;     /* 卡片圆角 */
--measure:    760px;     /* 正文最大宽度 */
```

**换强调色**只改 `--accent` 和 `--accent-soft`，导航高亮、卡片悬停、引用线、标题前的小横杠会一起变。

**注意：只有深色，没有浅色模式。** 这是设计上的选择，不是没做完。要加浅色，得给每个变量补一份 `@media (prefers-color-scheme: light)` 的值，不是改一行能解决的。

---

## 六、四类内容

复制 `_templates/` 里的模板，粘到对应目录，改文件名和开头的字段。

| 类型 | 目录 | 关键字段 |
|---|---|---|
| 技术长文 | `src/content/posts/` | `title` `summary` `tags` |
| 学习笔记 | `src/content/notes/` | `course` `status` |
| 代码片段 | `src/content/snippets/` | `std` `run` `repo` |
| 随笔 | `src/content/micro/` | `date` `mood`，无标题 |

**文件名就是网址。** `posts/vector-growth-factor.md` → `/posts/vector-growth-factor/`

**新建文件默认 `draft: true`，不会上线。** 写完改成 `false` 才发布。这样你可以放心开着自动保存。

### 笔记的 `status`

- `seed` —— 刚记下，还没消化
- `growing` —— 补过例子，能讲明白
- `evergreen` —— 反复验证过，能当手册查

显示成什么字在 `copy.ts` 的 `noteStatus`，圆点颜色在 `global.css` 的 `.dot`。

### 代码片段的 `run`

填 [Compiler Explorer](https://godbolt.org) 的分享链接。有它，列表里会标「可运行 ↗」，详情页顶部出现跳转入口。读者能改参数、看汇编、换标准版本。

---

## 七、目录

```
blog/
├─ start.cmd              双击启动预览
├─ save.cmd               双击存档
├─ 写作指南.md            一页纸写作教程
├─ _templates/            四类内容的空白模板
├─ _drafts/               调研卡等草稿，不进构建
├─ public/                favicon 等静态文件
└─ src/
   ├─ site.config.ts      站名 / 署名 / 开关
   ├─ copy.ts             ★ 所有界面文案
   ├─ content.config.ts   四类内容的字段校验
   ├─ content/            ★ 所有文章
   ├─ layouts/Base.astro  页面外壳（导航、页脚、脚本）
   ├─ components/         季节句组件
   ├─ pages/              路由，文件即网址
   ├─ lib/format.ts       日期格式化、排序、草稿过滤
   └─ styles/global.css   ★ 所有样式
```

带 ★ 的三个是你日常会改的。

---

## 八、命令

```bash
npm install                                  # 第一次，或换电脑后
npm run dev -- --host 0.0.0.0 --port 4321    # 本地预览，手机同 Wi-Fi 也能看
npm run build                                # 构建到 dist/
npm run preview                              # 预览构建产物
```

不想敲命令就双击 `start.cmd`。

### 手机访问

`start.cmd` 启动后，窗口里会显示一行 `Network: http://192.168.x.x:4321/`。手机连同一个 Wi-Fi，输入这个地址就能看。

IP 每次可能不同，以窗口里显示的为准。

### 截图 / 响应式检查

```bash
node scripts/shot.mjs "http://127.0.0.1:4321/" out.png 390 1400
```

参数依次是 网址、输出文件、视口宽、视口高。会顺带打印 `clientWidth / scrollWidth` 和溢出元素清单。**别用 Edge 命令行的 `--window-size` 截窄屏**，它会把视口强制到 800px 再裁切，看起来像布局崩了，是假象。

---

## 九、部署

仓库推上去，在 EdgeOne Pages（国内快）或 Cloudflare Pages 里连上：

- 构建命令：`npm run build`
- 输出目录：`dist`

之后每次 push 自动构建。换平台只改连接配置，内容一行不用动。

记得部署后把 `src/site.config.ts` 的 `url` 改成真实域名，`og:*` 标签和 RSS 里的链接才对。

---

## 十、常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 写了但网站上没有 | `draft: true` | 改成 `false` |
| 改了文案没变化 | 文件存错位置 | 确认在 `src/copy.ts` 或 `src/site.config.ts` |
| 页面白屏 / 报错 | 字段类型不符 | 看黑窗口的报错，通常是 frontmatter 少字段或日期格式不对 |
| 端口 4321 被占 | 之前的窗口没关 | Astro 会自动换端口，看窗口里输出的新地址 |
| 双击 cmd 闪一下就没了 | 依赖没装好 | `npm install` 重装 |
| 手机打不开 | 不在同一 Wi-Fi，或 IP 变了 | 看窗口里的 `Network:` 行 |
