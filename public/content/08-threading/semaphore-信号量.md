---
title: Semaphore 信号量
section: 08-threading
parent: 8.5 多线程同步与安全
---

# Semaphore 信号量

> [!plain] 白话理解
> 上位机的设备通道（串口、TCP 连接）往往有数量上限，比如只有 2 路串口，却有 6 个任务都要用。`Semaphore`（信号量）就是**通道的"门卫"**：它数着"当前还有几个空位"——进门（`WaitOne`）空位数减一，出门（`Release`）空位数加一；空位满了，后来的任务就在门外排队，谁空出来谁进。它和 `lock` 的区别很直观：`lock` 是"单人厕所"（同一时刻只能进一个人），`Semaphore` 是"多坑位的公共厕所"（同时允许 N 个人进去）。上位机里用它限制"同时访问设备的线程数"，防止 6 个任务同时怼着 2 路串口读写导致数据错乱。
>
> 一句话：**Semaphore 控制"同时允许多少个线程进入"，lock 只允许一个**。

> [!def] 官方定义
> - **`System.Threading.Semaphore`**：内核同步对象，维护一个计数，控制可同时访问共享资源的线程/进程数量。`WaitOne()` 获取（计数减一），`Release()` 释放（计数加一）。
> - **`System.Threading.SemaphoreSlim`**：Semaphore 的**轻量异步版本**（仅进程内），提供 `WaitAsync(CancellationToken)` 方法，可与 `await` 配合，是上位机异步代码的首选；构造函数 `new SemaphoreSlim(int initialCount, int maxCount)`。
> - **`Semaphore` 与 `SemaphoreSlim` 区别**：前者是内核对象、可跨进程、开销大；后者仅进程内、无内核对象、支持异步等待、开销小。
> - **`lock`/`Monitor` vs `Semaphore`**：`lock` 是互斥锁（初始值 1 的信号量的特例）；`Semaphore(1,1)` 也能做互斥，但 `SemaphoreSlim(1,1)` 更常用做"异步互斥锁"（因为支持 `await WaitAsync`）。
> - 📖 官方文档：[Semaphore 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.semaphore)、[SemaphoreSlim 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.semaphoreslim)、[同步原语概述](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/overview-of-synchronization-primitives)

> [!origin] 由来背景
> 信号量概念由计算机科学家 Dijkstra 于 1965 年提出，用于解决经典的生产者-消费者同步问题，是操作系统课程的核心内容。Windows 提供内核信号量对象，.NET 1.0 起封装为 `System.Threading.Semaphore`。.NET 4.0 引入 TPL 后，微软补充了轻量的 `SemaphoreSlim`（2010），专为异步/并行代码设计：它不需要内核对象，`WaitAsync` 让"异步等待信号量"成为可能——这在 `lock` 内不能 `await` 的约束下（见 `lock-与-monitor`）成为异步互斥与限流的标准工具。上位机场景中"限制并发访问串口/通道数量""批量任务限流"都靠它。

> [!essentials] 核心要点
> - **构造参数**：`new SemaphoreSlim(初始可用数, 最大可用数)`——如 `(2, 2)` 表示最多同时 2 个
> - **`await _sem.WaitAsync()` 获取**：可用数减一；已满则异步等待（不占线程，不阻塞 UI）
> - **`Release()` 释放**：可用数加一；**释放次数不能超过获取次数**，否则抛 `SemaphoreFullException`
> - **必须 `try/finally` 保证释放**：哪怕任务异常退出，也要把信号量还回去，否则"门卫"永远少一个坑位
> - **`SemaphoreSlim(1,1)` 是异步互斥锁**：解决"lock 里不能 await"的难题
> - **可配合取消**：`WaitAsync(CancellationToken)` 让"排队等待"也能被取消（见 `取消异步操作`）

> [!example] 完整示例
> **Semaphore 信号量演示：限制同时访问设备的线程数量：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Semaphore 信号量" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="Semaphore 信号量演示" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 并发 6 个任务争抢 2 个串口通道 -->
>         <Button Content="6 个任务争抢 2 个通道" Click="OnRunClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <TextBlock Text="同一时刻最多 2 个线程持有信号量（模拟 2 路串口并发上限）"
>                    Foreground="#8B949E" TextWrapping="Wrap" Margin="0,0,0,10"/>
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="200" Margin="0,0,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 初始可用 2 个、最多 2 个：相当于 2 路串口/通道
>         private readonly SemaphoreSlim _gate = new SemaphoreSlim(2, 2);
>
>         public MainWindow() => InitializeComponent();
>
>         private async void OnRunClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             Task[] tasks = new Task[6];
>             for (int i = 0; i < 6; i++)
>             {
>                 int index = i;
>                 tasks[i] = Task.Run(async () =>
>                 {
>                     // 申请通道：可用数减一，满则排队等待
>                     await _gate.WaitAsync();
>                     try
>                     {
>                         AppendLog($"任务{index} 获得通道，开始读写设备…");
>                         await Task.Delay(500); // 模拟读写耗时
>                         AppendLog($"任务{index} 释放通道");
>                     }
>                     finally
>                     {
>                         _gate.Release(); // 释放：可用数加一
>                     }
>                 });
>             }
>             await Task.WhenAll(tasks);
>             AppendLog("全部任务执行完毕");
>         }
>
>         private void AppendLog(string line) =>
>             Dispatcher.Invoke(() => LogText.Text += line + Environment.NewLine);
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **限制并发访问设备通道**：2 路串口、4 路 Modbus 通道，用 `SemaphoreSlim(2,2)` 限制并发读写数，防止协议交错
> ✅ **批量任务限流**：要并发处理 100 个文件，但只允许 8 个同时进行（`new SemaphoreSlim(8,8)`），避免资源耗尽
> ✅ **异步互斥（lock 内不能 await）**：需要"异步方法间互斥"时用 `SemaphoreSlim(1,1)` + `await WaitAsync()`
> ✅ **数据库连接池/线程池并发上限**：控制同时打开的数据库连接数、并发请求数
> ❌ **简单的进程内互斥**：只有"同一时刻一个人"的需求，用 `lock` 更轻量（`Semaphore(1,1)` 是重机枪打蚊子）
> ❌ **跨进程互斥**：进程级互斥应选 `Mutex`（`Semaphore` 虽可跨进程，但互斥语义不如 Mutex 直接，见 `mutex-跨进程互斥`）

