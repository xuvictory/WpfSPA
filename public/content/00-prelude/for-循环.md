---
title: for 循环
section: 00-prelude
parent: 流程控制
---

# for 循环

> [!plain] 白话理解
> `for` 循环就是"把同一件事做 N 遍"的自动化工具。它的结构像一句完整的行动计划：`for (起点; 终点; 步进) { 重复做的事 }`。比如"从第 1 个设备，到第 100 个设备，一个一个地检查温度"——翻译成代码就是 `for (int i = 1; i <= 100; i++)`。在上位机中，`for` 循环最常见于：遍历传感器阵列、批量计算校准系数、轮询设备状态、初始化配置表。它是所有循环中最"规矩"的那种——循环次数在开始前就已经确定了。

> [!def] 官方定义
> `for` 循环是 C# 的**迭代语句**之一，适用于循环次数已知或可预测的场景。语法结构：
> ```
> for (初始化器; 条件; 迭代器)
> {
>     循环体
> }
> ```
> - **初始化器**：循环开始前执行一次（声明并初始化计数器）
> - **条件**：每次迭代前检查，为 `true` 继续，为 `false` 退出
> - **迭代器**：每次循环体执行完后执行（通常是计数器步进）
> - 三个部分都可以为空：`for (;;)` 是无限循环

> [!origin] 由来背景
> `for` 循环的语法最早可追溯到 ALGOL 60（1960年），但 C 语言的 `for (init; condition; increment)` 三元形式（1972年）成了之后几乎所有语言的标准格式。C# 完全继承了这套语法，但在 C# 9.0 为 `for` 循环的"扩展方法模式"提供了事实上的替代品——`foreach` + LINQ。不过，当你需要精确控制索引、反向遍历、跳跃遍历时，`for` 仍然无可替代。在上位机的底层循环中，`for (int i = 0; i < buffer.Length; i++)` 这种模式几乎写进了每个 `.cs` 文件。

> [!essentials] 核心要点
> - 三要素：初始化 `int i = 0;` → 条件 `i < n;` → 迭代 `i++`
> - 循环变量经典命名：`i`, `j`, `k`（嵌套循环约定俗成）
> - `for (;;)` 是无限循环，等价于 `while (true)`
> - 初始化区可以声明多个变量：`for (int i = 0, j = n-1; ...; ...) `
> - 迭代区可以多个操作：`for (...; ...; i++, j--)`
> - `break` 提前退出 / `continue` 跳过本次
> - 循环体中修改循环变量是合法的，但通常不该这样做

> [!example] 完整示例
> ```csharp
> // ========== 基本 for 循环 ==========
> for (int i = 1; i <= 5; i++)
> {
>     Console.WriteLine($"第 {i} 次采集");
> }

> // ========== 倒序遍历 ==========
> int[] readings = { 10, 25, 30, 45, 50 };
> Console.WriteLine("倒序打印传感器读数：");
> for (int i = readings.Length - 1; i >= 0; i--)
> {
>     Console.WriteLine($"  传感器[{i}] = {readings[i]}");
> }

> // ========== 跳步遍历：每隔一个采样 ==========
> double[] samples = { 23.1, 24.5, 25.0, 26.2, 27.8, 28.3, 29.0, 30.1 };
> Console.WriteLine("每隔一个取样的结果（降采样）：");
> for (int i = 0; i < samples.Length; i += 2)
> {
>     Console.WriteLine($"  样本[{i}] = {samples[i]:F1}℃");
> }
> // 输出: 23.1, 25.0, 27.8, 29.0

> // ========== 上位机实战：批量初始化 Modbus 寄存器 ==========
> ushort[] registers = new ushort[100];  // 100 个保持寄存器

> // 初始化：偶数号寄存器赋 0xAAAA，奇数号赋 0x5555
> for (int i = 0; i < registers.Length; i++)
> {
>     registers[i] = (ushort)(i % 2 == 0 ? 0xAAAA : 0x5555);
> }

> // 校准：寄存器 10~20 写入温度校准表
> double[] calibrationTable = { 0.0, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0, 22.5, 25.0 };
> for (int i = 0; i < calibrationTable.Length; i++)
> {
>     int regIndex = 10 + i;
>     registers[regIndex] = (ushort)(calibrationTable[i] * 10); // 存放大10倍的定点数
>     Console.WriteLine($"寄存器[{regIndex}] ← {calibrationTable[i]}℃ (存储值:{registers[regIndex]})");
> }

> // ========== 嵌套 for：二维网格（传感器矩阵）==========
> const int rows = 3;
> const int cols = 4;
> double[,] sensorGrid = new double[rows, cols];

> // 初始化一个 3×4 的传感器网格
> for (int row = 0; row < rows; row++)
> {
>     for (int col = 0; col < cols; col++)
>     {
>         sensorGrid[row, col] = 20.0 + row * 5.0 + col * 0.5;
>     }
> }

> // 打印网格
> Console.WriteLine("\n传感器网格数据：");
> for (int row = 0; row < rows; row++)
> {
>     Console.Write($"  行{row}: ");
>     for (int col = 0; col < cols; col++)
>     {
>         Console.Write($"{sensorGrid[row, col],6:F1}℃ ");
>     }
>     Console.WriteLine();
> }

> // ========== 优雅的字符串拼接 ==========
> string[] deviceNames = { "PLC-001", "PLC-002", "温度变送器", "压力传感器" };
> string deviceList = "";
> for (int i = 0; i < deviceNames.Length; i++)
> {
>     deviceList += (i > 0 ? ", " : "") + deviceNames[i];
> }
> Console.WriteLine($"\n设备列表: [{deviceList}]");
> ```

