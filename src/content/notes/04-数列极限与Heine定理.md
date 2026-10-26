---
title: '04 数列极限与 Heine 定理：用归结原则把函数极限翻译成数列极限'
date: 2026-10-11
course: '工科数学分析'
status: growing
summary: '数列极限的 ε-N 定义、Heine 定理如何把函数极限归结成数列极限，以及用两列点证极限不存在的套路。'
tags: ['极限', '数列']
draft: false
---

数列极限是整章的地基，函数极限的定义和它同构。这一篇先把数列极限的定义立住，再引出 Heine 定理——它把"函数极限存不存在"完全翻译成"数列极限存不存在"，于是证不存在只要找两列点，不必去碰 $\delta$。

## 一、数列极限的 $\varepsilon$-$N$ 定义

**定义**：设 $\{x_n\}$ 为数列，$a$ 为定数。若
$$
\forall\varepsilon>0,\ \exists N\in\mathbb{N}^+,\ \text{s.t.}\ \forall n>N:\ |x_n-a|<\varepsilon,
$$
则称 $\{x_n\}$ 收敛于 $a$，记 $\lim\limits_{n\to\infty}x_n=a$ 或 $x_n\to a$。
有极限的数列叫**收敛数列**，否则叫**发散数列**。

和函数极限对照，本质就是自变量从"连续的 $x$"换成了"离散的 $n$"：

| | 函数 $x\to x_0$ | 数列 $n\to\infty$ |
|---|----------------|------------------|
| 自变量约束 | $0<\|x-x_0\|<\delta$ | $n>N$ |
| 精度 | 任意 $\varepsilon>0$ | 任意 $\varepsilon>0$ |
| 结论句 | $\|f(x)-A\|<\varepsilon$ | $\|x_n-a\|<\varepsilon$ |

**几何读法**：$a$ 的任意 $\varepsilon$-邻域**外面只落得下有限项**——收敛就是尾巴整体进袋，只有有限个调皮鬼在袋外。

> 【易错】"只有有限项在袋外"是收敛的等价刻画，也是下面柯西准则证明的直觉来源：发散 = 对某个 $\varepsilon_0$，**无穷多项**在袋外。

## 二、Heine 定理（归结原则）

**定理**：$\lim\limits_{x\to x_0}f(x)=A$ 的充要条件是：对**任意**满足 $x_n\to x_0$ 且 $x_n\neq x_0$ 的数列 $\{x_n\}$，都有
$$
\lim_{n\to\infty}f(x_n)=A.
$$

**证明**：

**必要性**（$\Rightarrow$）：设 $\lim\limits_{x\to x_0}f(x)=A$，任取 $x_n\to x_0\ (x_n\neq x_0)$。
1. 由函数极限定义，$\forall\varepsilon>0,\ \exists\delta>0:\ 0<\|x-x_0\|<\delta\Rightarrow\|f(x)-A\|<\varepsilon$；
2. 由 $x_n\to x_0$，对上述 $\delta>0$，$\exists N:\ n>N\Rightarrow0<\|x_n-x_0\|<\delta$；
3. 两步接上：$n>N\Rightarrow\|f(x_n)-A\|<\varepsilon$，即 $f(x_n)\to A$。$\blacksquare$

**充分性**（$\Leftarrow$，反证）：设 $\lim\limits_{x\to x_0}f(x)\neq A$。由第 03 篇否定式，
$$
\exists\varepsilon_0>0,\ \forall\delta>0,\ \exists x:0<|x-x_0|<\delta,\ |f(x)-A|\ge\varepsilon_0.
$$
对每个 $n$，取 $\delta=\dfrac1n$，得 $x_n$ 满足 $0<\|x_n-x_0\|<\dfrac1n$ 且 $\|f(x_n)-A\|\ge\varepsilon_0$。于是 $x_n\to x_0$、$x_n\neq x_0$，但 $f(x_n)\not\to A$。与题设矛盾。$\blacksquare$

## 三、两个推论（证不存在的固定套路）

**推论 1**：若能找到**一列** $x_n\to x_0\ (x_n\neq x_0)$ 使 $f(x_n)\not\to A$，则 $\lim\limits_{x\to x_0}f(x)$ 不存在。

**推论 2**：若能找到**两列** $x_n,\ x_n'$，都 $\to x_0$ 且 $\neq x_0$，但
$$
\lim_{n\to\infty}f(x_n)\neq\lim_{n\to\infty}f(x_n'),
$$
则 $\lim\limits_{x\to x_0}f(x)$ 不存在。

> 【判断树】**拿到"证 $\lim$ 不存在"**：
> 1. 先想单侧（$\infty$ 想 $\pm\infty$）——两侧不等，完；
> 2. 再想 Heine 推论 2：构造两列点，函数值奔向不同数——这是振荡型（$\sin(1/x)$、$\cos(1/x)$）的标准手法；
> 3. 都不行，才用否定式硬构造 $\varepsilon_0$（第 03 篇例 3 那种，单调型函数适用）。

## 四、例题（经典反例）

### 例题 1　证 $\lim\limits_{x\to 0}\cos\dfrac1x$ 不存在

**证明**：取两列：
$$
x_n=\frac{1}{2n\pi},\qquad x_n'=\frac{1}{\left(2n+\frac12\right)\pi},\qquad n=1,2,\dots
$$
- 两列都 $\to0$ 且不为 0；
- $f(x_n)=\cos(2n\pi)=1\Rightarrow f(x_n)\to1$；
- $f(x_n')=\cos\left(2n\pi+\dfrac{\pi}{2}\right)=0\Rightarrow f(x_n')\to0$。

两列函数值极限 $1\neq0$，由推论 2，原极限不存在。$\blacksquare$

> 这题和 $\sin\dfrac1x$ 是双胞胎。记住取点姿势：**取 $\cos$ 的周期点列**（$2n\pi$）和**零点列**（$(2n+\frac12)\pi$），都天然收敛到 0。

### 例题 2（函数与数列的互译）Heine 定理的正确用法边界

- 用 Heine 证**存在**：必须验证**任意**数列——没人这么干，太笨；
- 用 Heine 证**不存在**：只需**存在**两列——这才是它的主战场；
- 所以 Heine 定理的正确打开方式是：**它是为"证不存在"而生的**。

## 五、遗留问题

Heine 给了"证不存在"的利器，但"算出来"还是没解决。下一篇装配计算工具：四则运算、复合函数换元的合法性证明、以及一个被低估的推论（商的极限 $\Rightarrow$ 分子的极限）。
