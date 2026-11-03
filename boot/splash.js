/* ============================================================
   开屏动画 · 时间轴
   ------------------------------------------------------------
   这个文件只做三件事：
     1. 按毫秒推进「幕」（往 #boot 上写 data-act）
     2. 打字机 / 十六进制读数 / 进度条这些细碎读数
     3. 收尾：洗白 → 机位后撤 → 移除节点并广播 boot:done

   不碰样式。所有视觉都在 splash.css 里，改节奏只改下面的 BEATS。
   ============================================================ */

(function () {
  /* 完整版：给验收看，每一幕都留够时间
     短版：真正挂到站点上用的节奏，约 3.3 秒演完 */
  const BEATS_FULL = [
    // t: 相对开播的毫秒数；act: 幕号；hook: 到点顺手做的事
    { t: 0, act: 1 },
    { t: 1500, act: 2, hook: () => lock() },
    { t: 2700, act: 3, hook: () => type() },
    { t: 4250, act: 4 },
    { t: 5000, act: 5, hook: () => bloom() },
    { t: 5400, hook: () => wash() },
    { t: 5780, hook: () => done() },
  ];

  const BEATS_QUICK = [
    { t: 0, act: 1 },
    { t: 620, act: 2, hook: () => lock() },
    { t: 1120, act: 3, hook: () => type() },
    { t: 1760, act: 4 },
    { t: 2140, act: 5, hook: () => bloom() },
    { t: 2540, hook: () => wash() },
    { t: 2680, hook: () => done() },
  ];

  const root = /** @type {HTMLElement|null} */ (document.getElementById("boot"));
  if (!root) return;

  const enEl = root.querySelector(".bt-en");
  const barEl = root.querySelector(".bt-bar i");
  const hexEl = root.querySelector(".bt-hex");
  const skipEl = root.querySelector(".bt-skip");

  const SUBTITLE =
    "LIMIT · SEQUENCE · CONTINUITY · <i>ARCHIVE READY</i>";
  const BAR = { 1: 18, 2: 34, 3: 78, 4: 100 };

  let timers = [];
  let hexTimer = 0;
  let speed = 1;
  let quick = false;
  let started = false;

  /* ?speed=0.5 放慢看细节，?speed=2 快进；?mode=quick 走短版 */
  const qs = new URLSearchParams(location.search);
  const qSpeed = qs.get("speed");
  if (qSpeed) speed = Math.max(0.25, Math.min(3, Number(qSpeed) || 1));
  quick = qs.get("mode") === "quick";

  const at = (ms, fn) => timers.push(setTimeout(fn, ms / speed));

  function setBar(pct) {
    if (barEl) barEl.style.width = pct + "%";
  }

  /* 十六进制瀑布：每 120ms 往上顶一行，只留 12 行 */
  function startHex() {
    const line = () =>
      Array.from({ length: 3 }, () =>
        Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0").toUpperCase()
      ).join(" ");
    const push = () => {
      if (!hexEl) return;
      hexEl.appendChild(document.createTextNode(line() + "\n"));
      while (hexEl.childNodes.length > 12) hexEl.removeChild(hexEl.firstChild);
    };
    for (let i = 0; i < 12; i++) push(); // 先铺满，免得开场是一片空白
    hexTimer = setInterval(push, 120 / speed);
  }

  /* 锁定：准星收一下，进度跳到 34 */
  function lock() {
    root.classList.add("locked");
    setTimeout(() => root.classList.remove("locked"), 340);
    setBar(BAR[2]);
    startHex();
  }

  /* 打字机：逐字出英文副标 */
  function type() {
    if (!enEl) return;
    enEl.innerHTML = "";
    const raw = SUBTITLE;
    // 把 <i> 当普通字符流处理太麻烦，这里拆成「文本段 + 高亮段」顺序打
    const parts = raw.split(/(<i>.*?<\/i>)/g).filter(Boolean);
    let pi = 0;
    let ci = 0;
    const tick = () => {
      if (pi >= parts.length) return;
      const seg = parts[pi];
      const isTag = seg.startsWith("<i>");
      const text = isTag ? seg.replace(/<\/?i>/g, "") : seg;
      if (ci === 0) {
        const span = document.createElement(isTag ? "i" : "span");
        enEl.appendChild(span);
      }
      const host = enEl.lastElementChild;
      if (host) host.textContent += text[ci] || "";
      ci++;
      if (ci >= text.length) {
        pi++;
        ci = 0;
      }
      at(quick ? 16 : 26, tick);
    };
    tick();
  }

  /* 过曝：白闪 + 机位后撤同时起。
     白只涨不落 —— 落了就会露出下面还没盖住的暗场，中间那帧是脏灰。 */
  function bloom() {
    setBar(100);
    root.classList.add("handoff");
    document.body.classList.remove("boot-lock");
  }

  /* 落纸：白闪之上再盖一层站点底色，屏幕沉下去，不再是最亮的白 */
  function wash() {
    root.classList.add("wash");
  }

  /* 收尾：摘掉节点、广播事件 */
  function done() {
    clearInterval(hexTimer);
    timers.forEach(clearTimeout);
    root.classList.add("gone");
    setTimeout(() => {
      root.remove();
      document.dispatchEvent(new CustomEvent("boot:done"));
    }, 520);
  }

  /* 跳过：0.4 秒内直接演完最后两幕 */
  function skip() {
    timers.forEach(clearTimeout);
    timers = [];
    root.dataset.act = "5";
    setBar(100);
    root.classList.add("wash");
    setTimeout(() => root.classList.add("handoff"), 60);
    setTimeout(() => document.body.classList.remove("boot-lock"), 60);
    setTimeout(done, 420);
  }

  function play() {
    if (started) return;
    started = true;
    document.body.classList.add("boot-lock");
    if (quick) root.classList.add("quick");

    // 系统开了「减少动态效果」：不演，直接 0.5 秒淡出
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.act = "5";
      setBar(100);
      setTimeout(() => {
        root.classList.add("gone");
        document.body.classList.remove("boot-lock");
        setTimeout(() => {
          root.remove();
          document.dispatchEvent(new CustomEvent("boot:done"));
        }, 520);
      }, 250);
      return;
    }

    (quick ? BEATS_QUICK : BEATS_FULL).forEach((b) => {
      at(b.t, () => {
        /* 只有带幕号的节拍才写 data-act。
           写成 String(b.act || "") 会在落纸/收尾时把幕号清空，
           整个第 5 幕的样式（过曝、场景可见性）会当场失效。 */
        if (b.act) root.dataset.act = String(b.act);
        if (BAR[b.act]) setBar(BAR[b.act]);
        if (b.hook) b.hook();
      });
    });
    at(700, () => root.classList.add("ready"));
    at(1200, () => root.classList.add("peak"));
    at(3400, () => root.classList.remove("peak"));
  }

  skipEl && skipEl.addEventListener("click", skip);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") skip();
  });

  // 暴露给页面：?speed=2 可以放慢/加快看效果
  window.BootSplash = {
    play,
    skip,
    setSpeed: (v) => {
      speed = Math.max(0.25, Math.min(3, v));
    },
  };

  play();
})();
