---
title: 命名空间与 using
section: 00-prelude
parent: 类与对象
---

# 命名空间与 using

> [!plain] 白话理解
> 命名空间（namespace）就是代码的"文件夹"——防止两个不同的类取同样的名字打架。比如你的 `Device` 类和同事的 `Device` 类，只要放在不同的命名空间里就不会冲突。`using` 就是"我声明一下，接下来我要用这个文件夹里的东西，请别让我每次都写全路径"。就像你告诉同事"我在说三楼的产品"，然后你们就能直接说"会议室"而不是"三楼产品部会议室"。

> [!def] 官方定义
> `namespace` 是 C# 中组织代码的逻辑分组机制，用于避免类型名称冲突。`using` 指令用于导入命名空间，使代码可以直接使用其中的类型而无需完全限定名。C# 10 引入了**全局 using** 和**文件范围的命名空间声明**。

> [!origin] 由来背景
> 命名空间源自 C++ 的 `namespace`（1995年），但 C# 把它做到了极致：每一个 .cs 文件都在某个命名空间内；每一个程序集（DLL/EXE）可以包含多个命名空间，一个命名空间也可以跨多个程序集。`using` 在 C# 6.0 进化出了 `using static`（导入静态成员），在 C# 8.0 进化出 `using` 声明（替代 `using` 语句块），在 C# 10 进化出全局 using。上位机项目中，命名空间通常按功能分层：`Project.Communication`、`Project.Devices.PLC`、`Project.UI.ViewModels`。

> [!essentials] 核心要点
> - 命名空间可以嵌套：`namespace A { namespace B { } }` 等价于 `namespace A.B { }`
> - `using` 导入整个命名空间；`using static` 导入静态成员
> - `using` 别名：`using PLC = Project.Devices.PlcDevice;`
> - 全局 using（C# 10）：在任意文件写 `global using System;`
> - 文件范围命名空间（C# 10）：`namespace MyApp;`（不用大括号）

> [!example] 完整示例
> ```csharp
> // ========== 命名空间结构 ==========
> // 文件：Devices/PlcDevice.cs
> namespace WpfSPA.Devices.PLC;

> public class PlcDevice
> {
>     public string Id { get; init; } = "";
>     public bool Connect() => true;
> }

> // 文件：Devices/SensorDevice.cs
> namespace WpfSPA.Devices.Sensor;

> public class SensorDevice
> {
>     public double ReadValue() => 85.5;
> }

> // 文件：Communication/ModbusClient.cs
> namespace WpfSPA.Communication;

> using WpfSPA.Devices.PLC;    // 导入命名空间
> using WpfSPA.Devices.Sensor;
> using PLC = WpfSPA.Devices.PLC.PlcDevice;  // 别名

> public class ModbusClient
> {
>     public void ScanNetwork()
>     {
>         var plc = new PlcDevice { Id = "PLC-001" };  // 通过 using 可用
>         var sensor = new SensorDevice();               // 通过 using 可用
>         var plc2 = new PLC();                          // 通过别名
        
>         plc.Connect();
>         double value = sensor.ReadValue();
>         Console.WriteLine($"采集值: {value}");
>     }
> }

> // ========== using static ==========
> using static System.Math;
> using static System.Console;

> // 现在可以直接用 PI、Sqrt、WriteLine 而不用 Math. 和 Console.
> double radius = 5.0;
> double area = PI * Pow(radius, 2);
> WriteLine($"面积: {area:F2}");
> ```

> [!scene] 适用场景
> ✅ 大型项目分模块组织代码
> ✅ 引用第三方 NuGet 包的类型
> ✅ 解决类型名冲突的别名

> [!pitfall] 常见踩坑
> 坑 1：**两个命名空间有同名类** → `using A; using B;` 然后直接用 `MyClass` 会歧义，必须用完全限定名或别名。
> 坑 2：**全局 using 忘了** → C# 10 的全局 using 通常在 `GlobalUsings.cs`，新项目需要知道这个机制。

> [!best] 最佳实践
> - 命名空间按功能分层：`Project.Feature.SubFeature`
> - 用 C# 10 文件范围命名空间（`namespace A.B;`）
> - 用全局 using 集中管理常用导入
> - 同名冲突用别名：`using MyDevice = LibA.Device;`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建两个命名空间各含一个同名类，在主文件中用别名区分
> **Lv.2 小试牛刀**：模拟 WPF 项目结构，分 `Models`/`ViewModels`/`Services` 三个命名空间
> **Lv.3 融会贯通**：用全局 using + 文件范围命名空间重写一个多文件小项目

> [!related] 相关知识链接
> - ← 前置知识：类的定义、程序集概念
> - → 后续必学：项目引用与 NuGet
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/namespace
