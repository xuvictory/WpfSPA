---
title: 并行任务（WhenAll、WhenAny）
section: 08-threading
parent: 8.3 Task 与 async 和 await
---

# 并行任务（WhenAll、WhenAny）

> [!plain] 白话理解
> 上位机经常要同时跟多台设备打交道：读 PLC-1、读 PLC-2、读 PLC-3。如果一台一台读，总耗时 = 三台耗时相加，纯属浪费。`Task.WhenAll` 就是**"三根线一起放下去钓鱼，等三根都咬钩再一起收线"**——三个异步任务同时启动、并行等待，总耗时 ≈ 最慢的那台，而不是三者之和。`Task.WhenAny` 则是**"三根线一起放，谁先咬钩就先收谁"**——适用于"先到先得"：比如哪台设备先响应就先处理哪台，或"任一条件满足就继续"。一个管"全部齐了才动手"，一个管"有一个就行"，它们是并行编排的左右手。
>
> 一句话：**WhenAll 等"全齐"、WhenAny 等"先到"——并行启动、按需汇合**。

> [!def] 官方定义
> - **`Task.WhenAll(IEnumerable<Task>)`**：`System.Threading.Tasks.Task.WhenAll` 返回一个"当所有传入任务都完成时完成"的新任务；传入 `Task<T>[]` 时返回 `Task<T[]>`，其结果数组顺序与传入顺序一致。若任一任务异常，聚合为 `AggregateException`（`await` 时抛出其中一个）。
> - **`Task.WhenAny(IEnumerable<Task>)`**：返回"当任一传入任务完成时完成"的新任务；`await` 后得到一个**已经完成**的 `Task<T>`（需要再 `await` 一次取结果）。通常配合循环实现"轮询首个完成者"。
> - 两者都是**组合器（combinator）**，自身不创建线程，只负责编排现有 Task。
> - **区别**：`WhenAll` 等到全部；`WhenAny` 等到最先；`WhenAny` + `ContinueWith`/`await` 可逐批消费完成的任务。
> - 📖 官方文档：[Task.WhenAll 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenall)、[Task.WhenAny 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenany)、[使用 TPL 的并行任务](https://learn.microsoft.com/zh-cn/dotnet/standard/parallel-programming/task-based-asynchronous-programming)

> [!origin] 由来背景
> TPL 在 .NET 4.0（2010）推出 `Task` 时便提供了 `WhenAll`/`WhenAny` 组合器，用于解决"多个独立异步操作如何汇合"的问题。在异步代码出现前，等 N 个并发操作完成需要计数器 + `ManualResetEvent`，代码冗长易错。`WhenAll`/`WhenAny` 把"汇合"抽象为语言级模式，配合 async/await（C# 5.0，2012）后，并行读取多台设备、并行下载多个文件、超时竞速（`WhenAny` + `Task.Delay` 实现超时）都变成几行代码。上位机多通道采集、多设备巡检正是它们的典型战场。

> [!essentials] 核心要点
> - **并行启动靠"先创建所有 Task"**：`Task[] tasks = { ReadA(), ReadB(), ReadC() };` 三个方法一调用就已并行运行
> - **`WhenAll` 返回 `Task<T[]>`**：`string[] results = await Task.WhenAll(tasks);` 结果顺序与数组顺序一致
> - **`WhenAny` 返回 `Task<Task<T>>`**：`var first = await Task.WhenAny(tasks); string r = await first;` 需二次 await
> - **异常聚合**：`WhenAll` 中任一失败会聚合；`await` 时抛出其中一个异常，其余被吞——要取全部异常可访问 `task.Exception`
> - **`WhenAny` 不取消其余任务**：它只是"不等了"，其他任务仍在后台跑完（要停止需 `CancellationToken`）
> - **组合使用**：`WhenAny(tasks)` 循环可"逐个消费完成者"；`WhenAny(task, Task.Delay(超时))` 可做超时竞速
> - **UI 线程安全**：`await WhenAll` 后回到 UI 上下文，直接更新控件（见 `从-ui-线程安全更新控件`）

> [!example] 完整示例
> **并行任务 WhenAll / WhenAny 演示：并行读取多台设备状态：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="并行任务 WhenAll WhenAny" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="并行任务 WhenAll / WhenAny" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- WhenAll：等待全部设备读取完毕 -->
>         <Button Content="并行读取 3 台设备（WhenAll）" Click="OnWhenAllClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <!-- WhenAny：任一台读完立即继续 -->
>         <Button Content="先到先得（WhenAny）" Click="OnWhenAnyClick"
>                 Margin="0,5" Padding="8" Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="160" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Diagnostics;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // WhenAll：三个任务并行执行，全部完成后统一汇总
>         private async void OnWhenAllClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             var watch = Stopwatch.StartNew(); // 计时
>             Task<string>[] tasks =
>             {
>                 ReadDeviceAsync("PLC-1", 1500),
>                 ReadDeviceAsync("PLC-2", 1200),
>                 ReadDeviceAsync("PLC-3", 1800),
>             };
>             string[] results = await Task.WhenAll(tasks); // 全部完成才继续
>             watch.Stop();
>             LogText.Text += string.Join("\r\n", results) + "\r\n";
>             LogText.Text += $"总耗时 {watch.ElapsedMilliseconds} ms" +
>                             $"（≈最慢设备，而非三者之和）\r\n";
>         }
>
>         // WhenAny：任一台设备返回即可继续，适合"先到先得"场景
>         private async void OnWhenAnyClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             var watch = Stopwatch.StartNew();
>             Task<string>[] tasks =
>             {
>                 ReadDeviceAsync("PLC-1", 2000),
>                 ReadDeviceAsync("PLC-2", 800),
>                 ReadDeviceAsync("PLC-3", 1500),
>             };
>             string first = await Task.WhenAny(tasks); // 最快完成的那台
>             watch.Stop();
>             LogText.Text += $"最先返回：{await first}\r\n";
>             LogText.Text += $"耗时 {watch.ElapsedMilliseconds} ms（不等其余设备）\r\n";
>         }
>
>         // 模拟读取一台设备，delayMs 代表该设备的响应耗时
>         private static async Task<string> ReadDeviceAsync(string name, int delayMs)
>         {
>             await Task.Delay(delayMs);
>             return $"{name} 读取完成：运行正常";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **多设备并行巡检**：同时读 5 台 PLC 状态，`WhenAll` 汇总后一次刷新界面，总耗时=最慢设备
> ✅ **多通道并行采集**：温度/压力/流量三个通道同时采集，齐了再画曲线（见 `定时数据采集模式`）
> ✅ **"任一成功即继续"**：主通信失败时并行尝试备用通道，`WhenAny` 取最先成功的
> ✅ **超时竞速**：`await Task.WhenAny(读设备(), Task.Delay(3000))` 实现"3 秒没回就当超时"
> ❌ **任务间有依赖**：B 需要 A 的结果，那就该顺序 `await`，并行无意义
> ❌ **大量任务（>CPU 核数）**：几百个并行任务线程池会排队，不如分组用 `Parallel.ForEach` 或分批

> [!pitfall] 常见踩坑
> 坑 1：**`WhenAll` 一个失败全盘异常丢失** → 现象：日志只看到第一个异常，其他错误被吞 → 原因：`await` 只抛聚合中的一个 → 解决：用 `Task.WhenAll(...).ContinueWith` 遍历 `task.Exception.InnerExceptions`，或每个子任务内部自己 try/catch 记日志
>
> 坑 2：**`WhenAny` 之后忘记二次 await** → 现象：拿到的不是字符串而是 `Task<string>` → 原因：`WhenAny` 返回 `Task<Task<T>>` → 解决：`var firstTask = await Task.WhenAny(tasks); string r = await firstTask;`
>
> 坑 3：**以为 `WhenAny` 会取消其余任务** → 现象：界面显示了"先到"结果，但其他任务还在后台跑、继续更新日志 → 原因：`WhenAny` 只"不等了"，不取消 → 解决：需要停止就传 `CancellationToken`（见 `取消异步操作`），否则接受"其余任务跑完"
>
> 坑 4：**在 UI 线程里用 `Task.WaitAll`（同步版）** → 现象：界面卡死 → 原因：同步等待阻塞 UI 线程，且与 await 续延互相等待 → 解决：UI 场景永远用 `await Task.WhenAll(...)`，不要 `WaitAll`

> [!best] 最佳实践
> - **UI 场景一律 `await Task.WhenAll/WhenAny`**：不要同步 `WaitAll`/`WaitAny`，避免死锁
> - **先创建数组再统一 await**：`Task<T>[]` 一次性启动，别在循环里 `await` 单个任务（会退化成串行）
> - **`WhenAny` 超时用 `Task.Delay` 竞速**：`var winner = await Task.WhenAny(task, Task.Delay(3000));` 判断谁先完成
> - **子任务都传 `CancellationToken`**：统一取消时所有并行任务一起收场
> - **`WhenAll` 拿到结果用索引对应设备**：`results[i]` 与 `tasks[i]` 对应，别用顺序猜
> - **少量任务直接并行，大量任务用分区**：>100 个任务用 `Parallel.ForEachAsync` 或分批控制并发度

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例分别点 WhenAll（总耗时≈最慢 1800ms）与 WhenAny（≈最快 800ms）；改三台设备的延时值，验证规律
> **Lv.2 加属性**：在 WhenAny 示例后加"继续等剩余设备"：循环 `Task.WhenAny(剩余)` 逐个输出每台完成时间，体会逐批消费
> **Lv.3 改造**：实现"超时竞速"：`await Task.WhenAny(读设备(), Task.Delay(1000))`，1 秒没返回就显示"读取超时"，并取消设备任务
> **Lv.4 挑战**：模拟"5 台设备巡检"：用 `WhenAll` 并行读取并汇总成表格；其中一台模拟故障抛异常，实现"单台失败不影响其他"，结果标记"故障设备"并统计成功率

> [!related] 相关知识链接
> - ← 前置知识：`async-与-await-详解`（await 机制）、`taskrun-与-taskdelay`（任务基础）
> - → 后续必学：`取消异步操作`（并行任务的统一取消）、`生产者-消费者模式`（多生产者并发消费）
> - ⇄ 关联概念：`从-ui-线程安全更新控件`（并行结果回 UI）、`并发集合`（并行写数据的容器选择）
> - 📖 官方文档：[Task.WhenAll 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenall)、[Task.WhenAny 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenany)、[基于任务的异步编程](https://learn.microsoft.com/zh-cn/dotnet/standard/parallel-programming/task-based-asynchronous-programming)
