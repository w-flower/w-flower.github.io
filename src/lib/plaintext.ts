/**
 * markdown → 一行纯文本。
 *
 * 这份逻辑是给「搜索索引 + 结果摘要」用的，所以重点不是排版，
 * 而是两件事：
 *   1. 用户搜什么就得能命中什么。搜「δ」要能命中 \delta，
 *      搜「趋于」要能命中 \to —— 直接把反斜杠命令删掉会把公式变成空白，
 *      笔记里的公式恰恰是检索入口。
 *   2. 摘要读得懂。`\dfrac{1}{2}` 原样显示成 "dfrac12" 很难看，
 *      折成 "1/2" 才像人话。
 */

const GREEK = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ",
  epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ",
  iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", varphi: "φ",
  chi: "χ", psi: "ψ", omega: "ω", Omega: "Ω", Sigma: "Σ", Pi: "Π",
} as Record<string, string>;

const OPS = {
  to: "→", rightarrow: "→", longrightarrow: "→", Rightarrow: "⇒",
  leftrightarrow: "↔", infty: "∞", cdot: "·", cdots: "⋯", ldots: "…", dots: "…",
  times: "×", div: "÷", pm: "±", mp: "∓",
  leq: "≤", le: "≤", leqslant: "≤", geq: "≥", ge: "≥", geqslant: "≥",
  neq: "≠", ne: "≠", approx: "≈", equiv: "≡", sim: "~",
  subset: "⊂", subseteq: "⊆", supset: "⊃", supseteq: "⊇",
  in: "∈", notin: "∉", forall: "∀", exists: "∃",
  cup: "∪", cap: "∩", emptyset: "∅", varnothing: "∅",
  sqrt: "√", sum: "∑", prod: "∏", int: "∫", partial: "∂",
  quad: " ", qquad: " ", prime: "′", primes: "′",
  neg: "¬", land: "∧", lor: "∨",
} as Record<string, string>;

/* 保留原形的函数名，读起来更像数学而不是代码 */
const KEEP = new Set([
  "lim", "sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan",
  "log", "ln", "lg", "exp", "max", "min", "sup", "inf", "det", "dim", "deg",
]);

export function plainText(src = ""): string {
  let s = src;

  /* 代码块整体丢掉：里面的符号不是正文，命中它反而干扰 */
  s = s.replace(/```[\s\S]*?```/g, " ");
  /* 图片、链接、标题、引用、列表符号 */
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^\s*[-*>+|]\s+/gm, "");

  /* 分数：\dfrac{1}{2}、\frac{\partial y}{\partial x}、\frac12 三种写法都要认
     （第三种不带花括号，漏了就会出现「趋于 12」这种把 1/2 吞成 12 的错） */
  const unw = (t: string) => t.replace(/^\{/, "").replace(/\}$/, "");
  const FRAC = /\\(?:[dt]?frac|tfrac)\s*(\{[^{}]*\}|[0-9a-zA-Z])\s*(\{[^{}]*\}|[0-9a-zA-Z])/g;
  for (let i = 0; i < 3; i++) {
    s = s.replace(FRAC, (_m, a: string, b: string) => `${unw(a)}/${unw(b)}`);
  }
  /* 根号：\sqrt{x} / \sqrt2 → √x、√2 */
  s = s.replace(/\\sqrt\s*(\{[^{}]*\}|[0-9a-zA-Z])/g, (_m, a: string) => "√" + unw(a));

  /* 反斜杠命令：认识的翻译成符号，认识的小写函数名保留，其余删掉 */
  s = s.replace(/\\([a-zA-Z]+)/g, (_, name: string) => {
    if (GREEK[name]) return GREEK[name];
    if (OPS[name]) return OPS[name];
    if (KEEP.has(name)) return name;
    return " ";
  });

  /* 剩下的 LaTeX 装饰：上下标的花括号、$ 定界符、转义空格 */
  s = s.replace(/\\[,;:! ]/g, " ");
  s = s.replace(/[${}]/g, " ");

  /* markdown 强调与行内代码 */
  s = s.replace(/[*_`~]/g, "");

  return s.replace(/\s+/g, " ").trim();
}
