// 验证脚本：构建完成后，用 Edge(headless) 逐个页面截图 + 抓控制台错误 + 断言关键修复点。
// 用法：node scripts/verify-import.mjs http://localhost:4321
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:4321";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = "D:/Projects/blog/.shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

const results = [];

async function check({ path, w, label, full = true, evalFn }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => errs.push("PAGEERR: " + e.message.slice(0, 160)));
  let info = {};
  try {
    await page.goto(BASE + path, { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 800));
    if (evalFn) info = await page.evaluate(evalFn);
    const file = `${OUT}/${label}.png`;
    await page.screenshot({ path: file, fullPage: full });
    results.push({ path, w, label, errs, info, file });
  } catch (e) {
    results.push({ path, w, label, errs: ["GOTO FAIL: " + e.message], info, file: "" });
  }
  await page.close();
}

// 首页（卡片重叠修复）：桌面 + 手机
await check({
  path: "/",
  w: 1280,
  label: "home-d",
  evalFn: () => {
    const foot = document.querySelector(".entry-foot");
    const pos = foot ? getComputedStyle(foot).position : "none";
    const cards = document.querySelectorAll(".card").length;
    return { cards, entryFootPos: pos, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
  },
});
await check({ path: "/", w: 390, label: "home-m", evalFn: () => ({ overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }) });

// 笔记列表：应有 15+ 篇工数 + 原有 2 篇
await check({
  path: "/notes/",
  w: 1280,
  label: "notes-list-d",
  evalFn: () => {
    const cards = [...document.querySelectorAll(".card")];
    const gongshu = cards.filter((c) => (c.dataset.tagsRaw || "").includes("工科数学分析")).length;
    return { totalCards: cards.length, gongshuCards: gongshu };
  },
});

// 数学笔记详情：验证 KaTeX 真的渲染了公式（不止裸 $ 符号）
await check({
  path: "/notes/03-极限的定义/",
  w: 1280,
  label: "note-math-d",
  evalFn: () => {
    const katex = document.querySelectorAll(".katex").length;
    const display = document.querySelectorAll(".katex-display").length;
    const titleColor = getComputedStyle(document.querySelector(".doc-title")).webkitTextFillColor;
    const firstP = document.querySelector(".prose > p:first-of-type");
    const dropcap = firstP ? firstP.classList.contains("dropcap") : false;
    const tagChips = document.querySelectorAll(".doc-tags .tag-chip").length;
    const rawDollar = [...document.querySelectorAll(".prose")].some((p) => /\$/.test(p.textContent || ""));
    return { katex, display, titleColor, dropcap, tagChips, rawDollarLeft: rawDollar };
  },
});

// 附录 A（公式最密的一篇）
await check({
  path: "/notes/附录A-三角函数速查/",
  w: 1280,
  label: "note-appendixA-d",
  evalFn: () => ({ katex: document.querySelectorAll(".katex").length, display: document.querySelectorAll(".katex-display").length }),
});

// 弹幕墙：仍在且 JS 没报错
await check({
  path: "/danmaku/",
  w: 1280,
  label: "danmaku-d",
  evalFn: () => {
    const stage = !!document.querySelector(".dm-stage");
    const items = document.querySelectorAll(".dm-item").length;
    const toggle = document.getElementById("dmToggle")?.textContent?.trim();
    return { stage, items, toggle };
  },
});

await browser.close();

let fail = 0;
for (const r of results) {
  const errLine = r.errs.length ? "ERRORS: " + r.errs.join(" || ") : "ok";
  if (r.errs.length) fail++;
  console.log(`[${r.label}] ${r.path} @${r.w}  ${errLine}`);
  console.log("    " + JSON.stringify(r.info));
}
console.log(`\n截图在 ${OUT}/ ；控制台错误页面数：${fail}/${results.length}`);
