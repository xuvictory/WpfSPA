---
title: Lambda 表达式
section: 00-prelude
parent: 委托与事件
---

# Lambda 表达式

> [!plain] 白话理解
> Lambda 表达式就是"迷你匿名方法"——不需要给它起名字、不需要写 `return`（有时）、不需要写参数类型（大多时候）。`(x, y) => x + y` 就是"吃两个数、返回它们的和"的迷你方法。它是 LINQ 的燃料（`list.Where(x => x > 0)`）、是事件处理器的首选写法（`button.Click += (s, e) => ...`）、是你日常写 C# 最常打出的 `=>`。上位机代码里到处都是它——从简单回调到复杂数据转换。

> [!def] 官方定义
> Lambda 表达式是定义匿名函数的简写语法。由 `=>`（Lambda 运算符）分隔参数列表和表达式体：
> - 表达式 Lambda：`(params) => expression`
> - 语句 Lambda：`(params) => { statements; }`
> - 空参数：`() => DoSomething()`
> - 编译器将 Lambda 转为委托或表达式树（`Expression<T>`）

> [!origin] 由来背景
> Lambda 演算（λ-calculus）是 1936 年图灵奖得主阿隆佐·邱奇发明的数学模型。C# 3.0（2007年）把这一古老理论变成了工业语言中最出彩的语法。没有 Lambda 就没有 LINQ，没有 LINQ 就没有现代 C#。

> [!essentials] 核心要点
> - `x => x * 2`：最简形式
> - `(x, y) => x + y`：多参数加括号
> - `() => DateTime.Now`：无参数
> - `(int x) => x.ToString("X")`：可显式类型
> - 语句 Lambda：`x => { int r = x * 2; return r; }`（多条语句加 `{}`和`return`）
> - 闭包：Lambda 可捕获外层变量

> [!example] 完整示例
> ```csharp
> // ====== 各种 Lambda ======
> Func<int, int> square = x => x * x;
> Func<int, int, int> multiply = (a, b) => a * b;
> Action<string> log = msg => Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] {msg}");
> Predicate<int> isEven = n => n % 2 == 0;

> // ====== 语句 Lambda ======
> Func<double, string> classifyTemp = t =>
> {
>     if (t > 80) return "🔴高温";
>     if (t > 60) return "🟡偏高";
>     return "🟢正常";
> };

> // ====== LINQ 中的 Lambda ======
> var values = new[] { 85.5, 78.2, 92.1, 65.0 };
> var hotValues = values.Where(v => v > 80);
> var formatted = values.Select(v => $"{v:F1}℃");

> // ====== 闭包：捕获外层变量 ======
> double threshold = 80;
> Func<double, bool> isOverThreshold = v => v > threshold;
> Console.WriteLine(isOverThreshold(85)); // True
> threshold = 90;
> Console.WriteLine(isOverThreshold(85)); // False（捕获的是变量引用！）

> // ====== 上位机实战 ======
> // 事件订阅用 Lambda
> temperatureSensor.OnAlarm += (s, e) => 
>     Console.WriteLine($"告警: {e.Temperature}℃ > 阈值");

> // 配置校验用 Lambda  
> var validPorts = new[] { 502, 8080, 102 };
> bool isValidPort = validPorts.Any(p => p == 502);

> // 数据转换用 Lambda
> var calibration = (double raw) => raw * 5.0 / 1023.0 - 0.5;
> ```

> [!scene] 适用场景
> ✅ LINQ 查询（`.Where(x => x > 0)`）
> ✅ 事件订阅简短处理
> ✅ 回调函数、数据转换
> ❌ Lambda 超过 5 行 → 抽成正则方法

> [!pitfall] 常见踩坑
> 坑 1：**闭包陷阱** → `for` 循环中捕获循环变量（C# 5 已修复 `foreach` 的此问题，`for` 仍有）
> 坑 2：**语句 Lambda 用 `{}` 后必须 `return`** → 忘写 return 编译不过

> [!best] 最佳实践
> - Lambda 体尽量短（≤3行）
> - 利用类型推断省略参数类型
> - 闭包小心捕获的变量被外部修改

> [!practice] 上手练习
> **Lv.1**：用各种 Lambda 写法实现简单功能
> **Lv.2**：用 Lambda + LINQ 实现数据筛选和转换
> **Lv.3**：闭包实验——观察捕获变量被修改的影响

> [!related] 相关知识链接
> - ← delegate、Action/Func
> - ⇄ 关联概念：LINQ、表达式树
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/operators/lambda-expressions
