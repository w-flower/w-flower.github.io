---
title: '附录A 三角函数：速查与推导'
date: 2026-10-21
course: '工科数学分析'
status: growing
summary: '把诱导公式、恒等变形、反三角主值与常用界集中成一张可随手查阅的速查卡。'
tags: ['三角函数', '公式']
draft: false
---

> **这张卡是做什么用的**：工科数学分析第一章里，三角函数的定义域、有界性、奇偶性、小量等价与反函数值域会反复出现。把它们集中到一张卡上，做题时随手查阅，不必每次翻回课本。
>
> **怎么用**：先记下面的六边形记忆图（它只作索引），再查各节的公式表；反三角与双曲函数按需取用。遇到发懵的式子，先用记忆图现场推一遍，推不出再查表。

## A.1 六边形记忆图

六个基本函数按顺序排在一个正六边形的顶点上：

```
                sin
                 │
        cos ────●──── tan
           │     │     │
           │     │     │
        sec ────●──── cot
                 │
                csc
```

（中间一横：cos—tan—cot—sec 一线；sin 在上，csc 在下。）

**三条读图规则**：

1. **对角线相乘 = 1**（倒数关系）：

$$
\sin\cdot\csc=1,\quad \cos\cdot\sec=1,\quad \tan\cdot\cot=1
$$

2. **带阴影的三角形顶项 = 另两项平方和**（平方关系）：

$$
\sin^2+\cos^2=1,\quad 1+\tan^2=\sec^2,\quad 1+\cot^2=\csc^2
$$

3. **相邻顶点 = 商的关系**（$\tan = \sin/\cos$，$\cot = \cos/\sin$）——这一条用来现场推导，不必死记。

**推导示范**（遇到 $\sec^2$ 发懵时）：$1+\tan^2=1+\dfrac{\sin^2}{\cos^2}=\dfrac{\cos^2+\sin^2}{\cos^2}=\dfrac1{\cos^2}=\sec^2$。六边形是索引，推导是后备手段。

## A.2 诱导公式：奇变偶不变

$k\cdot\dfrac\pi2\pm\alpha$ 的三角函数：

1. **看 $k$ 的奇偶**：$k$ 为奇数，函数名变成它的**余函数**（$\sin\leftrightarrow\cos$、$\tan\leftrightarrow\cot$、$\sec\leftrightarrow\csc$）；$k$ 为偶数，函数名不变。
2. **看终边所在象限的符号**：把 $\alpha$ 当成锐角，看 $k\cdot\dfrac\pi2\pm\alpha$ 的终边落在第几象限，按"一全正、二正弦、三正切、四余弦"定符号。

**示例**：$\sin\left(\dfrac{3\pi}{2}-\alpha\right)$：$k=3$ 奇数，$\sin\to\cos$；$\dfrac{3\pi}2-\alpha$ 在第四象限（$\alpha$ 为锐角时），正弦为负，故结果为 $-\cos\alpha$。

（用不上时整段跳过；真要用到它时，诱导公式往往是化简的唯一入口。）

## A.3 恒等变形公式组

**和差角**

$$
\sin(\alpha\pm\beta)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta
$$
$$
\cos(\alpha\pm\beta)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta
$$
$$
\tan(\alpha\pm\beta)=\frac{\tan\alpha\pm\tan\beta}{1\mp\tan\alpha\tan\beta}
$$

**倍角**

$$
\sin2\alpha=2\sin\alpha\cos\alpha,\quad \cos2\alpha=\cos^2\alpha-\sin^2\alpha=1-2\sin^2\alpha=2\cos^2\alpha-1
$$
$$
\tan2\alpha=\frac{2\tan\alpha}{1-\tan^2\alpha}
$$

**半角**

$$
\sin^2\frac\alpha2=\frac{1-\cos\alpha}{2},\quad \cos^2\frac\alpha2=\frac{1+\cos\alpha}{2},\quad \tan\frac\alpha2=\frac{1-\cos\alpha}{\sin\alpha}=\frac{\sin\alpha}{1+\cos\alpha}
$$

**第一章最高频的两条变形**（前十篇例题反复出现）：
- $1-\cos x=2\sin^2\dfrac x2$（半角公式反向）；
- $1+\cos x=2\cos^2\dfrac x2$。

**和差化积 / 积化和差**

