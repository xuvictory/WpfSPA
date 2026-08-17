---
title: C# 并发编程经典实例
section: 16-resources
parent: 16.3 推荐书籍
---

# C# 并发编程经典实例

> [!plain] 白话理解
> 上位机的通信、采集、报警处理天生就是"多线程现场"：一边读 PLC、一边刷新界面、一边写日志。并发写不好就是"卡顿 + 偶发崩溃 + 数据错乱"三件套。这本书把并发编程按**实战问题**组织成一个个"菜谱"——"怎么取消任务""怎么限制并发数""怎么安全地在多个线程共享数据"，每个问题直接给方案和代码。**它不是理论书，是"并发疑难杂症速查手册"，哪里痛翻哪里。**

> [!def] 官方定义
> 《C# 并发编程经典实例》是 **Stephen Cleary** 所著的并发编程**配方式（Recipe）实战书**（中文第 2 版由**韩峰**翻译，**人民邮电出版社**于 **2020 年 12 月**出版，属"图灵程序设计丛书"）。它**不是微软官方出版物**，而是基于微软官方并发 API（`System.Threading`、`System.Threading.Tasks`，见 https://learn.microsoft.com/zh-cn/dotnet/standard/threading/ 与 https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/ ）编写的实战指南。全书覆盖：`async/await` 基础与进阶、`Task` 组合（`WhenAll`/`WhenAny`）、并行处理（`Parallel`/`DataFlow`）、并发集合、互斥与信号量、取消令牌、UI 线程交互、计时器等，几乎每个条目都是"问题 → 方案 → 讨论"三段式。

> [!origin] 由来背景
> Stephen Cleary 是微软 .NET 社区知名专家，长期研究 .NET 异步与并发，维护 `Nito.AsyncEx` 等开源库，并撰写大量异步编程文章。**2013 年**他出版本书第 1 版，恰逢 C# 5.0 引入 `async/await` 后"如何正确并发"成为社区刚需；第 2 版在 **2019/2020 年**扩充到 .NET Core/现代 API，涵盖 `ValueTask`、`IAsyncEnumerable`、`Channel` 等新特性。这本书以"解决实际问题"为导向，与官方文档偏原理的风格互补，成为 .NET 并发编程引用率最高的实战书之一。上位机开发者尤其重视其中的"UI 线程与后台任务交互""定时轮询与取消"等章节。

> [!essentials] 核心要点
> - **章节结构**：按主题分"异步基础、Task 组合、并行、数据流、线程安全、取消、UI 交互、计时器"等
> - **核心模式**：`await Task.WhenAll/WhenAny` 组合任务、`CancellationToken` 统一取消、`SemaphoreSlim` 限流
> - **UI 线程**：`IProgress<T>`/`SynchronizationContext` 正确处理"后台采集 → 界面刷新"
> - **数据流**：`System.Threading.Channels`/`DataFlow` 做"生产者-消费者"采集流水线
> - **并发集合**：`ConcurrentDictionary`、`BlockingCollection` 安全共享数据
> - **防死锁**：理解 `ConfigureAwait(false)` 与同步上下文陷阱（GUI/ASP.NET 场景差异）

