import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://w-flower.github.io",
  trailingSlash: "ignore",
  integrations: [sitemap()],
  /* 关掉开发工具栏。默认那条深色胶囊（A / 光标 / 搜索 / 齿轮）浮在页面
     底部中央，宽度会盖住内容，正式截图和手机上都很碍事。
     要用的时候临时改成 enabled: true，或者按 dev toolbar 自己的快捷键。 */
  devToolbar: {
    enabled: false,
  },
  build: {
    format: "directory",
  },
  markdown: {
    /* 数学公式：$...$ 行内、$$...$$ 块级，交给 KaTeX 在构建期渲染成 HTML。
       工数笔记全是公式，没有这个会满屏裸 $ 符号。 */
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    /* 让正文里能直接写 <mark>荧光笔</mark>、<span class="sticker">贴纸字</span>。
       内容全是我自己写的 md，不接用户输入，打开没有注入面。 */
    allowDangerousHtml: true,
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
