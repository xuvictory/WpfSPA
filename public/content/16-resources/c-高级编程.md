---
title: C# 高级编程
section: 16-resources
parent: 16.3 推荐书籍
---

# C# 高级编程

> [!plain] 白话理解
> WPF 是"皮"，C# 是"骨"。界面写得再漂亮，背后逻辑（采集、协议解析、数据加工、线程调度）全靠 C# 撑起来。《C# 高级编程》就是 C# 体系里"又全又新"的权威大部头：语言特性、泛型、LINQ、异步、依赖注入、EF Core、并发、云原生全都有，而且每出一个新 .NET 大版本就更新一版。**适合已经会写 C#、想系统进阶到"工程级水平"的开发者。**

> [!def] 官方定义
> 《C# 高级编程》是 **Christian Nagel**（克里斯琴·内格尔）主编的 C#/.NET 权威技术著作（**清华大学出版社**引进出版；第 12 版对应 C# 12/.NET 8，中文版 **2022 年 10 月**出版），是面向**中级以上开发者**的系统性参考书。它不是微软官方出版物，但内容与微软官方 C# 文档（https://learn.microsoft.com/zh-cn/dotnet/csharp/ ）高度互补：官方文档按语言功能分篇，本书按"工程实践"组织——从 C# 语言基础、LINQ 与集合、异步编程，到 .NET 8 平台特性、EF Core、依赖注入、Web 与云原生。对上位机开发者而言，**泛型、LINQ、异步、并发**是日常核心，本书在这些主题上有权威且深入的讲解。

> [!origin] 由来背景
> 《C# 高级编程》系列始于 **2001 年**（.NET 1.0 时代），由微软 MVP/技术作家 **Christian Nagel** 等组成的作者团队长期维护，至今已迭代 12 版，与 .NET 几乎同步演进，是全球 C# 开发者公认的"大部头"参考书。其特点是从第一版就坚持"覆盖全面 + 跟随版本"，20 余年间陪伴了几代 .NET 工程师。国内清华大学出版社长期引进，使其成为中文 C# 社区最有影响力的进阶读物之一。对上位机行业，它支撑的正是"从会写界面到能写稳健工程"的跨越——异步、并发、依赖注入都是上位机工程化的刚需。

> [!essentials] 核心要点
> - **重点章节**：C# 语言核心（类型、泛型、lambda、记录类型）、LINQ、异步与并发、依赖注入、EF Core
> - **异步编程**：`async/await`、`Task`、`ValueTask`、`CancellationToken`——上位机通信/采集的基石
> - **泛型与集合**：`List<T>`、`Dictionary<TKey,TValue>`、只读集合——设备列表/点位管理的日常
> - **LINQ**：`Where`/`Select`/`GroupBy`/`Join`——从采集数据中筛选、统计、聚合
> - **依赖注入**：`Microsoft.Extensions.DependencyInjection`——与第 12 章架构配合的服务管理
> - **版本注意**：第 12 版讲 C# 12/.NET 8，若用旧版需注意语言新特性（如主构造函数、集合表达式）差异

> [!example] 完整示例
> **C# 高级特性演示：LINQ、泛型与 lambda 筛选设备列表：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="C# 高级特性演示" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="C# 高级特性：LINQ 与泛型在 WPF 中的使用" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Button Content="筛选运行中的设备" Click="OnFilterClick" Padding="8" Margin="0,0,0,8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <ListBox x:Name="DeviceList" Height="200" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Collections.Generic;
> using System.Linq;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 设备数据模型（泛型类的简单用法）
>         private class Device
>         {
>             public string Name { get; set; }
>             public bool Running { get; set; }
>         }
>
>         private readonly List<Device> _devices = new List<Device>
>         {
>             new Device { Name = "1 号泵", Running = true },
>             new Device { Name = "2 号泵", Running = false },
>             new Device { Name = "空压机", Running = true },
>             new Device { Name = "输送带", Running = false }
>         };
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnFilterClick(object sender, RoutedEventArgs e)
>         {
>             // LINQ 查询 + lambda 委托筛选，统计运行中的设备
>             var running = _devices.Where(d => d.Running).Select(d => d.Name).ToList();
>
>             DeviceList.Items.Clear();
>             foreach (var name in running)
>             {
>                 DeviceList.Items.Add(name);
>             }
>             StatusText.Text = "运行中设备 " + running.Count + " 台（LINQ Where 筛选）";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 已有 C# 基础、想系统进阶到工程级水平的开发者
> ✅ 上位机数据层开发：采集、协议解析、数据聚合（泛型/LINQ/异步）
> ✅ 需要依赖注入、服务管理架构的较大项目
> ✅ 需要掌握 .NET 8+ 新特性（记录类型、主构造函数等）的团队
> ❌ 零基础初学者（本书信息密度高，建议先学 C# 基础再读）
> ❌ 只想学 WPF 界面、不动后端逻辑的纯 UI 场景（不必啃大部头）

> [!pitfall] 常见踩坑
> 坑 1：**拿旧版本书对照新框架** → 现象：书里 API 写法在 .NET 8 里编译不过或已废弃 → 原因：C#/.NET 每年迭代，书有版本滞后 → 解决：选与所用 .NET 版本匹配的版次，差异以微软官方文档（https://learn.microsoft.com/zh-cn/dotnet/csharp/ ）为准
>
> 坑 2：**异步编程没吃透就用** → 现象：`async void` 满天飞、UI 卡顿、异常丢失 → 原因：异步是"理解型"知识，靠抄代码学不会 → 解决：先精读异步章节，再对照第 8 章实践，重点理解 `SynchronizationContext` 与 UI 线程
>
> 坑 3：**过度设计泛型/LINQ 反伤可读性** → 现象：一行 `Select(...).GroupBy(...).SelectMany(...)` 看得人头晕 → 原因：追求"一行流"牺牲了可读性 → 解决：复杂查询拆变量命名步骤，可读性优先于炫技

> [!best] 最佳实践
> - 上位机开发重点精读：异步（`async/await`）、LINQ、泛型集合、依赖注入四章
> - 异步编程与第 8 章结合：`Task.Run` 跑采集、`await` 回 UI 线程，统一套路
> - LINQ 用于报表聚合（产量统计、报警分类），比手写循环更清晰可读
> - 用依赖注入管理通信服务（`nmodbus`/`mqttnet` 封装成单例服务），配合第 12 章架构
> - 保持书桌常备，当"字典"查——遇到不熟的语言特性先翻对应章节

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把筛选条件改成"未运行的设备"并排序显示
> **Lv.2 小试牛刀**：用 `GroupBy` 统计各车间（虚构字段）的设备数量，展示到界面
> **Lv.3 融会贯通**：用 `async/await` 把示例改造为"异步加载设备列表"，模拟网络延迟
> **Lv.4 拆层挑战**：用依赖注入 + 仓储模式（`dapper`）重构示例，实现"设备服务"可测试、可替换，并写单元测试

> [!related] 相关知识链接
> - ← 前置知识：`什么是-mvvm`（07）、第 8 章（异步与并发）
> - → 后续必学：[`c-并发编程经典实例`](c-并发编程经典实例)（并发专题深入）
> - ⇄ 关联概念：[`dapper`](dapper)（LINQ 后的数据访问）、第 12 章（依赖注入/架构）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/ ；.NET 文档：https://learn.microsoft.com/zh-cn/dotnet/
