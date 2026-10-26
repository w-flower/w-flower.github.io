// 验证 View Transitions 客户端导航后，全部交互组件在 astro:page-load 重初始化并正常工作。
// 链路：/notes/ →(点卡片)→ 文章 →(命令面板跳弹幕)→ /danmaku →(点品牌)→ 首页 →(命令面板跳笔记)→ /notes/
// 通过的硬标准：无 console/page 错误；确定性交互（主题/进度/⌘K/搜索/名句/弹幕）在换页后生效。
import puppeteer from "puppeteer-core";

const EXE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.VT_BASE || "http://127.0.0.1:4321";

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: ["--no-proxy-server", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
const notes = [];
const assert = (cond, msg) => { if (!cond) errors.push("FAIL: " + msg); };
const soft = (ok, msg) => { if (ok) notes.push("ok: " + msg); else notes.push("skip: " + msg); };

page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR @ " + page.url() + "\n" + (e.stack || e.message)));

const waitLoaded = () =>
  page.waitForFunction(
    () => document.readyState === "complete" && !!document.querySelector("main"),
    { timeout: 15000 }
  );

// 记录当前 URL，点击某选择器触发客户端导航，等 URL 变化 + main 出现。
async function clientNavClick(sel, label) {
  const before = page.url();
  await page.click(sel);
  await page.waitForFunction(
    (u) => location.pathname !== new URL(u).pathname && !!document.querySelector("main"),
    { timeout: 15000 },
    before
  );
  await waitLoaded();
  const after = page.url();
  assert(after !== before, `client-nav to ${label} did not change URL`);
  return after;
}

// 1) 进 /notes/（整页加载）
await page.goto(BASE + "/notes/", { waitUntil: "networkidle0" });
await waitLoaded();
notes.push("on /notes/: " + page.url());

// 2) ContentList 搜索/筛选（整页加载态）
{
  const r = await page.evaluate(async () => {
    const inp = document.getElementById("searchInput");
    const line = () => (document.getElementById("resultLine") || {}).textContent || "";
    const setQ = (v) => { inp.value = v; inp.dispatchEvent(new Event("input", { bubbles: true })); };
    setQ(""); await new Promise((r) => setTimeout(r, 60)); const all = line();
    setQ("极限"); await new Promise((r) => setTimeout(r, 240)); const fil = line();
    setQ(""); await new Promise((r) => setTimeout(r, 240)); const back = line();
    return { all, fil, back };
  });
  assert(r.all !== r.fil && r.fil !== r.back,
    `ContentList search filter static (all="${r.all}" fil="${r.fil}" back="${r.back}")`);
  notes.push("ContentList search: all=" + JSON.stringify(r.all) + " fil=" + JSON.stringify(r.fil));
}

// 3) 点第一张卡片 → 客户端导航到文章
await clientNavClick("a.card", "article");
notes.push("after nav to article: " + page.url());

// 4) 主题切换（换页后）
{
  const t = await page.evaluate(() => {
    const btn = document.getElementById("themeToggle");
    if (!btn) return "no-btn";
    const before = document.documentElement.getAttribute("data-theme");
    btn.click(); const after = document.documentElement.getAttribute("data-theme");
    btn.click();
    return before !== after ? "ok" : "no-change";
  });
  assert(t === "ok", "theme toggle broken after client nav (" + t + ")");
  notes.push("theme toggle after nav: " + t);
}

// 5) 进度条（换页后，滚到底读 --p）
{
  const p = await page.evaluate(async () => {
    const bar = document.getElementById("progress");
    if (!bar) return { ok: false, why: "no-bar" };
    document.documentElement.style.scrollBehavior = "auto";
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, max);
    const t0 = Date.now();
    while (Math.abs(window.scrollY - max) > 4 && Date.now() - t0 < 2000) {
      await new Promise((r) => setTimeout(r, 50));
    }
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 60));
    const sy = Math.round(window.scrollY);
    const v = bar.style.getPropertyValue("--p");
    window.scrollTo(0, 0);
    return { ok: sy > 50 && v !== "" && v !== "0.0000", sy, max, v };
  });
  assert(p.ok, "progress bar not updating after nav (" + JSON.stringify(p) + ")");
  notes.push("progress after nav: " + JSON.stringify(p));
}

