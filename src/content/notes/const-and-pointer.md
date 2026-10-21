---
title: const 和指针怎么读才不会搞混
date: 2026-10-21
course: C++ 程序设计
status: growing
draft: false
---

## 规则只有一个

**从右往左读，const 修饰它左边紧挨着的那个东西。**

```cpp
const int* p;        // p 是 pointer to int const —— 指向常量的指针
int* const p;        // p 是 const pointer to int —— 常量指针
const int* const p;  // 两个都不可变
```

第二种情况下没有 `const int` 的写法也能写成 `int const *`，效果跟 `const int *` 完全一样。所以别靠"const 在前面还是后面"判断，靠它挨着谁。

## 实际能改什么

| 声明 | 改 `p` | 改 `*p` |
|---|---|---|
| `const int* p` | 可以 | 不行 |
| `int* const p` | 不行 | 可以 |
| `const int* const p` | 不行 | 不行 |

## 一个容易漏的点

`const` 在函数参数里的位置决定了函数能不能接收非 const 实参：

```cpp
void f(const int* p);  // 能接 int*，也能接 const int*
void g(int* p);        // 只能接 int*
```

所以"只读参数"一律加 `const`，不然调用方会被限制住。

## 什么时候真的要用 `int* const`

极少。常见场景是类成员里存一个固定指向的指针：

```cpp
class Holder {
  int* const target_;  // 构造后不能再指向别处，但能改指向的值
public:
  explicit Holder(int* t) : target_(t) {}
};
```

## 记忆锚点

不用背三种，只背一句：**const 管它左边的东西**。`const int*` 例外，是因为没有 `int const *` 这种普遍写法时，`const` 跑到最前面去了，它管的还是 `int`。

> 这条容易记混的地方在于 `const` 在类型名左边时管的是类型本身，不在左边时管的是左边紧邻的 `*`。
