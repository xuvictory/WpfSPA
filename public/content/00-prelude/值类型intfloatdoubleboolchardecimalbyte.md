---
title: 值类型（int、float、double、bool、char、decimal、byte）
---

# 值类型（int、float、double、bool、char、decimal、byte）

> [!plain] 白话理解
> 值类型就是"真金白银直接揣兜里"。一个整数变量 `int age = 25`，这个 25 就直接存在 age 自己的内存空间里。你把它复制给另一个变量 `int age2 = age`，age2 拿到的是一个**独立副本**，改 age2 完全不影响 age——就像你把文件复制粘贴了一份，改副本不会动原件。

> [!def] 官方定义
> 值类型（Value Type）是直接包含其数据的类型，变量直接存储数据本身。值类型分配在栈（Stack）上，赋值时进行**值拷贝**。C# 中的内置数值类型（int、float、double、bool、char 等）以及 struct、enum 都是值类型。

> [!origin] 由来背景
> .NET 设计之初面临一个核心问题：高性能场景下，如果所有数据都像引用类型那样在堆上分配，会频繁触发 GC（垃圾回收），造成性能抖动。对于工控上位机这种实时性要求高的场景，这是致命的。于是微软把简单数据（数字、布尔值等）设计为值类型，分配在栈上，用完立即释放，不经过 GC。

> [!essentials] 核心要点
> - `int`（32 位有符号整数）：范围 -2,147,483,648 ~ 2,147,483,647
> - `long`（64 位）：更大的整数
> - `float`（32 位浮点）：精度约 7 位有效数字，后缀 f
> - `double`（64 位浮点）：精度约 15 位，默认小数类型
> - `decimal`（128 位）：精度最高，适合金额计算，后缀 m
> - `bool`：只有 true 或 false
> - `byte`（8 位）：范围 0~255，**上位机通信中最常用**
> - `char`（16 位 Unicode）：单个字符

> [!example] 完整示例
> ```csharp
> // 整数
> int count = 100;
> byte sensorValue = 0x3F; // 上位机中常见：从串口读到的原始字节
> 
> // 浮点
> double temperature = 36.5;
> float pressure = 101.3f;  // f 后缀不能忘！
> decimal price = 19.99m;   // m 后缀
> 
> // 布尔
> bool isConnected = true;
> 
> // 值拷贝演示
> int a = 10;
> int b = a;   // b = 10，是独立副本
> b = 20;      // a 还是 10，不受影响
> 
> // 上位机常见：byte 数组解析温度
> byte[] received = { 0x01, 0x2C }; // 串口收到的数据
> int rawValue = (received[0] << 8) | received[1]; // 组合为 300
> double temp = rawValue / 10.0; // 实际温度 = 30.0°C
> ```

> [!scene] 适用场景
> ✅ 数值计算、状态标志、通信原始数据——几乎所有基础数据都用值类型
> ✅ 上位机通信中，`byte` 和 `byte[]` 是接收串口/Socket 数据的基石
> ✅ `decimal` 适用于工控中的计费、能耗统计等需要高精度的场景
> ❌ 需要传递引用时（如方法间共享修改）→ 用引用类型或 ref 关键字

> [!pitfall] 常见踩坑
> 坑 1：**float 忘写 f 后缀** → `float x = 1.5;` 编译报错，必须写 `float x = 1.5f;`
> 
> 坑 2：**int 溢出不报错** → `int max = int.MaxValue; max + 1;` 结果变成 -2147483648（环绕），用 `checked` 块可以捕获
> 
> 坑 3：**byte 运算自动提升为 int** → `byte a = 200; byte b = 100; byte c = a + b;` 编译报错！需要显式转换：`byte c = (byte)(a + b);`

> [!best] 最佳实践
> - 整数值范围明确时，用 `byte` 或 `short` 而非一律 `int`——上位机通信中省内存就是省性能
> - 上位机实时数据处理用 `double`，金额/能耗统计用 `decimal`
> - 善用 `nameof()` 和 `var` 增加可读性，但通信协议解析代码中避免 `var`（明确类型更清晰）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建一个控制台程序，声明所有值类型变量并打印它们的默认值和取值范围
> **Lv.2 小试牛刀**：模拟串口收到 4 个 byte：`{0x00, 0x01, 0x02, 0x03}`，将其解析为一个 int 值（大端序）
> **Lv.3 融会贯通**：写一个温度转换方法，输入 byte 数组，解析出实际温度值，并判断是否超出报警阈值（>80°C 报警）

> [!related] 相关知识链接
> - ← 前置知识：.NET SDK 安装与第一个控制台程序
> - → 后续必学：引用类型（string、object）
> - ⇄ 关联概念：类型转换（隐式/显式）、byte 数组在串口通信中的应用
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/value-types