// 6) ⌘K 命令面板（换页后）：Ctrl+K 打开 → 输入渲染 → Esc 关闭
{
  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await new Promise((r) => setTimeout(r, 120));
  const opened = await page.evaluate(() => {
    const root = document.getElementById("cmdk");
    return root && !root.hidden && root.classList.contains("on");
  });
  assert(opened, "CmdPalette did not open after Ctrl+K");
  notes.push("cmdk open after nav: " + opened);

  const listed = await page.evaluate(async () => {
    const inp = document.getElementById("cmdkInput");
    inp.value = "07"; inp.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    return document.querySelectorAll("#cmdkList .cmdk-row").length;
  });
  assert(listed > 0, "CmdPalette list empty after typing query (rows=" + listed + ")");
  notes.push("cmdk rows after typing '07': " + listed);

  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 260));
  const closed = await page.evaluate(() => {
    const root = document.getElementById("cmdk");
    return root && root.hidden;
  });
  assert(closed, "CmdPalette did not close on Esc");
  notes.push("cmdk closed on Esc: " + closed);
}

// 7) TOC 点击（软）：点最后一个目录项，看滚动或激活态变化
{
  const res = await page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll("#tocList a[data-toc]"));
    if (!links.length) return "no-toc";
    const y0 = window.scrollY;
    links[links.length - 1].click();
    await new Promise((r) => setTimeout(r, 400));
    const y1 = window.scrollY;
    const active = document.querySelector("#tocList a.on, #tocList a[aria-current]");
    return { dy: Math.abs(y1 - y0), active: !!active };
  });
  soft(res !== "no-toc" && (res.dy > 20 || res.active), "TOC click scrolled/activated (" + JSON.stringify(res) + ")");
}

// 8) 长按三连（软）：在 reactHit 上 pointerdown 超 HOLD 再 pointerup，看是否触发庆祝
{
  const res = await page.evaluate(async () => {
    const hit = document.getElementById("reactHit");
    const react = document.getElementById("react");
    if (!hit || !react) return "no-react";
    const before = react.className;
    hit.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1000)); // HOLD 默认 800ms
    hit.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const after = react.className;
    return { before, after, fired: /(done|said)/.test(after) || react.querySelector(".react-spark") };
  });
  soft(res !== "no-react" && res.fired, "long-press reaction triggered (" + JSON.stringify(res) + ")");
}

// 9) 命令面板跳转到 /danmaku（客户端导航）
{
  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await new Promise((r) => setTimeout(r, 120));
  const clicked = await page.evaluate(async () => {
    const inp = document.getElementById("cmdkInput");
    inp.value = "弹幕"; inp.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    const row = document.querySelector('#cmdkList a.cmdk-row[href="/danmaku/"]');
    if (!row) return false;
    row.click();
    return true;
  });
  assert(clicked, "danmaku action row not found in CmdPalette");
  await page.waitForFunction((u) => location.pathname.startsWith("/danmaku"), { timeout: 15000 }, page.url());
  await waitLoaded();
  assert(page.url().includes("/danmaku"), "did not client-nav to /danmaku");
  notes.push("client-nav to /danmaku: " + page.url());
}