> [!pitfall] 常见踩坑
> 坑 1：**忘在 `finally` 里 `Release()`** → 现象：跑几次后所有任务永远在等待，程序"假死" → 原因：某任务异常退出，占用的信号量没还回去 → 解决：`await _gate.WaitAsync(); try { ... } finally { _gate.Release(); }` 是铁律
>
> 坑 2：**`Release()` 次数超过 `WaitAsync()` 次数** → 现象：抛 `SemaphoreFullException` → 原因：释放比获取多，计数超出上限 → 解决：每次获取对应一次释放；可先 `_gate.CurrentCount` 调试计数；异常路径尤其要小心
>
> 坑 3：**用 `SemaphoreSlim` 的 `Wait()`（同步版）在 UI 线程** → 现象：界面卡死 → 原因：`Wait()` 阻塞 UI 线程等信号量 → 解决：UI 场景一律 `await _gate.WaitAsync()`；真要同步等，给超时 `Wait(1000)`
>
> 坑 4：**信号量数量与资源数不匹配** → 现象：明明只 2 路串口，却允许 5 个任务同时"进出" → 原因：`new SemaphoreSlim(5,5)` 数量设错 → 解决：构造时用真实通道数；改动资源数后同步更新信号量参数

> [!best] 最佳实践
> - **进程内异步场景选 `SemaphoreSlim`**：支持 `await WaitAsync()`、开销小，上位机 99% 场景用它
> - **`SemaphoreSlim(1,1)` 当异步锁**：需要"异步互斥"（lock 内不能 await）时用它，配 `await WaitAsync()`/`Release()` 包 try/finally
> - **在 UI 线程创建、全局共享**：信号量作为通道管理器的字段，不要每次 new（否则失去限流意义）
> - **`WaitAsync` 传 `CancellationToken`**：限流排队时用户可取消，配合 `取消异步操作` 的收尾流程
> - **与 `Task.WhenAll` 组合**：先 `WhenAll` 启动所有任务，内部用信号量限流，实现"并发上限 + 整体等待"（见 `并行任务whenallwhenany`）
> - **日志打印 `CurrentCount`**：排查"为什么都在等"时，`_gate.CurrentCount` 直接暴露剩余坑位数

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例观察"最多 2 个任务同时读写"的日志节奏；把 `SemaphoreSlim(2,2)` 改成 `(4,4)`，观察并发度变化；改成 `(1,1)` 观察退化为互斥锁
> **Lv.2 加属性**：在日志区上方加 `TextBlock` 实时显示 `_gate.CurrentCount`；在任务"获得通道"前后各刷新一次，验证计数变化规律
> **Lv.3 改造**：让任务"获得通道"时随机抛异常（模拟设备故障），验证 `finally` 里 `Release()` 仍执行、其他任务不受影响；对比去掉 finally 的后果
> **Lv.4 挑战**：实现"串口通道池"：`ChannelPool` 类内部用 `SemaphoreSlim(2,2)` 管理 2 个虚拟通道，提供 `Task<T> UseAsync<T>(Func<Task<T>> action)` 通用方法；用 10 个任务并发调用，验证最多 2 个同时执行且结果正确

> [!related] 相关知识链接
> - ← 前置知识：`lock-与-monitor`（互斥基础）、`taskrun-与-taskdelay`（并发任务来源）
> - → 后续必学：`生产者-消费者模式`（信号量是"有界缓冲"实现的经典工具）
> - ⇄ 关联概念：`mutex-跨进程互斥`（互斥 vs 信号量的区别）、`并发集合`（无锁容器替代）、`死锁的成因与避免`（多信号量嵌套的顺序问题）
> - 📖 官方文档：[SemaphoreSlim 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.semaphoreslim)、[Semaphore 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.semaphore)、[同步原语概述](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/overview-of-synchronization-primitives)
