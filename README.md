# 个人博客

用 Astro 搭的静态博客。内容全是 Markdown，界面文案和配置都抽成了单文件，改东西不用翻代码。

视觉：浅色毛玻璃 + 分层动态背景（顶部图片视差 / 底部浅蓝水波），两栏布局。设计稿见 `docs/主页改版设计稿.md`。

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
| 站名、署名、个人简介、头像、GitHub/B站/邮箱 | `src/site.config.ts` |
| 界面上的任何一句话（标题、按钮、提示、404 文案、页脚） | `src/copy.ts` |
| 顶部背景图 | `src/styles/global.css` 的 `.bg-img`（见第五章）|
| 底部水波的数量、起伏、透明度 | `src/components/BgLayer.astro` 顶部的 `waves` |
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
| `profile.sign` | 左栏头像下面那一行签名（收起时唯一可见的文字）|
| `profile.bio` | 鼠标悬停左栏头像卡后，展开的第二层里的那段自我介绍 |
| `profile.codeEntry` | 展开层最底下「所有代码 →」那个按钮 |
| `sidebar.tags / kinds` | 左栏两个分组标题：「标签库」「分类」 |
| `sidebar.allTags` | 标签库里那个「全部」 |
| `kinds.*` | 四种内容在各处显示的名字（全部 / 文章 / 笔记 / 代码 / 随笔）|
| `search.placeholder` | 搜索框里灰色的提示字 |
| `search.hint` | 搜索框右边那个按键提示（默认 `/`），填 `""` 就不显示 |
| `search.empty` | 搜索什么都没搜到时那句话 |
| `search.count` | 卡片列表上方「共 7 条」，`{n}` 会被换成数字 |
| `pagination.prev / next` | 分页的左右箭头 |
| `hoverCard.words / readTime` | 鼠标悬停浮出的详情卡里「1,240 字 · 约 4 分钟」|
| `hoverCard.open / esc` | 详情卡底部「打开 →」「Esc 关闭」|
| `stats.posts` 等 | 展开层那四格统计的单位，如「篇文章」|
| `sections.*` | 各区块标题，如「文章 / Posts」 |
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

**改左栏那两句话：**

```ts
profile: {
  sign: "大二 · 在学 C++",        // 收起时看得见
  bio: "这句只有鼠标悬停才展开。",
  codeEntry: "看我的代码 →",
  ...
},
```

**改搜索框的提示：**

```ts
search: {
  placeholder: "找点什么？",
  hint: "",                       // 留空就不显示右边那个 / 键提示
  empty: "这词我确实没写过。",
  count: "找到 {n} 条",
},
```

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
    name: "DHua",              // 左栏昵称、页脚署名、头像首字母
    avatar: "",                // 头像文件名，放 public/ 下，留空用名字首字母
    bio: "在读，写代码…",       // 页脚等处用的简介
  },

  social: {
    github: "",                // 填了就显示图标，留空不显示
    bilibili: "",
    email: "1941938701@qq.com",
  },

  quirks: {
    introReveal: true,    // 首屏淡入
    seasonalLine: true,   // 页脚随月份变化的那句话
    logoSecret: true,     // 连点站名 5 次的彩蛋
  },
};
```

`social` 里三个都留空，左栏展开层那一排图标就整排不出现，不会留空白。

三个 `quirks` 全部可以单独关，关掉不影响构建，也不会留下空位。

---

## 五、颜色与排版

全在 `src/styles/global.css` 顶部的 `:root`：

```css
--bg-top:   #eef3fa;   /* 页面顶部底色 */
--bg-bottom:#d7e8f8;   /* 底部水波那一片 */
--glass:      rgba(255,255,255,.55);  /* 毛玻璃面板 */
--glass-line: rgba(255,255,255,.75);  /* 玻璃的高光边 */
--hairline:   rgba(150,180,220,.3);   /* 分隔线 */
--ink:   #1b2430;      /* 主文字 */
--ink-2: #5d6b7d;      /* 次要文字 */
--ink-3: #8b98a9;      /* 提示、日期 */
--accent:#5b8def;      /* 雾蓝，全站唯一强调色 */
--radius-lg: 24px;     /* 卡片圆角 */
--blur:      18px;     /* 毛玻璃模糊度，手机端自动降到 12px */
```

**换强调色**只改 `--accent` 和 `--accent-2`，导航高亮、卡片高光、标签、分页当前页会一起变。

### 顶部背景图

现在用的图在 **`public/bg/hero.jpg`**（罗小黑风格的红枫水景）。换图只要用同名文件覆盖它，不用改代码。

但这张原图是深色的（深水 + 高饱和红枫），直接铺会把浅色玻璃和深色文字全毁。所以 `.bg-img` 在图片上叠了一层白色遮罩：

```css
.bg-img {
  --hero-scrim: 0.56;   /* 遮罩浓度，唯一需要调的旋钮 */
  height: 92vh;          /* 图片层高度，跟着 mask 一起决定淡出位置 */
}
```

| 值 | 效果 |
|---|---|
| `0.42` | 图最明显，红枫能看清，但右侧卡片会泛红 |
| `0.56` | 当前默认，图作为暖色底纹存在，文字安全带 |
| `0.82` | 几乎只剩一层淡暖雾，图基本看不见 |

想换图又不确定浓度，先把图放进去、把值调到 `0.45` 看，觉得字压不住就往上加 0.05。

淡出位置在同一段 CSS 的 `mask-image` 里调（`#000 46%` = 到 46% 之前都全清晰）。改 `height` 时两个要一起动，不然底部会出现硬边。

