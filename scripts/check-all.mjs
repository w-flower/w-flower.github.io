// 收尾全站校验：多页面 × 明暗两模式 × 桌面/移动两断点
// 检查：console 错误、横向溢出、暗色修复是否生效
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const EXE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.CHECK_BASE || "http://localhost:4321";
const OUT = "D:/Projects/blog/_final_check.json";

const PAGES = [
  "/",
  "/notes/",
  "/tags/",
  "/notes/07-%E5%A4%B9%E9%80%BC%E4%B8%89%E6%9D%BF%E6%96%A7/",
  "/notes/01-%E9%9B%86%E5%90%88%E4%B8%8E%E7%A1%AE%E7%95%8C/",
  "/kb/",
  "/start/",
  "/archive/",
  "/about/",
  "/404.html",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const report = { pages: [], darkFixes: null };

for (const theme of ["light", "dark"]) {
  for (const vp of VIEWPORTS) {
    for (const p of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));
      try {
        await page.goto(BASE + p, { waitUntil: "networkidle0", timeout: 30000 });
        await page.evaluate((t) => localStorage.setItem("theme", t), theme);
        await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 400));
        const m = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
          theme: document.documentElement.getAttribute("data-theme"),
        }));
        report.pages.push({
          theme, vp: vp.name, path: p,
          overflow: m.sw > m.iw + 1 ? `${m.sw} > ${m.iw}` : false,
          themeOk: m.theme === theme,
          errors,
        });
      } catch (e) {
        report.pages.push({ theme, vp: vp.name, path: p, fatal: String(e).slice(0, 120) });
      }
      await page.close();
    }
  }
}

// 暗色修复专项复核（文章页）
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + "/notes/07-%E5%A4%B9%E9%80%BC%E4%B8%89%E6%9D%BF%E6%96%A7/", { waitUntil: "networkidle0" });
  const read = () =>
    page.evaluate(() => {
      const g = (s) => {
        const el = document.querySelector(s);
        if (!el) return "NOT FOUND";
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color };
      };
      return { theme: document.documentElement.getAttribute("data-theme"), tagChip: g(".tag-chip"), tagsLabel: g(".tags-label"), docSocial: g(".doc-social a") };
    });
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload({ waitUntil: "networkidle0" });
  const light = await read();
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await page.reload({ waitUntil: "networkidle0" });
  const dark = await read();
  report.darkFixes = { light, dark };
  await page.close();
}

// 左栏标签按钮（.chip）暗色复核 + ?tag= 深链是否真的筛了
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const chip = () =>
    page.evaluate(() => {
      const el = document.querySelector(".chip[data-tag]");
      if (!el) return "NOT FOUND";
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
  await page.goto(BASE + "/notes/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await page.reload({ waitUntil: "networkidle0" });
  const chipDark = await chip();
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload({ waitUntil: "networkidle0" });
  const chipLight = await chip();

  const shown = (url) =>
    page.goto(BASE + url, { waitUntil: "networkidle0" }).then(() =>
      page.evaluate(() => {
        const cards = [...document.querySelectorAll(".card[data-hc]")];
        const vis = cards.filter((c) => !c.hidden).length;
        const line = document.getElementById("resultLine");
        return { total: cards.length, visible: vis, line: line ? line.textContent.trim() : "" };
      })
    );
  const noTag = await shown("/notes/");
  const withTag = await shown("/notes/?tag=" + encodeURIComponent("极限"));
  report.chipAndDeepLink = { chipLight, chipDark, noTag, withTag };
  await page.close();
}

writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
console.log("written", OUT);
await browser.close();
