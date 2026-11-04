/* ============================================================
   开屏动画 · 时间轴 v2
   ------------------------------------------------------------
   这个文件只做三件事：
     1. 把字标写进 DOM（站名来自 #boot[data-wordmark]）
     2. 按毫秒推进三个状态类：playing → settled → gone
     3. 收尾移除节点并广播 boot:done

   视觉全在 splash.css 里。整套只有一条动作线，
   改节奏只改 BEATS；?speed= 会同时缩放 JS 时间点和 CSS 时长。
   ============================================================ */

(function () {
  const BEATS = [
    // t: 相对开播的毫秒数；hook: 到点要做的事
    { t: 0, hook: () => enter() },
    { t: 700, hook: () => root.classList.add("ready") },
    { t: 1700, hook: () => root.classList.add("settled") },
    { t: 2900, hook: () => root.classList.add("gone") },
    { t: 3700, hook: () => done() },
  ];

  const root = /** @type {HTMLElement|null} */ (document.getElementById("boot"));
  if (!root) return;

  const wordEl = root.querySelector(".bt-word");
  const skipEl = root.querySelector(".bt-skip");

  let timers = [];
  let speed = 1; // 播放倍速，?speed=2 表示快进一倍
  let started = false;

  const qs = new URLSearchParams(location.search);
  const qSpeed = qs.get("speed");
  if (qSpeed) speed = Math.max(0.25, Math.min(3, Number(qSpeed) || 1));

  // CSS 用 --sp 缩放所有 transition，JS 用同一个倍率缩放时间点。
  // speed 是「播放快慢」，sp 是「时长倍率」，互为倒数。
  const sp = 1 / speed;
  root.style.setProperty("--sp", String(sp));
  const at = (ms, fn) => timers.push(setTimeout(fn, ms * sp));

  /* 入场：必须在下一帧再加 playing，否则浏览器把初始态和终态
     压成同一次样式计算，transition 根本不会跑。 */
  function enter() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("playing"));
    });
  }

  function done() {
    clearTimers();
    root.remove();
    document.body.classList.remove("boot-lock");
    document.dispatchEvent(new CustomEvent("boot:done"));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* 跳过：直接进交接，不等时间轴 */
  function skip() {
    clearTimers();
    root.classList.add("settled", "gone");
    timers.push(setTimeout(done, 780 * sp));
  }

  function play() {
    if (started) return;
    started = true;
    document.body.classList.add("boot-lock");

    // 站名走 data-*，接 Astro 时从 src/copy.ts 注入即可
    if (wordEl) wordEl.textContent = root.dataset.wordmark || "DHUA";

    // 系统开了「减少动态效果」：transition 已在 CSS 里全部归零，
    // 这里直接给静态画面，停一下再淡出。
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("playing", "settled", "ready");
      timers.push(setTimeout(() => root.classList.add("gone"), 320));
      timers.push(setTimeout(done, 1080));
      return;
    }

    BEATS.forEach((b) => at(b.t, b.hook));
  }

  skipEl && skipEl.addEventListener("click", skip);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") skip();
  });

  window.BootSplash = {
    play,
    skip,
    setSpeed: (v) => {
      speed = Math.max(0.25, Math.min(3, Number(v) || 1));
      root.style.setProperty("--sp", String(1 / speed));
    },
  };

  play();
})();