图片本身建议 **1920×1080 以上**。现在这张是 1080×630，在 1440 宽的屏幕上会被放大 1.33 倍，略软——因为有遮罩所以看着不明显，但你换图时尽量给大一点。

底部的淡出遮罩（`mask-image`）和滚动视差会自动作用在新图上，不用另外处理。

### 底部水波

`src/components/BgLayer.astro` 里 `waves` 数组，三个对象 = 三条波浪。改 `amp` 是起伏高度，`op` 是透明度，`seg` 是波长（越大越平缓），循环速度在 `global.css` 的 `.wave-1/2/3` 里。

---

## 六、首页结构与动效

```
左栏 300px（sticky）        右栏流式
├ 个人信息卡（悬停展开）      ├ 搜索框（/ 聚焦）
└ 标签库 / 分类导航           ├ 内容卡片（分页 6 条/页）
                            └ 分页
```

动效全部是原生 CSS + 极少量 JS，没有 GSAP、没有动画库：

| 动效 | 触发 | 实现在哪 |
|---|---|---|
| 顶部图视差 | 滚动 | `global.css` 的 `@keyframes img-parallax`（`animation-timeline: scroll(root)`）|
| 底部水波 | 无限循环 | `.wave-1/2/3` 的 `wave-drift` |
| 左栏跟随滚动轻微上移 | 滚动 | `@keyframes side-drift` |
| 顶部阅读进度条 | 滚动 | `.progress::after` 的 `progress-grow` |
| 卡片入场 stagger | 进视口 | `global.css` 的 `.stagger > *`，延迟靠 `--i` |
| 卡片光标高光 | 移动鼠标 | `Base.astro` 里写 `--mx/--my` |
| 卡片悬停抬升 | 悬停 | `.card:hover` |
| 个人信息悬停展开 | 悬停 120ms | `.profile-more` 的 `grid-template-rows: 0fr → 1fr` |
| 头像描边旋转 | 悬停 | `.avatar::after` 的 `conic-gradient` |
| 分类胶囊滑块 | 点分类 | `index.astro` 里算 `getBoundingClientRect` 差值 |
| 悬停详情浮层 | 停留 400ms | `components/HoverCard.astro` |
| 分页切换 | 点页码 | `index.astro` 的 `apply()` |

**滚动类动画全包在 `@supports (animation-timeline: scroll())` 里**，老浏览器（Firefox 旧版）直接显示静态内容，不会白屏。`prefers-reduced-motion: reduce` 时水波和视差全停。

**明确没做**：平滑滚动劫持（Lenis）、GSAP、粒子背景（雪花 / 雨 / Canvas / WebGL）、正文逐字打字机。理由写进 `docs/动效与编辑器方案.md` 了：一句话——只做「一次性的、合成器友好的」动效。

### 详情页动效

| 动效 | 触发 | 实现在哪 | 备注 |
|---|---|---|---|
| 进度条上的罗小黑 | 滚动 | `Base.astro` 的 `--x/--tilt/--s` | 方向跟滚动方向，滚快会鼓一下；停手 rAF 自停 |
| 标题逐词出现 | 进页面 | `.type-in > span` + `lib/typein.ts` | 按词拆（中文按字），`--i` 控制延迟，词多自动压缩节奏 |
| 荧光笔 | 写 `<mark>` | `.prose mark` | 跨行正确铺色；`<mark class="blue">` 换色 |
| 渐变标题 | 常驻 | `.grad-text` | `background-clip:text`，hover 时渐变走一遍 |
| 首字下沉 | 进页面 | `.prose p.dropcap` | **JS 判定**首字符才挂 class，见下 |
| 拍立得相框 | 悬停 | `.polaroid` | 白边 + 1.1° 旋转 + 抬升 |
| 写作热力图 | 常驻 | `components/Heatmap.astro` | 零 JS 静态 SVG，数据从 content 集合算 |
| 长按一键三连 | 按住 800ms | `components/ReactBar.astro` | 点赞+收藏+复制一次完成；键盘可触发；收藏存 localStorage |

