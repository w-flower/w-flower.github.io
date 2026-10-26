/** 给评论区拍图（明 / 暗），用于报告和配色自查 */
import puppeteer from "puppeteer-core";

const BASE = "http://127.0.0.1:4323";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-proxy-server", "--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1120, height: 900, deviceScaleFactor: 2 });
await page.goto(encodeURI(BASE + "/notes/07-夹逼三板斧/"), { waitUntil: "networkidle2" });
await wait(500);

const fill = async (nick, body) => {
  await page.evaluate(
    ([n, b]) => {
      document.getElementById("cmtNick").value = n;
      document.getElementById("cmtBody").value = b;
      document.getElementById("cmtBody").dispatchEvent(new Event("input", { bubbles: true }));
    },
    [nick, body]
  );
  await page.click("#cmtSend");
  await wait(650);
};

const theme = async (t) => {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch (e) {}
  }, t);
  await wait(350);
};

const shoot = async (name) => {
  /* 用整页截图 + 裁剪，而不是 element.screenshot：
     评论区里有 backdrop-filter，元素级截图会把毛玻璃那一层单独合出来，
     颜色整体发灰，看着像对比度坏了（其实页面是好的）。 */
  await page.evaluate(() => {
    /* 入场的淡入是 transition，截图会正好卡在半透明的那一帧，
       看起来像「对比度坏了」。截图前直接把它关掉。 */
    const kill = document.createElement("style");
    kill.textContent =
      "[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}";
    document.head.appendChild(kill);
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in"));
    document.getElementById("comments").scrollIntoView({ block: "start" });
  });
  await wait(350);
  const box = await page.evaluate(() => {
    const r = document.getElementById("comments").getBoundingClientRect();
    return { x: r.x, y: r.y + window.scrollY, w: r.width, h: Math.min(r.height, 1500) };
  });
  await page.screenshot({
    path: name,
    clip: { x: box.x, y: box.y, width: box.w, height: box.h },
    captureBeyondViewport: true,
  });
  console.log("saved", name);
};

await theme("light");
await fill("小林", "夹逼组构造那三类手法的判别顺序，比我课本上的写法清楚多了。");
await fill("", "想问一下：02 里那个映射的定义，和后面 11 讲连续的定义是同一套语言吗？");
await theme("dark");
await shoot("_cmt-public-dark.png");

await theme("light");
await shoot("_cmt-public-light.png");

/* 私密串：换到私密 tab，发一条，再以站长身份回复 */
await page.evaluate(() => document.querySelector('.cmt-tab[data-vis="private"]').click());
await wait(250);
await fill("鹿", "私密留言：第三章什么时候更？夹逼那篇的后半段我还没吃透。");
await page.evaluate((p) => {
  document.getElementById("cmtPass").value = p;
  document.getElementById("cmtPassGo").click();
}, process.env.MOCK_PASS || "test-pass");
await wait(300);
await page.evaluate(() => document.querySelector(".cmt-reply-btn")?.click());
await wait(250);
await page.evaluate(() => {
  const ta = document.querySelector(".cmt-reply-form textarea");
  if (!ta) return;
  ta.value = "收到。第三章在写，先把一致连续收干净。这条只有你和我说得上话。";
  document.querySelector(".cmt-reply-form .primary").click();
});
await wait(900);
await shoot("_cmt-private-light.png");

await browser.close();
