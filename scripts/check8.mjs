import puppeteer from "puppeteer-core";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const pages = ["/", "/notes/", "/snippets/", "/micro/", "/archive/", "/about/"];

for (const path of pages) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 140)));
  p.on("console", (m) => {
    if (m.type() === "error") errs.push("C: " + m.text().slice(0, 140));
  });
  await p.goto("http://127.0.0.1:4321" + path, { waitUntil: "networkidle0" });
  await sleep(800);

  const info = await p.evaluate(() => {
    const de = document.documentElement;
    const cards = [...document.querySelectorAll(".card[data-hc]")];
    return {
      overflow: de.scrollWidth > de.clientWidth + 1,
      cards: cards.length,
      visible: cards.filter((c) => !c.hidden).length,
      sideList: !!document.getElementById("sideList"),
      chips: document.querySelectorAll(".chip[data-tag]").length,
      pager: document.querySelectorAll(".pager button").length,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      search: !!document.getElementById("searchInput"),
      scrollH: de.scrollHeight,
    };
  });

  let extra = "";
  if (path === "/notes/" || path === "/snippets/" || path === "/micro/") {
    await p.evaluate(() => {
      const i = document.getElementById("searchInput");
      i.value = "的";
      i.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(350);
    const s = await p.evaluate(() => ({
      vis: [...document.querySelectorAll(".card[data-hc]")].filter((c) => !c.hidden).length,
      line: document.getElementById("resultLine")?.textContent?.trim(),
    }));
    extra = " 搜索「的」→ " + JSON.stringify(s);
    await p.evaluate(() => {
      const i = document.getElementById("searchInput");
      i.value = "";
      i.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(300);
  }

  console.log(path, JSON.stringify(info), extra, errs.length ? errs : "");
  await p.screenshot({ path: "preview/v" + path.replace(/\//g, "-") + ".png" });
  await p.close();
}

// 手机端三个列表页
for (const path of ["/notes/", "/micro/"]) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto("http://127.0.0.1:4321" + path, { waitUntil: "networkidle0" });
  await sleep(600);
  const de = await p.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    cards: document.querySelectorAll(".card[data-hc]").length,
  }));
  console.log("390 " + path, JSON.stringify(de));
  await p.screenshot({ path: "preview/m" + path.replace(/\//g, "-") + ".png" });
  await p.close();
}

await b.close();
