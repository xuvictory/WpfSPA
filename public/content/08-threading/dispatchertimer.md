---
title: DispatcherTimer
section: 08-threading
parent: 8.2 Dispatcher 调度器
---

# DispatcherTimer

> [!plain] 白话理解
> `DispatcherTimer` 就像**主控室墙上挂的"整点报时钟"**：它挂在 UI 线程这面墙上，每到设定时间就敲一下钟（触发 `Tick` 事件），而敲钟的"手"就是 UI 线程自己。因为钟和手都在 UI 线程，**Tick 里更新控件不需要任何跨线程调度**，直接写就行。但代价是：如果 UI 线程被耗时操作占住，钟也会"迟到"——它只在 UI 线程有空时才能敲。想要"后台线程准时敲钟、绝不迟到"，就该用 `System.Timers.Timer` 或 `System.Threading.Timer`（后台线程触发，但更新控件需 `Dispatcher` 调度）。选择哪种计时器，取决于"是 UI 任务优先还是准时优先"。
>
> 一句话：**DispatcherTimer = 跑在 UI 线程上的闹钟，方便但不保证准时**。

> [!def] 官方定义
> - **`System.Windows.Threading.DispatcherTimer`**：基于 `Dispatcher` 队列集成的计时器。它把 `Tick` 事件以 `DispatcherPriority.Background`（默认）优先级投递到 UI 线程调度队列，因此**事件处理器运行在 UI 线程**，可直接访问控件。
> - 核心成员：`Interval`（`System.TimeSpan` 触发间隔）、`IsEnabled`（启停开关，置 true 即开始）、`Tick` 事件、`Start()`/`Stop()`、`Tag`（可挂业务数据）。
> - 与 .NET 标准计时器对比：`System.Timers.Timer` / `System.Threading.Timer` 的 `Elapsed` 在**线程池线程**触发，须调度回 UI 线程更新控件；`DispatcherTimer` 免调度但受 UI 线程负载影响。
> - 📖 官方文档：[DispatcherTimer 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatchertimer)、[System.Timers.Timer](https://learn.microsoft.com/zh-cn/dotnet/api/system.timers.timer)

> [!origin] 由来背景
> 早期 WinForms 提供 `System.Windows.Forms.Timer`（消息泵计时器，跑在 UI 线程），WPF 沿用并升级为 `DispatcherTimer`：每个 Tick 通过 Dispatcher 排队而非直接基于系统时钟中断，因此它天然与 UI 渲染节奏协调。与此同时，.NET 的 `System.Timers.Timer`（.NET 2.0）和 `System.Threading.Timer`（.NET 1.0）都基于线程池回调，属于"后台准时、需调度"。两类计时器并存让开发者有了明确分工：**UI 轮询显示用 DispatcherTimer，后台采集/定时任务用 System.Timers.Timer**。

> [!essentials] 核心要点
> - **Tick 在 UI 线程执行**：处理器内可直接改控件、不必 `Dispatcher.Invoke`，这是它最大的便利
> - **受 UI 线程负载影响**：UI 线程被长任务阻塞时，Tick 会累积延迟，到点不触发是正常现象
> - **`Interval` 是"目标间隔"不是"精确间隔"**：实际触发时间 = UI 线程空闲时最近的一个调度点
> - **`IsEnabled = true` 即启动**，不必显式 `Start()`；窗口关闭时记得置 false 防止内存泄漏
> - **默认优先级 `Background`**：可在构造函数传 `DispatcherPriority` 调整（如 `new DispatcherTimer(DispatcherPriority.Normal)`）
> - **与 `System.Timers.Timer` 的本质区别**：线程归属不同，UI 更新免调度 vs 需调度

> [!example] 完整示例
> **DispatcherTimer 演示：定时刷新实时数据（UI 线程内计时）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DispatcherTimer" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="DispatcherTimer 定时刷新" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 实时数据展示区 -->
>         <TextBlock x:Name="ValueText" FontSize="28" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,5,0,5"/>
>         <TextBlock x:Name="TimeText" Foreground="#8B949E" Margin="0,0,0,10"/>
>         <!-- 启动/停止定时器 -->
>         <Button x:Name="ToggleButton" Content="启动定时刷新" Click="OnToggleClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <TextBlock Text="DispatcherTimer 在 UI 线程触发，可直接更新控件，无需额外调度。"
>                    Foreground="#8B949E" TextWrapping="Wrap" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private readonly Random _random = new Random();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 每 1 秒触发一次 Tick，运行在 UI 线程
>             _timer.Interval = TimeSpan.FromSeconds(1);
>             _timer.Tick += OnTimerTick;
>         }
>
>         // 定时刷新：模拟温度、压力等实时数据
>         private void OnTimerTick(object sender, EventArgs e)
>         {
>             double temp = 45 + _random.NextDouble() * 10; // 45~55℃
>             ValueText.Text = $"{temp:F1} ℃";
>             TimeText.Text = $"最后刷新：{DateTime.Now:HH:mm:ss}";
>         }
>
>         private void OnToggleClick(object sender, RoutedEventArgs e)
>         {
>             _timer.IsEnabled = !_timer.IsEnabled; // 切换启停
>             ToggleButton.Content = _timer.IsEnabled ? "停止定时刷新" : "启动定时刷新";
>             // 运行中用绿色表示，停止用红色表示
>             ToggleButton.Background = _timer.IsEnabled
>                 ? new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33))
>                 : new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **界面自刷新轮询**：每秒刷新系统时间、PLC 在线状态、报警灯闪烁，用 `DispatcherTimer` 最省事
> ✅ **轻量级 UI 动画/倒计时**：进度条演示、连接超时倒计时，UI 线程内直接改控件
> ✅ **与 UI 节奏对齐的周期任务**：确保"每次刷新都发生在 UI 空闲时"，避免与渲染争抢
> ❌ **必须准时的后台采集**：数据采集错过节拍会丢数据，应用 `System.Timers.Timer`（见 `定时数据采集模式`）
> ❌ **Tick 里有重计算/长 IO**：会把 UI 线程拖死，Tick 里只做"取数据、更新控件"，重活放 `Task.Run`

