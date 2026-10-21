# 博客

Astro 静态站。内容全部是 Markdown，一换框架内容不用动。

## 日常使用

- 双击 **`start.cmd`** —— 启动本地预览，浏览器自动打开
- 双击 **`save.cmd`** —— 把改动存档

完整教程见 **[写作指南.md](./写作指南.md)**。

## 命令（不想双击时用）

```bash
npm install                                   # 第一次
npm run dev -- --host 0.0.0.0 --port 4321     # 本地预览，手机同 Wi-Fi 也能看
npm run build                                 # 构建到 dist/
```

## 写东西

从 `_templates/` 复制对应模板，粘到 `src/content/` 对应的目录里，改文件名和 frontmatter 就完事。

| 想写什么 | 丢进哪 | 模板 |
|---|---|---|
| 技术长文 | `src/content/posts/` | `post.md` |
| 学习笔记 | `src/content/notes/` | `note.md` |
| C++ 片段 | `src/content/snippets/` | `snippet.md` |
| 随笔 | `src/content/micro/` | `micro.md` |

**文件名就是网址。** 例：`src/content/posts/vector-growth-factor.md` → `/posts/vector-growth-factor/`

**新建的文件默认 `draft: true`，不会出现在站点上。** 写完了改成 `false` 才发布。这是为了让你可以放心开着自动保存，半成品不会漏出去。

随笔的文件名建议用时间：`2026-10-21-2340.md`。

## 改站名和署名

只改一个文件：`src/site.config.ts`

```ts
name: "未命名",        // 站名，会出现在标题栏和页头
author: { name: "DHua" }  // 署名
```

全站引用它，改一处就够，不用搜整个项目。

## 怪元素

同样在 `src/site.config.ts` 里：

```ts
quirks: {
  introReveal: true,    // 首屏淡入
  seasonalLine: true,   // 页脚随月份变化的一行字
  cursorDot: false,     // 跟随光标的小点
  logoSecret: true,     // 连点站名 5 次
  floatingQuote: true,  // 角落浮出的一句话
}
```

全部可以单独关。每个怪元素都保证"关掉也好看"。

## 笔记的状态色点

`notes` 的 `status` 字段：

- `seed` 浅褐 —— 刚记下，还没消化
- `growing` 赭黄 —— 补过例子，能讲明白
- `evergreen` 墨绿 —— 反复验证过，能当手册查

笔记列表页按 `course` 分组，一眼能看出哪篇该回头补。

## 代码片段要带运行链接

`snippets` 的 `run` 字段填 [Compiler Explorer](https://godbolt.org) 的分享链接。读者能改参数、看汇编、换标准版本。

没有 `run` 也能发，但少了一半价值。

## 目录结构

```
src/
├─ site.config.ts      全站变量（站名/署名/开关）
├─ content.config.ts   四类内容的字段校验
├─ content/            内容，只改这里
├─ layouts/            页面外壳
├─ components/         组件 + quirks/（怪元素）
├─ pages/              路由，文件即网址
├─ lib/                小工具
└─ styles/global.css   全部样式
```

## 部署

推到 GitHub 或 GitLab 仓库，在 EdgeOne Pages 里连上，构建命令 `npm run build`，输出目录 `dist`。

之后每次 push 自动构建。换平台只改连接配置，仓库内容不动。

## 自动保存

`.vscode/settings.json` 已配好 `files.autoSave: afterDelay`，停手 1.2 秒自动存盘。

想连提交也自动化，装推荐的 GitDoc 插件，它会在保存时自动 commit。
