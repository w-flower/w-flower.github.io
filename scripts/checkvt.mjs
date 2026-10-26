/* 验证 View Transitions 是否真的被浏览器接走。
   过渡本身截不到，所以分两段：导航前查环境条件，
   导航后（在新页面里）查落点与降级状态。 */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://127.0.0.1:4321";

const b = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const probeBefore = () => {
  const bg = document.querySelector(".bg-layer");
  let hasVtRule = false;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = Array.from(sheet.cssRules ?? []);
    } catch {
      continue;
    }
    for (const r of rules) {
      if (String(r.cssText || "").includes("view-transition-old")) {
        hasVtRule = true;
      }
    }
  }
  return {
    /* 同文档 SPA 形式是否可用（跨文档走的是另一条路，不看这个） */
    sameDocApi: typeof document.startViewTransition === "function",
    /* 跨文档开关：@view-transition { navigation: auto } 已被解析 */
    hasVtRule,
    /* 背景层有没有独立分组 —— 决定无限循环水波会不会在过渡里被冻住 */
    bgName: bg ? getComputedStyle(bg).viewTransitionName : null,
  };
};

const run = async (reduce) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  if (reduce) {
    await p.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));

  await p.goto(`${BASE}/notes/`, { waitUntil: "networkidle0" });
  const before = await p.evaluate(probeBefore);

  /* 必须抓详情页链接。导航里的「笔记」也是 /notes/ 前缀，
     用它会点到自己，看不出跨页过渡 */
  const target = await p.$eval(
    'a[href^="/notes/"]:not([href="/notes/"])',
    (a) => a.getAttribute("href")
  );
  /* 不用 waitForNavigation + click。跨文档过渡会把旧页冻结在快照上，
     CDP 的生命周期事件在过渡期间推不出来，等多久都等不到 —— 这是探针的局限，
     不是站点的问题（下面用 location.assign 绕开，新页面本身能打开就说明没崩）。 */
  await p.evaluate((t) => location.assign(t), target);
  await p.waitForFunction(() => document.readyState !== "loading", {
    timeout: 20000,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await new Promise((r) => setTimeout(r, 700));

  const after = await p.evaluate(() => ({
    landedOn: location.pathname,
    title: document.title.slice(0, 30),
    /* 导航后新页面必须还是完整的，不能因为过渡搞崩 */
    hasArticle: !!document.querySelector(".doc-title"),
    bgName: (() => {
      const bg = document.querySelector(".bg-layer");
      return bg ? getComputedStyle(bg).viewTransitionName : null;
    })(),
  }));


  return { before, target, after, reduce, errs };
};

console.log(JSON.stringify([await run(false), await run(true)], null, 2));
await b.close();