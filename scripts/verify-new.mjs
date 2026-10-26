// 核查 /kb/ 与 /start/ 渲染与交互
import puppeteer from "puppeteer-core";

const EXE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:4321";

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

async function open(path) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 600));
  return { page, errors };
}

const out = {};

// ---- /kb/ ----
{
  const { page, errors } = await open("/kb/");
  const nodes = await page.$$eval("#kbNodes .node", (els) => els.length);
  const edges = await page.$$eval("#kbEdges .edge", (els) => els.length);
  const cards = await page.$$eval("#kbCards .card", (els) => els.length);
  // 测试搜索过滤
  await page.type("#kbSearch", "极限");
  await new Promise((r) => setTimeout(r, 400));
  const visAfterSearch = await page.$$eval(
    "#kbCards .card",
    (els) => els.filter((e) => !e.hidden).length
  );
  // 测试点击节点选中相关
  await page.click("#kbSearch", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await new Promise((r) => setTimeout(r, 300));
  const firstNode = await page.$("#kbNodes .node");
  if (firstNode) await firstNode.click();
  await new Promise((r) => setTimeout(r, 300));
  const resultText = await page.$eval("#kbResult", (e) => e.textContent);
  out.kb = { errors, nodes, edges, cards, visAfterSearch, resultText };
  await page.close();
}

// ---- /start/ ----
{
  const { page, errors } = await open("/start/");
  const clock = await page.$eval("#clock", (e) => e.textContent);
  const tiles = await page.$$eval(".tile", (els) => els.length);
  const hello = await page.$eval("#hello", (e) => e.textContent);
  out.start = { errors, clock, tiles, hello };
  await page.close();
}

console.log(JSON.stringify(out, null, 2));
await browser.close();
