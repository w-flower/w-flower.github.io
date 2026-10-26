/* 验证长按三连：
   1. 短按（松太早）→ 环退回起点，不触发完成
   2. 长按够 HOLD → .done + .starred + 感谢语出现 + 复制成功
   3. 刷新后仍显示已收藏（localStorage 生效）
   4. 键盘按住空格同样能触发
   5. 减少动效下功能不受影响（无粒子但状态照给） */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://127.0.0.1:4321/notes/const-and-pointer/";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});
const out = {};

const open = async (reduce) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  if (reduce) {
    await p.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await p.goto(URL, { waitUntil: "networkidle0" });
  /* 必须用 instant：html 上有 scroll-behavior: smooth，
     平滑滚动途中采的坐标，mouse.down 就会落到旧位置上 */
  await p.evaluate(() => {
    document
      .getElementById("react")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 700));
  return p;
};

const state = (p) =>
  p.evaluate(() => {
    const r = document.getElementById("react");
    const ring = document.getElementById("ringFg");
    return {
      done: r?.classList.contains("done"),
      starred: r?.classList.contains("starred"),
      holding: r?.classList.contains("holding"),
      cheer: document.getElementById("reactCheer")?.textContent?.trim(),
      offset: Number(ring?.style.strokeDashoffset || -1).toFixed(1),
      ls: localStorage.getItem("starred"),
      sparks: document.querySelectorAll(".react-spark").length,
    };
  });

/* ---- 正常：短按取消 ---- */
{
  const p = await open(false);
  const box = await p.$eval("#reactHit", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.move(box.x, box.y);
  await p.mouse.down();
  await new Promise((r) => setTimeout(r, 180)); // 远不到 800ms
  const mid = await state(p);
  await p.mouse.up();
  await new Promise((r) => setTimeout(r, 500));
  out.shortPress = { midHolding: mid.holding, after: await state(p) };
  await p.close();
}

/* ---- 正常：长按完成 ---- */
{
  const p = await open(false);
  const box = await p.$eval("#reactHit", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.move(box.x, box.y);
  await p.mouse.down();
  await new Promise((r) => setTimeout(r, 420));
  out.duringHold = await state(p);
  await new Promise((r) => setTimeout(r, 700));
  await p.mouse.up();
  await new Promise((r) => setTimeout(r, 500));
  out.longPress = await state(p);
  await p.screenshot({ path: "D:/Projects/blog/scripts/_v7-react.png" });

  /* 刷新后收藏还在吗 */
  await p.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  out.afterReload = await state(p);
  await p.close();
}

/* ---- 减少动效：功能不受影响 ---- */
{
  const p = await open(true);
  await p.focus("#reactHit");
  await p.keyboard.down(" ");
  await new Promise((r) => setTimeout(r, 1000));
  await p.keyboard.up(" ");
  await new Promise((r) => setTimeout(r, 400));
  out.reduceMotion = await state(p);
  await p.close();
}

console.log(JSON.stringify(out, null, 2));
await browser.close();