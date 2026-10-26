/**
 * 诊断脚本：把用户报的每个问题变成可读的数字。
 * 用法：node scripts/diagnose.mjs [BASE]
 */
import puppeteer from "puppeteer-core";

const BASE = process.env.DIAG_BASE || process.argv[2] || "http://127.0.0.1:4322";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const log = (s) => console.log(s);
const errors = [];

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-proxy-server", "--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

async function newPage(viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on("pageerror", (e) => errors.push(`${page.url()} :: PAGEERROR ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${page.url()} :: console.error ${m.text()}`);
  });
  return page;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- 1. 列表页搜索（正文） ---------------- */
{
  const page = await newPage();
  await page.goto(`${BASE}/notes/`, { waitUntil: "networkidle2" });
  await page.waitForSelector("#searchInput");
  await wait(400); // 等全文索引拉回来

  const probe = async (term) => {
    await page.evaluate(() => {
      const i = document.getElementById("searchInput");
      i.value = "";
      i.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.type("#searchInput", term);
    await wait(340);
    return page.evaluate(() => ({
      line: document.getElementById("resultLine")?.textContent?.trim(),
      hits: [...document.querySelectorAll(".card[data-hc]:not([hidden])")].map((c) => c.dataset.title),
      snip: [...document.querySelectorAll(".card[data-hc]:not([hidden]) .card-desc.has-hit")].length,
      marks: [...document.querySelectorAll(".card-desc mark.q-hit")].map((m) => m.textContent),
    }));
  };

  log("=== 1. 列表页搜索（这些词只出现在正文中后段）===");
  for (const t of ["差商", "有理化", "归纳法", "反证", "最大值", "确界", "一致连续", "罗尔"]) {
    const r = await probe(t);
    log(`  ${t.padEnd(6)} → ${r.line}  高亮${r.snip}处  首条: ${(r.hits[0] || "(无)").slice(0, 26)}`);
  }
  await page.close();
}

/* ---------------- 2. ⌘K 命令面板（曾经只搜 400 字） ---------------- */
{
  const page = await newPage();
  await page.goto(`${BASE}/notes/`, { waitUntil: "networkidle2" });
  await wait(200);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await wait(500);
  const opened = await page.evaluate(() => !document.getElementById("cmdk").hidden);
  log("=== 2. ⌘K 命令面板 ===");
  log(`  面板打开: ${opened}`);
  for (const t of ["差商", "有理化", "反证"]) {
    await page.evaluate(() => (document.getElementById("cmdkInput").value = ""));
    await page.type("#cmdkInput", t);
    await wait(220);
    const r = await page.evaluate(() => ({
      n: document.querySelectorAll(".cmdk-row").length,
      first: document.querySelector(".cmdk-row .cmdk-t")?.textContent,
      sub: document.querySelector(".cmdk-row .cmdk-s")?.textContent?.slice(0, 44),
      count: document.getElementById("cmdkCount")?.textContent,
    }));
    log(`  ${t.padEnd(6)} → ${r.n} 行 (count=${r.count})  首条: ${r.first}  | ${r.sub}`);
  }
  await page.close();
}

/* ---------------- 3. 背景动效 ---------------- */
{
  const page = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await wait(400);
  const sample = async () =>
    page.evaluate(() => {
      const img = document.querySelector(".bg-img");
      const w1 = document.querySelector(".wave-1");
      return {
        imgAnim: img ? getComputedStyle(img).animationName : "(无)",
        imgDur: img ? getComputedStyle(img).animationDuration : "",
        imgT: img ? getComputedStyle(img).transform : "",
        imgTr: img ? img.style.translate : "",
        waveT: w1 ? getComputedStyle(w1).transform : "",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });
  const a = await sample();
  await wait(1500);
  const b = await sample();
  log("=== 3. 背景动效 ===");
  log(`  reduced-motion=${a.reduced}  .bg-img animation=${a.imgAnim} / ${a.imgDur}`);
  log(`  呼吸动画: ${a.imgT !== b.imgT ? "在动 ✅" : "没动 ❌"}  (${a.imgT} → ${b.imgT})`);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await wait(260);
  const c = await sample();
  log(`  滚动视差: translate=${c.imgTr || "(空)"}  ${c.imgTr && c.imgTr !== "0px" ? "✅" : "❌"}`);
  log(`  水波: ${a.waveT !== b.waveT ? "在动 ✅" : "没动 ❌"}`);
  await page.close();
}

/* ---------------- 4. 弹幕墙 ---------------- */
{
  const page = await newPage();
  await page.goto(`${BASE}/danmaku/`, { waitUntil: "networkidle2" });
  await wait(1800);
  const info = await page.evaluate(() => {
    const stage = document.getElementById("dmStage");
    const field = document.getElementById("dmField");
    return {
      stageHidden: stage?.hidden,
      fieldH: field?.getBoundingClientRect().height,
      moving: field?.querySelectorAll(".dm-item").length,
      sample: field?.querySelector(".dm-item")?.textContent?.slice(0, 40),
      staticRows: document.querySelectorAll(".dm-static-row").length,
      count: document.querySelector(".dm-note-k")?.textContent?.trim(),
      toggle: document.getElementById("dmToggle")?.textContent?.trim(),
    };
  });
  log("=== 4. 弹幕墙 ===");
  log(`  ${JSON.stringify(info)}`);
  await page.close();
}

/* ---------------- 5. 知识库 ---------------- */
{
  const page = await newPage();
  await page.goto(`${BASE}/kb/`, { waitUntil: "networkidle2" });
  await wait(500);
  const info = await page.evaluate(() => {
    const nodes = document.querySelectorAll("#kbNodes .node");
    const edges = document.querySelectorAll("#kbEdges .edge");
    const t0 = nodes[0]?.querySelector("text");
    return {
      nodes: nodes.length,
      edges: edges.length,
      textFill: t0 ? getComputedStyle(t0).fill : "(无)",
      textSize: t0 ? getComputedStyle(t0).fontSize : "",
      edgeStroke: edges[0] ? getComputedStyle(edges[0]).stroke : "(无)",
      result: document.getElementById("kbResult")?.textContent?.trim(),
      cards: document.querySelectorAll("#kbCards .card:not([hidden])").length,
    };
  });
  log("=== 5. 知识库 ===");
  log(`  ${JSON.stringify(info)}`);
  // 点一个节点：相关笔记应被筛出来
  await page.evaluate(() => document.querySelector("#kbNodes .node")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await wait(220);
  const after = await page.evaluate(() => ({
    result: document.getElementById("kbResult")?.textContent?.trim(),
    cards: document.querySelectorAll("#kbCards .card:not([hidden])").length,
  }));
  log(`  点节点后: ${JSON.stringify(after)}`);
  await page.close();
}

/* ---------------- 6. 文章页连载导航 ---------------- */
{
  const page = await newPage();
  const url = `${BASE}/notes/07-夹逼三板斧/`;
  await page.goto(encodeURI(url), { waitUntil: "networkidle2" });
  await wait(300);
  const info = await page.evaluate(() => ({
    rail: !!document.querySelector(".seq-rail"),
    nums: [...document.querySelectorAll(".seq-n")].map((a) => a.textContent.trim()).join(" "),
    cur: document.querySelector(".seq-n.on")?.textContent?.trim(),
    count: document.querySelector(".seq-count")?.textContent?.trim(),
    foot: [...document.querySelectorAll(".seq-card:not(.ghost)")].map((a) => a.querySelector(".seq-card-n")?.textContent + " " + a.querySelector(".seq-card-k")?.textContent),
    tocNext: document.querySelector(".toc-next")?.textContent?.replace(/\s+/g, " ").trim(),
    tocCount: document.querySelectorAll("#tocList a[data-toc]").length,
  }));
  log("=== 6. 文章页连载导航 ===");
  log(`  ${JSON.stringify(info, null, 0)}`);
  await page.close();
}

log("=== 页面错误 ===");
log(errors.length ? errors.map((e) => "  " + e).join("\n") : "  无");

await browser.close();
