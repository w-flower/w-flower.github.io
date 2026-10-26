import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true, args: ["--disable-gpu","--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 800));

const read = async () => p.evaluate(() => {
  const open = [...document.querySelectorAll(".nav-item.open")];
  const d = document.querySelector(".nav-item.open .nav-drop") || document.querySelector(".nav-drop");
  return {
    openCount: open.length,
    label: open[0] ? open[0].querySelector("a").textContent.trim() : "",
    opacity: getComputedStyle(d).opacity,
    visibility: getComputedStyle(d).visibility,
  };
});

for (const idx of [0, 1, 4]) {
  const box = await p.evaluate((i) => {
    const a = document.querySelectorAll(".nav-item > a")[i];
    const r = a.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, idx);
  await p.mouse.move(box.x, box.y, { steps: 3 });
  await new Promise(r => setTimeout(r, 350));
  const res = await read();
  console.log("item " + idx + ":", JSON.stringify(res));
  if (idx === 0) await p.screenshot({ path: "preview/cover-drop.png" });
  await p.mouse.move(700, 500, { steps: 2 });
  await new Promise(r => setTimeout(r, 300));
}

// 离开后应关闭
console.log("离开后:", JSON.stringify(await read()));
await p.screenshot({ path: "preview/cover-1440.png" });
await b.close();