> [!pitfall] 常见踩坑
> 坑 1：**以为 `DispatcherTimer` 保证准时** → 现象：UI 卡一下，刷新就"跳一次" → 原因：Tick 依赖 UI 线程空闲，长任务期间不触发 → 解决：对实时性有硬要求的数据采集改用 `System.Timers.Timer` + `Dispatcher` 更新
>
> 坑 2：**Tick 里做耗时操作** → 现象：界面越用越卡，其他控件也变慢 → 原因：Tick 直接占 UI 线程，重计算阻塞了整个消息循环 → 解决：Tick 只读最新值刷新控件，计算丢 `Task.Run`（见 `taskrun-与-taskdelay`）
>
> 坑 3：**窗口关闭没停定时器** → 现象：关闭窗口后进程不退出/内存缓慢增长 → 原因：`DispatcherTimer` 仍挂在该 Dispatcher 上，事件持续触发 → 解决：`Window.Closed` 里 `_timer.Stop()`，或 `IsEnabled = false`

> [!best] 最佳实践
> - **UI 轮询刷新首选 `DispatcherTimer`**：它免调度、与渲染协调，代码最简洁
> - **采集类定时任务选 `System.Timers.Timer`**：后台准时触发，采集完成再调度回 UI（见 `定时数据采集模式`）
> - **Tick 处理器保持轻量**：只做"读值 + 更新控件"，超过 10ms 的工作全部外移
> - **统一管理启停**：窗口关闭、切页、进入后台都记得停掉，防止空转与泄漏
> - **用 `DispatcherTimer` 模拟"平滑轮询"**：需要 10Hz 刷新时设 `Interval = 100ms`，配合 `Background` 优先级不抢交互

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例启动/停止定时刷新；把 `Interval` 从 1 秒改成 100ms，观察刷新频率；把范围改 0~100 观察数值分布
> **Lv.2 加属性**：在界面加一个 `TextBlock` 显示"运行总次数"，每次 Tick 计数；加一个"暂停 5 秒"按钮（UI 线程 `Thread.Sleep(5000)`），观察定时器"跳钟"现象
> **Lv.3 改造**：再放一个 `System.Timers.Timer` 做同样的温度刷新（后台触发 + `Dispatcher.Invoke` 更新），对比两者在"UI 暂停 5 秒"时是否都会跳过
> **Lv.4 挑战**：实现"在线/离线状态机"：用 `DispatcherTimer` 每 2 秒轮询一个"模拟 PLC"（用 Random 模拟丢包），连续 3 次失败显示离线、恢复一次在线，状态灯变色

> [!related] 相关知识链接
> - ← 前置知识：`dispatcherinvoke-与-begininvoke`（调度机制）、`dispatcherpriority-优先级`（Tick 默认优先级）
> - → 后续必学：`定时数据采集模式`（采集计时器的正确选型）、`taskrun-与-taskdelay`（Tick 内重活怎么外移）
> - ⇄ 关联概念：`主线程与后台线程`（UI 线程负载的影响）、`生产者-消费者模式`（采集线程 + UI 刷新的协作）
> - 📖 官方文档：[DispatcherTimer 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatchertimer)、[System.Timers.Timer 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.timers.timer)