$$
\sin\alpha+\sin\beta=2\sin\frac{\alpha+\beta}{2}\cos\frac{\alpha-\beta}{2},\quad \sin\alpha-\sin\beta=2\cos\frac{\alpha+\beta}{2}\sin\frac{\alpha-\beta}{2}
$$
$$
\cos\alpha+\cos\beta=2\cos\frac{\alpha+\beta}{2}\cos\frac{\alpha-\beta}{2},\quad \cos\alpha-\cos\beta=-2\sin\frac{\alpha+\beta}{2}\sin\frac{\alpha-\beta}{2}
$$
$$
\sin\alpha\cos\beta=\frac12\big[\sin(\alpha+\beta)+\sin(\alpha-\beta)\big],\quad \cos\alpha\sin\beta=\frac12\big[\sin(\alpha+\beta)-\sin(\alpha-\beta)\big]
$$

（和差化积可看作"裂项"思路在三角中的版本：把两个振荡量拆成"慢包络 × 快振荡"，在放缩或夹逼时先处理包络。）

## A.4 反三角函数：定义域与主值区间

| 函数 | 定义域 | 主值区间 | 图像形状 | 单调性 |
|---|---|---|---|---|
| $\arcsin x$ | $[-1,1]$ | $\left[-\dfrac\pi2,\dfrac\pi2\right]$ | 过原点，奇 | 增 |
| $\arccos x$ | $[-1,1]$ | $[0,\pi]$ | 不过原点 | 减 |
| $\arctan x$ | $\mathbb R$ | $\left(-\dfrac\pi2,\dfrac\pi2\right)$ | 水平渐近线，奇 | 增 |
| $\operatorname{arccot}x$ | $\mathbb R$ | $(0,\pi)$ | 水平渐近线 | 减 |

**恒等式**

$$
\arcsin x+\arccos x=\frac\pi2,\quad \arctan x+\operatorname{arccot}x=\frac\pi2
$$
$$
\arcsin(-x)=-\arcsin x,\quad \arctan(-x)=-\arctan x\quad(\text{奇函数})
$$
$$
\arccos(-x)=\pi-\arccos x\quad(\text{绕 }\pi\text{ 对称})
$$

**复合还原**

$$
\sin(\arcsin x)=x\ (x\in[-1,1]),\quad \tan(\arctan x)=x
$$
$$
\arcsin(\sin x)=x\ \text{仅当 }x\in\left[-\frac\pi2,\frac\pi2\right]\ (\text{主值区间外要平移!})
$$

最后一条是易错点之王：$\arcsin(\sin 3)=3-\pi$，不是 $3$。**复合函数还原只在主值区间内成立**，区间之外要先把角平移回主值区间。

**第一章用到的位置**：
- 09 篇例题 4：$\arcsin x\sim x$（换元 $u=\arcsin x$）；
- 11 篇例题 2：$\arctan\dfrac1x$ 在 0 点跳跃（左 $-\dfrac\pi2$、右 $\dfrac\pi2$）——反函数把无穷"压扁"成有限跳变。

## A.5 双曲函数

$$
\sinh x=\frac{e^x-e^{-x}}2,\quad \cosh x=\frac{e^x+e^{-x}}2,\quad \tanh x=\frac{\sinh x}{\cosh x}
$$

**恒等式**

$$
\cosh^2x-\sinh^2x=1,\quad 1-\tanh^2x=\operatorname{sech}^2x
$$
$$
\sinh(x\pm y)=\sinh x\cosh y\pm\cosh x\sinh y
$$
$$
\cosh(x\pm y)=\cosh x\cosh y\pm\sinh x\sinh y
$$

（与三角公式逐条同构，只在平方差的符号上分叉：$\sin^2+\cos^2=1$ 对应 $\cosh^2-\sinh^2=1$。）

**反双曲**

$$
\operatorname{arsinh}x=\ln\left(x+\sqrt{x^2+1}\right),\quad \operatorname{arcosh}x=\ln\left(x+\sqrt{x^2-1}\right)\ (x\ge1)
$$

**在后续的出场**：$\tanh$ 是微分方程 $y'=1-y^2$ 的解，$\sinh/\cosh$ 是悬链线方程的答案。第一章不直接使用，先存档备查。

## A.6 常用数值与界

$$
\sin x<x<\tan x\ \left(0<x<\frac\pi2\right),\quad |\sin x|\le1,\quad |\cos x|\le1
$$
$$
\sin(-x)=-\sin x,\ \cos(-x)=\cos x\ (\text{奇偶性——09 篇化归 }x\to0^-\text{ 用})
$$
$$
\sin\left(x+\frac\pi2\right)=\cos x,\quad \cos\left(x+\frac\pi2\right)=-\sin x
$$
$$
\mathrm{e}^{\mathrm{i}x}=\cos x+\mathrm{i}\sin x\ (\text{存档，复数章节用})
$$