**两个必须知道的坑（都踩过）**

1. **`background-clip:text` 配逐词 span 会让标题消失。** span 自带 transform 就是独立层，父级渐变被裁没了。`.type-in.grad-text > span` 里让每个 span 自己带一遍渐变。
2. **首字下沉不能用纯 CSS 自动抓。** 正文首段常写成 `**粗体**` 开头，`::first-letter` 会抓到一个星号，变成「蓝色方块里一个 *」。`ArticlePage.astro` 里的脚本先判首字符，是汉字/字母才挂 `.dropcap`。

**写正文能用的 HTML**（`astro.config.mjs` 已开 `allowDangerousHtml`）：

```html
<mark>荧光笔</mark><mark class="blue">蓝色荧光笔</mark>
<span class="polaroid"><img src="/bg/hero.jpg" alt=""></span>
<span class="sticker">描边字</span>
```

注意 md 里 `**粗体**` 后面紧跟中文时不会解析（CommonMark 规定闭合标记右边必须是空白或标点），要写 `**粗体** 紧跟中文`，中间留个空格。

### 全站级的东西

**⌘K 命令面板**（`components/CmdPalette.astro`，挂在 `Base.astro` 里所以全站可用）

按 `⌘K` / `Ctrl+K` 唤起，或点右下角浮标。它同时管搜索和跳转：

| 你输入 | 面板给什么 |
|---|---|
| 空 | 最近写的 4 篇 + 8 个快捷入口 |
| 词 | 全站命中，标题里的命中标黄，标题命中权重高于正文 |
| 多个词 | AND：`树 插入` 命中「红黑树插入」 |
| 空格 | 命令：回首页、去笔记、去代码、看归档、去弹幕墙… |

键盘：`↑↓` 选、`Home/End` 跳首尾、`回车` 打开、`Esc` 关。焦点会在关闭时还给原处。

**不替代原来的 `/` 搜索框**——`/` 搜当前列表页的卡片（配合左侧分类和标签筛选），`⌘K` 搜全站。两个键不冲突。

micro 不进面板的「最近」区：它没有独立详情页，全跳 `/micro/`，占位置但给不出不同去处。

**弹幕墙**（`/danmaku/`，导航「其他 → 弹幕墙」）

把 `src/content/micro/` 的每条随笔变成从右往左飘的弹幕。这是全站唯一的连续动画，所以三条约束写死在代码里：

1. 独立彩蛋页，不进首页、不进任何列表页
2. 弹幕数 = 随笔条数，不复制不循环
3. **默认暂停**，得主动点「开始」才动；标签页切走自动停

轨道数按视口宽度现算（手机 2 条、桌面 4-6 条），resize 会重算。页面同时渲染了一份**完整的静态随笔列表**，所以关掉动效、或 JS 挂了，这个页依然是一份能读的内容，不是坏掉。

**页面过渡**（纯 CSS，`@view-transition`）

跨页面淡入淡出 + 8px 位移。Chrome/Edge 126+、Safari 18.2+ 生效；Firefox 还在 flag 后，不支持就直接跳，不报错不闪白。

背景层单独给了 `view-transition-name: bg`——它里面有无限循环的水波动画，不分组的话快照时会被定格，过渡里会看到水波「卡一下再跳」。

**故意没用 Astro 的 `<ClientRouter />`**：那是把站点改成 SPA，要处理状态同步、滚动位置、事件重绑，为一个淡入淡出付出太多。

---

## 七、四类内容

复制 `_templates/` 里的模板，粘到对应目录，改文件名和开头的字段。

| 类型 | 目录 | 关键字段 |
|---|---|---|
| 技术长文 | `src/content/posts/` | `title` `summary` `tags` `mood` `tools` |
| 学习笔记 | `src/content/notes/` | `course` `status` `mood` `tools` |
| 代码片段 | `src/content/snippets/` | `std` `run` `repo` `mood` `tools` |
| 随笔 | `src/content/micro/` | `date` `mood`，无标题 |

`mood`（写这篇时的状态）和 `tools`（用到的工具）会显示在详情页左栏的信息卡里，不填就显示「—」。

**文件名就是网址。** `posts/vector-growth-factor.md` → `/posts/vector-growth-factor/`

**新建文件默认 `draft: true`，不会上线。** 写完改成 `false` 才发布。这样你可以放心开着自动保存。

### 笔记的 `status`

- `seed` —— 刚记下，还没消化
- `growing` —— 补过例子，能讲明白
- `evergreen` —— 反复验证过，能当手册查

显示成什么字在 `copy.ts` 的 `noteStatus`，圆点颜色在 `global.css` 的 `.dot`。