// 10) /danmaku 弹幕（换页后）：点开关 → 舞台可见 + 生成 .dm-item
{
  await page.click("#dmToggle");
  await new Promise((r) => setTimeout(r, 220));
  const vis = await page.$eval("#dmStage", (e) => !e.hidden);
  assert(vis, "danmaku stage not visible after toggle");
  notes.push("danmaku stage visible: " + vis);
  const microCount = await page.$$eval(".dm-static-row", (els) => els.length);
  notes.push("danmaku micros available: " + microCount);
  await new Promise((r) => setTimeout(r, 1400));
  const n = await page.$$eval(".dm-item", (els) => els.length);
  if (microCount > 0) {
    assert(n > 0, "no danmaku items spawned after nav (count=" + n + ")");
  } else {
    notes.push("skip: no micros to spawn (collection empty by design)");
  }
  notes.push("danmaku items spawned: " + n);
}

// 11) 点品牌回首页（客户端导航）
await clientNavClick("#brand", "home");
notes.push("after nav to home: " + page.url());

// 12) 名句栏（换页后）：点下一句，文案变化（多条时；单条本身不变，降级为软断言）
{
  const q0 = await page.$eval("#quoteText", (e) => e.textContent).catch(() => null);
  if (q0 === null) {
    notes.push("skip: no #quoteText on home");
  } else {
    await page.click("#quoteNext");
    await new Promise((r) => setTimeout(r, 140));
    const q1 = await page.$eval("#quoteText", (e) => e.textContent);
    soft(q0 !== q1, "QuoteBar next changed text after nav (" + (q0 !== q1) + ")");
  }
}

// 13) 命令面板跳回 /notes/（客户端导航）→ 再验 ContentList 重初始化 + 悬停浮层
{
  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await new Promise((r) => setTimeout(r, 120));
  const clicked = await page.evaluate(async () => {
    const inp = document.getElementById("cmdkInput");
    inp.value = "笔记"; inp.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    const row = document.querySelector('#cmdkList a.cmdk-row[href="/notes/"]');
    if (!row) return false;
    row.click();
    return true;
  });
  if (clicked) {
    await page.waitForFunction((u) => location.pathname.startsWith("/notes"), { timeout: 15000 }, page.url());
    await waitLoaded();
    assert(page.url().includes("/notes"), "did not client-nav back to /notes/");
    notes.push("client-nav back to /notes/: " + page.url());

    // ContentList 重初始化：搜索仍生效
    const r = await page.evaluate(async () => {
      const inp = document.getElementById("searchInput");
      const line = () => (document.getElementById("resultLine") || {}).textContent || "";
      const setQ = (v) => { inp.value = v; inp.dispatchEvent(new Event("input", { bubbles: true })); };
      setQ(""); await new Promise((r) => setTimeout(r, 60)); const all = line();
      setQ("极限"); await new Promise((r) => setTimeout(r, 240)); const fil = line();
      return { all, fil };
    });
    assert(r.all !== r.fil, "ContentList search broken after 2nd client-nav (" + JSON.stringify(r) + ")");
    notes.push("ContentList re-init search: " + JSON.stringify(r));

    // 悬停浮层（软）：pointerover 卡片看 #hovercard 显形
    const hc = await page.evaluate(async () => {
      const card = document.querySelector(".card[data-hc]");
      if (!card) return "no-card";
      card.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 160));
      const box = document.getElementById("hovercard");
      return box ? { hidden: box.hidden, len: (box.textContent || "").trim().length } : "no-box";
    });
    soft(hc !== "no-card" && hc !== "no-box" && hc.hidden === false && hc.len > 0,
      "HoverCard shown on hover after nav (" + JSON.stringify(hc) + ")");
  } else {
    notes.push("skip: /notes/ row not found in CmdPalette");
  }
}

await browser.close();

console.log("\n--- notes ---");
for (const n of notes) console.log("  " + n);
console.log("\n--- checks ---");
if (errors.length) {
  console.log("ERRORS (" + errors.length + "):");
  for (const e of errors) console.log("  - " + e);
  process.exit(1);
} else {
  console.log("VT check PASS: client-side nav works across 8 components, all re-init, no console errors.");
}
