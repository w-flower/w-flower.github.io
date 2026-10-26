/* 验证 ⌘K 命令面板 + 弹幕墙：
   面板：唤起/关闭、键盘选中、空态、多词匹配、命中高亮、跳转、reduce
   弹幕：默认暂停、点开始才动、reduce 下降级为静态列表 */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://127.0.0.1:4321";

const b = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const open = async (path, reduce) => {
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
  await p.goto(BASE + path, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  return { p, errs };
};

const snap = (p) =>
  p.evaluate(() => {
    const root = document.getElementById("cmdk");
    const rows = Array.from(
      document.querySelectorAll(".cmdk-row")
    ).map((el) => ({
      t: el.querySelector(".cmdk-t")?.textContent?.slice(0, 26),
      href: el.getAttribute("href"),
      on: el.classList.contains("on"),
      hits: el.querySelectorAll(".cmdk-hit").length,
    }));
    return {
      hidden: root?.hidden,
      on: root?.classList.contains("on"),
      focused: document.activeElement?.id,
      rowCount: rows.length,
      rows: rows.slice(0, 5),
      emptyVisible: !document.getElementById("cmdkEmpty")?.hidden,
      emptyText: document.getElementById("cmdkEmpty")?.textContent,
      bodyOverflow: document.documentElement.style.overflow,
    };
  });

const out = {};

/* ---- 1. ⌘K 唤起 + 空态 ---- */
{
  const { p, errs } = await open("/", false);
  out.closed = await snap(p);
  await p.keyboard.down("Control");
  await p.keyboard.press("KeyK");
  await p.keyboard.up("Control");
  await new Promise((r) => setTimeout(r, 400));
  out.opened = await snap(p);

  /* ---- 2. 搜索 + 高亮 ---- */
  await p.type("#cmdkInput", "指针");
  await new Promise((r) => setTimeout(r, 300));
  out.search = await snap(p);

  /* ---- 3. 键盘选中 ---- */
  await p.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 200));
  out.afterDown = await snap(p);
  await p.keyboard.press("ArrowUp");
  await new Promise((r) => setTimeout(r, 200));
  out.afterUp = await snap(p);

  /* ---- 4. 多词 AND ---- */
  await p.evaluate(() => {
    const i = document.getElementById("cmdkInput");
    i.value = "";
    i.dispatchEvent(new Event("input"));
  });
  await p.type("#cmdkInput", "树 插入");
  await new Promise((r) => setTimeout(r, 300));
  out.multiTerm = await snap(p);

  /* ---- 5. 空态 ---- */
  await p.evaluate(() => {
    const i = document.getElementById("cmdkInput");
    i.value = "zzzz不存在";
    i.dispatchEvent(new Event("input"));
  });
  await new Promise((r) => setTimeout(r, 300));
  out.noHit = await snap(p);

  /* ---- 6. Esc 关闭 ---- */
  await p.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 400));
  out.afterEsc = await snap(p);

  out.cmdkErrs = errs;
  await p.close();
}

/* ---- 7. 回车跳转 ---- */
{
  const { p, errs } = await open("/", false);
  await p.keyboard.down("Control");
  await p.keyboard.press("KeyK");
  await p.keyboard.up("Control");
  await new Promise((r) => setTimeout(r, 350));
  await p.type("#cmdkInput", "红黑树");
  await new Promise((r) => setTimeout(r, 300));
  const first = await p.$eval(".cmdk-row", (el) => el.getAttribute("href"));
  await p.evaluate((h) => (location.href = h), first);
  await p.waitForFunction(() => document.readyState !== "loading", {
    timeout: 20000,
  });
  await new Promise((r) => setTimeout(r, 600));
  out.jump = {
    target: first,
    landed: await p.evaluate(() => location.pathname),
    ok: await p.evaluate(() => !!document.querySelector(".doc-title")),
  };
  out.jumpErrs = errs;
  await p.close();
}

/* ---- 8. 弹幕墙 ---- */
{
  const { p, errs } = await open("/danmaku/", false);
  out.danmaku = await p.evaluate(() => ({
    stageHidden: document.getElementById("dmStage")?.hidden,
    paused: document.getElementById("dmField")?.dataset.paused,
    itemsBefore: document.querySelectorAll(".dm-item").length,
    btn: document.getElementById("dmToggle")?.textContent?.trim(),
    staticRows: document.querySelectorAll(".dm-static-row").length,
  }));
  await p.click("#dmToggle");
  await new Promise((r) => setTimeout(r, 900));
  out.danmakuRunning = await p.evaluate(() => ({
    items: document.querySelectorAll(".dm-item").length,
    btn: document.getElementById("dmToggle")?.textContent?.trim(),
    moved: Array.from(document.querySelectorAll(".dm-item")).some(
      (el) => el.style.transform && el.style.transform !== "none"
    ),
  }));
  await p.screenshot({ path: "D:/Projects/blog/scripts/_v8-danmaku.png" });
  /* 暂停后不该再增加 */
  await p.click("#dmToggle");
  await new Promise((r) => setTimeout(r, 400));
  const afterPause = await p.evaluate(
    () => document.querySelectorAll(".dm-item").length
  );
  await new Promise((r) => setTimeout(r, 1400));
  out.danmakuPaused = {
    afterPause,
    later: await p.evaluate(
      () => document.querySelectorAll(".dm-item").length
    ),
  };
  out.danmakuErrs = errs;
  await p.close();
}

/* ---- 9. 弹幕墙 reduce 降级 ---- */
{
  const { p, errs } = await open("/danmaku/", true);
  out.danmakuReduce = await p.evaluate(() => ({
    stageHidden: document.getElementById("dmStage")?.hidden,
    fallbackShown: !document.getElementById("dmFallback")?.hidden,
    staticRows: document.querySelectorAll(".dm-static-row").length,
  }));
  out.dmReduceErrs = errs;
  await p.close();
}

console.log(JSON.stringify(out, null, 2));
await b.close();