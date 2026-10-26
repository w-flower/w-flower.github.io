/* 把一段文字拆成「词」序列，供逐词出现动画用。
 *
 * 为什么不用空格分词：中文正文里几乎没有空格，按空格拆等于整段一个 span，
 * 动画就退化成整段一起出现，等于没做。
 *
 * 切分规则（够用就好，不追求语言学分词）：
 *   1. 连续的拉丁字母 / 数字 / 内部符号算一个词（vector_growth、O(n log n)）
 *   2. 每个汉字单独成词 —— 逐字出现的视觉单位就是字，
 *      一次多一个字比一次蹦一整句更有节奏感，节点数也在可接受范围
 *   3. 标点、空格原样保留为独立节点，不参与动画（--i 不递增）
 * 空格用普通空格会被 HTML 折叠成宽度丢失，所以渲染成 \u00a0。
 */
export function splitWords(text: string): { t: string; i: number }[] {
  const out: { t: string; i: number }[] = [];
  const isLatin = (c: string) => /[A-Za-z0-9_\-./+\\*=<>[\]{}()#@$%&|~^]/.test(c);
  const isPunct = (c: string) => /[\s\u3000]/.test(c);

  let buf = "";
  let idx = 0;
  const flush = () => {
    if (buf) {
      out.push({ t: buf, i: idx++ });
      buf = "";
    }
  };

  for (const ch of text) {
    if (isPunct(ch)) {
      flush();
      /* 空白换成不换行空格，否则 HTML 里会被折掉，词会粘在一起 */
      out.push({ t: /\s/.test(ch) ? "\u00a0" : ch, i: -1 });
    } else if (isLatin(ch)) {
      buf += ch;
    } else {
      flush();
      out.push({ t: ch, i: idx++ });
    }
  }
  flush();
  return out;
}