> [!example] 完整示例
> **async/await 并发采集演示：Task.WhenAll 并行读取 3 路传感器：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="并发编程演示" Height="360" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="async/await 并发采集演示" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Button x:Name="CollectBtn" Content="并行采集 3 路传感器" Click="OnCollectClick"
>                 Padding="8" Margin="0,0,0,8" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <Border Background="#161B22" Padding="8" CornerRadius="6">
>             <TextBlock x:Name="ResultText" Foreground="White" TextWrapping="Wrap"/>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private async void OnCollectClick(object sender, RoutedEventArgs e)
>         {
>             CollectBtn.IsEnabled = false;
>             StatusText.Text = "并行采集中 ...";
>
>             // Task.WhenAll 让 3 路采集并发执行，总耗时约等于最慢的一路
>             var results = await Task.WhenAll(CollectAsync("1 号温度", 1200),
>                                              CollectAsync("2 号温度", 800),
>                                              CollectAsync("3 号温度", 1500));
>
>             ResultText.Text = string.Join("\n", results);
>             StatusText.Text = "采集完成，耗时约等于最慢一路（1500 ms）";
>             CollectBtn.IsEnabled = true;
>         }
>
>         // 模拟一路传感器采集：延迟后返回测量值
>         private async Task<string> CollectAsync(string sensor, int delayMs)
>         {
>             await Task.Delay(delayMs);
>             return sensor + "：" + new Random().Next(80, 120) + " ℃（" + delayMs + " ms）";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 上位机多路设备并行采集（`Task.WhenAll` 同时读多台 PLC/传感器）
> ✅ 生产者-消费者模型：采集线程产数据、界面线程消费显示
> ✅ 后台定时轮询 + 取消（`CancellationToken`）的监控任务
> ✅ 需要限流、互斥保护共享资源（通信串口/寄存器缓存）的场景
> ❌ 简单同步逻辑（不该引入并发复杂性，能串行就串行）
> ❌ 对实时性有硬保证的硬实时控制（托管并发无法保证确定性延迟）

> [!pitfall] 常见踩坑
> 坑 1：**`async void` 乱用导致异常吞没** → 现象：事件处理器里 `async void` 抛异常，程序崩溃且难定位 → 原因：`async void` 异常无法捕获且不返回 Task → 解决：事件处理器内用 `try/catch` 全包，其余一律 `async Task`
>
> 坑 2：**`Task.Run` 开太多线程** → 现象：频繁 `Task.Run` + 循环轮询，线程池爆满、内存上涨 → 原因：把 `Task.Run` 当"开线程"，滥用并发 → 解决：IO/采集用 `async`（不占线程），CPU 密集才用 `Parallel`/`Task.Run`，轮询用 `DispatcherTimer`
>
> 坑 3：**共享集合多线程写入崩溃** → 现象：后台线程往 `List<T>` 添加数据，UI 读取时抛"集合已修改" → 原因：`List<T>` 非线程安全 → 解决：用 `ConcurrentQueue<T>`/`BlockingCollection` 做采集队列，UI 定时消费（见第 8 章）

> [!best] 最佳实践
> - 采集任务统一"async 方法 + `CancellationToken` + 超时"，可取消、可停止、不泄漏
> - 多路采集用 `WhenAll` 并发，避免串行累加延迟；需要"先到先处理"用 `WhenAny`
> - 界面刷新用 `Dispatcher`/`IProgress<T>` 切回 UI 线程，绝不直接在后台线程碰控件
> - 串口/共享设备用 `SemaphoreSlim(1,1)` 串行化访问，防止并发请求乱序
> - 先把书里"问题-方案"当目录读，遇到具体并发症状再翻对应 Recipe

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把 3 路改成 5 路采集，观察 `WhenAll` 总耗时
> **Lv.2 小试牛刀**：给示例加一个"取消"按钮，用 `CancellationTokenSource` 中断采集
> **Lv.3 融会贯通**：用 `SemaphoreSlim` 限制"同一串口同一时刻只能有一个读请求"
> **Lv.4 拆层挑战**：用 `Channel` 搭建"采集→缓冲→界面消费"的生产者-消费者流水线，支持背压与取消

> [!related] 相关知识链接
> - ← 前置知识：第 8 章（异步与 UI 线程）、[`c-高级编程`](c-高级编程)（语言基础）
> - → 后续必学：[`nmodbus`](nmodbus)、[`mqttnet`](mqttnet)（真实并发场景实践）
> - ⇄ 关联概念：`上位机日志场景`（12）、[`serilog`](serilog)（并发下的日志）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/ ；线程与任务：https://learn.microsoft.com/zh-cn/dotnet/standard/threading/