### 代码片段的 `run`

填 [Compiler Explorer](https://godbolt.org) 的分享链接。有它，列表里会标「可运行 ↗」，详情页顶部出现跳转入口。读者能改参数、看汇编、换标准版本。

### 详情页长什么样

文章 / 笔记 / 代码的详情页是同一个骨架（`src/components/ArticlePage.astro`），三栏：

```
左栏（sticky）                 中栏                    右栏（sticky）
├ 头像 + 名字                   ├ 大标题                ├ 目录
├ 信息卡                       ├ 标签栏（首个是「标签」） └ 编号 1、2、3…
│   Date / mood / 工具          └ 正文
│   … 点一下展开更多
└ GitHub / B 站图标
```

- **目录自动生成**：从正文的 `##` `###` 标题抓，不用手写。滚动时当前小节会高亮，点击平滑跳转。
- 屏幕窄于 1180px 时右栏目录自动收起来；窄于 900px 时左栏变成正文上方的两张并排卡片。
- 想改信息卡上的字（Date / mood / 工具…），在 `copy.ts` 的 `doc` 里改。

---

## 八、目录

```
blog/
├─ start.cmd              双击启动预览
├─ save.cmd               双击存档
├─ 写作指南.md            一页纸写作教程
├─ docs/主页改版设计稿.md   这一版界面的设计说明（动效清单、交互逻辑）
├─ _templates/            四类内容的空白模板
├─ _drafts/               调研卡等草稿，不进构建
├─ public/                favicon、背景图
└─ src/
   ├─ site.config.ts      站名 / 署名 / 外链 / 开关
   ├─ copy.ts             ★ 所有界面文案
   ├─ content.config.ts   四类内容的字段校验
   ├─ content/            ★ 所有文章
   ├─ layouts/Base.astro  页面外壳（导航、进度条、页脚、脚本）
   ├─ components/
   │  ├─ BgLayer.astro    背景三层（渐变 + 顶部图 + 水波）
   │  ├─ Sidebar.astro    左栏个人信息 + 标签/分类导航
   │  ├─ HoverCard.astro  鼠标悬停浮出的详情卡
   │  └─ SeasonalLine.astro  页脚那句随月份变的话
   ├─ pages/              路由，文件即网址
   ├─ lib/format.ts       日期格式化、排序、草稿过滤
   └─ styles/global.css   ★ 所有样式
```

带 ★ 的三个是你日常会改的。

---

## 九、命令

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

### 全套检查脚本

```bash
node scripts/auditdoc.mjs       # 11 页 × 6 断点横向溢出体检（改完必跑）
node scripts/checkcat.mjs       # 进度条罗小黑：位置/歪头/缩放是否联动、rAF 是否自停
node scripts/checktypein.mjs    # 逐词出现：动画后是否全部可见、reduce 下是否降级
node scripts/checkreact.mjs     # 长按三连：短按取消/长按完成/刷新保留/键盘/reduce
node scripts/checkvt.mjs        # 页面过渡：规则被解析、背景层分组、跨页后页面完整
node scripts/checkcmdk.mjs      # 命令面板 + 弹幕墙：键盘/空态/跳转/暂停/reduce
node scripts/checknav.mjs       # 导航第二层边缘翻转
```

改完动效至少跑 `auditdoc.mjs`。这三个 check 脚本是给「看不出问题但怀疑有问题」用的常规体检。

**一个测试环境的坑**：`html` 上有 `scroll-behavior: smooth`，脚本里 `scrollIntoView()` 后必须等平滑滚动结束再采坐标，否则鼠标事件会落到旧位置上，测出「点击没反应」的假失败。

---

## 十、部署

仓库推上去，在 EdgeOne Pages（国内快）或 Cloudflare Pages 里连上：

- 构建命令：`npm run build`
- 输出目录：`dist`

之后每次 push 自动构建。换平台只改连接配置，内容一行不用动。

记得部署后把 `src/site.config.ts` 的 `url` 改成真实域名，`og:*` 标签和 RSS 里的链接才对。

---

## 十一、常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 写了但网站上没有 | `draft: true` | 改成 `false` |
| 改了文案没变化 | 文件存错位置 | 确认在 `src/copy.ts` 或 `src/site.config.ts` |
| 页面白屏 / 报错 | 字段类型不符 | 看黑窗口的报错，通常是 frontmatter 少字段或日期格式不对 |
| 端口 4321 被占 | 之前的窗口没关 | Astro 会自动换端口，看窗口里输出的新地址 |
| 双击 cmd 闪一下就没了 | 依赖没装好 | `npm install` 重装 |
| 手机打不开 | 不在同一 Wi-Fi，或 IP 变了 | 看窗口里的 `Network:` 行 |