> [!scene] 适用场景
> ✅ 已知次数的循环：遍历固定长度数组
> ✅ 索引必须精确控制的场景：串口帧数据字节级处理
> ✅ 跳步、反向、指定区间遍历
> ✅ 批量初始化数据
> ✅ 二维数组/矩阵遍历
> ❌ 遍历集合但不需要索引 → 用 `foreach` 更简洁
> ❌ 循环次数不确定 → 用 `while`

> [!pitfall] 常见踩坑
> 坑 1：**数组越界：`<=` 和 `<` 搞混** → `for (int i = 0; i <= array.Length; i++)` ❌ 当 `i = array.Length` 时访问 `array[i]` 会炸。正解：`i < array.Length`
>
> 坑 2：**`for` 中修改集合** → `for (int i = 0; i < list.Count; i++) { list.RemoveAt(i); }` 删除元素后 Count 边变了，会跳过元素。正解：倒序遍历 `for (int i = list.Count - 1; i >= 0; i--)`
>
> 坑 3：**循环计数组作用域问题** → 老版本 C# 中 `for (int i = ...)` 的 `i` 在整个方法内可见（和 C++ 一样），导致"变量名冲突"。C# 已修复为块作用域（循环外不可见），但要注意嵌套循环不能用同一个变量名。

> [!best] 最佳实践
> - `array.Length` 提前缓存到局部变量：`int len = arr.Length; for (int i = 0; i < len; i++)`（JIT 会优化，但好习惯更安全）
> - 循环体中要做的事如果超过 10 行，抽成独立方法
> - 倒序遍历删除元素：`for (int i = list.Count - 1; i >= 0; i--)` 是安全模式
> - 不要用 `for (int i = 0; i < 200; i += 5)` 这种魔法数字，把 200 和 5 提成命名常量
> - 上位机中的高速采样循环，注意在循环体内加 `Thread.Sleep` 或异步等待，避免占满 CPU
> - C# 7.3+ 的 `for` 可以使用 `ref` 局部变量访问数组元素，避免值拷贝

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `for` 循环打印 1~10 的平方和立方
> **Lv.2 小试牛刀**：创建 `byte[]` 存放 20 个 Modbus 线圈状态（`0x00`/`0xFF`），用 `for` 循环统计 ON 的数量，并用第二位循环输出每个线圈的状态（索引+ON/OFF）
> **Lv.3 融会贯通**：实现一个"滑动窗口"均值滤波器——输入 100 个温度采样值，窗口大小 5（每次用最近 5 个值计算平均值），用 `for` 循环处理，输出 96 个滤波后的值

> [!related] 相关知识链接
> - ← 前置知识：算术运算符（循环变量的步进/条件都用到算术和比较运算）
> - → 后续必学：foreach 循环（不需要索引时的更简洁选择）
> - → 后续必学：while 循环（循环次数不确定时用这个）
> - ⇄ 关联概念：数组（for 和数组是天作之合）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/iteration-statements#the-for-statement
