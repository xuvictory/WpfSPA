---
title: Task.Run 与 Task.Delay
section: 08-threading
parent: 8.3 Task 与 async 和 await
---

# Task.Run 与 Task.Delay

> [!plain] 白话理解
> `Task.Run` 就像**把一箱重货交给"装卸队"（线程池）搬运**：你把要干的重活（函数）装进箱子里，交给装卸队，装卸队立刻派一个空闲工人去搬，而你（UI 线程）不用等，直接去干别的。`Task.Delay` 则是**"设个闹钟到点再叫醒"**：闹钟期间不占用任何工人（线程），到点后自动安排人继续——它和 `Thread.Sleep`（傻坐着占着一个工人）完全不同。两者配合就能写出"后台干活、按节奏推进、不阻塞 UI"的轮询采集代码：`Task.Run` 开干，`Task.Delay` 控制节奏，`await` 负责"回来时还在原线程"。
>
> 一句话：**Task.Run 把活派给线程池，Task.Delay 不占线程地等待，await 让 UI 线程"等得起"**。

> [!def] 官方定义
> - **`System.Threading.Tasks.Task.Run(Action/Func<Task>)`**：把委托调度到线程池（`ThreadPool`）执行，返回表示该工作的 `Task`。`Task.Run(Func<Task>)` 是异步包装：工作项内部可 `await` 其他异步操作。
> - **`System.Threading.Tasks.Task.Delay(int/TimeSpan)`**：返回一个**在指定时间后完成**的 `Task`，底层使用系统定时器，不占用线程；配合 `await` 实现"异步版 Sleep"。可传 `CancellationToken` 提前取消。
> - 对比 `Thread.Sleep`：`Sleep` 阻塞当前线程（占着不放）；`Task.Delay` 挂起 Task 不占线程，等的时间可以处理其他事。
> - **`Task`**：.NET 4.0（2010）TPL 的核心类型，表示一个异步操作单元，`IsCompleted`、`Status`、`Exception` 等成员描述其状态；`Task.Run` 与 `Task.Delay` 是 TPL 最常用的两个工厂方法。
> - 📖 官方文档：[Task.Run 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.run)、[Task.Delay 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.delay)、[Task-based Asynchronous Pattern](https://learn.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)

> [!origin] 由来背景
> .NET 4.0（2010）引入 Task Parallel Library（TPL），用 `Task` 抽象取代手写 `Thread` + 回调的繁琐模式：线程池负责复用线程、`Task.Run` 负责"派活"，把并发复杂度藏进框架。`Task.Delay` 在 .NET 4.5（2012）随 async/await 一起普及，解决了"异步代码里想等一会儿却没法 Sleep"的难题（Sleep 会阻塞线程）。从此"轮询采集"这类周期任务从 `Thread.Sleep + 手动 Dispatcher` 演进为 `Task.Run + Task.Delay + await`，代码量更少、可取消性更好。

> [!essentials] 核心要点
> - **`Task.Run` 走线程池**：线程池自动管理线程数量，短任务用完归还，避免每个任务独占线程
> - **`Task.Delay` 不占线程**：await 它时当前线程被释放，可处理其他工作，这是与 `Thread.Sleep` 的本质区别
> - **`await` 解包结果**：`Task.Run(() => Heavy())` 返回 `Task<T>`，用 `await` 拿结果，不要 `.Result`
> - **`Task.Run` 内抛异常会存进 Task**：`await` 时重新抛出，所以 `try/catch` 包住 `await Task.Run(...)` 就能捕获
> - **`Task.Delay` 支持取消**：传 `CancellationToken`，令牌取消时 `Delay` 抛 `TaskCanceledException`（见 `取消异步操作`）
> - **`volatile`/`CancellationToken` 控制循环退出**：轮询循环用标志位（`volatile bool` 或令牌）优雅停止，不要用"杀线程"

> [!example] 完整示例
> **Task.Run 与 Task.Delay 演示：模拟设备轮询采集：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Task.Run 与 Task.Delay" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="Task.Run 与 Task.Delay 演示" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- Task.Run：把重活丢到线程池；Task.Delay：异步等待不阻塞线程 -->
>         <Button x:Name="StartButton" Content="启动 5 次模拟轮询" Click="OnStartClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <Button Content="停止轮询" Click="OnStopClick"
>                 Margin="0,5" Padding="8" Background="#DA3633" Foreground="White"/>
>         <!-- 日志区：展示每轮采集结果与线程 ID -->
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="160" Margin="0,10,0,0"/>
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
>         private volatile bool _running; // 控制轮询的开关标志
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnStartClick(object sender, RoutedEventArgs e)
>         {
>             _running = true;
>             StartButton.IsEnabled = false; // 防止重复启动
>             LogText.Text = "";
>             // 把轮询逻辑放到线程池线程，避免阻塞 UI
>             Task.Run(async () =>
>             {
>                 for (int i = 1; i <= 5 && _running; i++)
>                 {
>                     await Task.Delay(800); // 异步等待 0.8 秒，不占用线程
>                     double value = 40 + i * 2.5; // 模拟采集温度
>                     int threadId = Thread.CurrentThread.ManagedThreadId;
>                     // 回到 UI 线程更新界面
>                     await Dispatcher.InvokeAsync(() =>
>                         LogText.Text += $"第 {i} 次采集：温度 {value:F1}℃" +
>                                         $"（线程 Id={threadId}）\r\n");
>                 }
>                 await Dispatcher.InvokeAsync(() =>
>                 {
>                     LogText.Text += _running ? "轮询完成\r\n" : "轮询被停止\r\n";
>                     StartButton.IsEnabled = true;
>                 });
>             });
>         }
>
>         private void OnStopClick(object sender, RoutedEventArgs e)
>         {
>             _running = false; // 停止标志，等待中的循环自然退出
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **CPU 密集型计算放后台**：图像模板匹配、大数据排序、报表生成——`await Task.Run(() => HeavyCompute())`
> ✅ **周期轮询采集**：`Task.Run(async () => { while(flag) { await Task.Delay(ms); 读数据; } })`（见 `定时数据采集模式`）
> ✅ **短时延时的非阻塞等待**：重试前的等待、心跳间隔——`await Task.Delay(...)` 不占线程
> ✅ **把同步 API 异步化**：老库只有同步方法，用 `Task.Run` 包一层让 UI 不被阻塞（过渡方案）
> ❌ **IO 等待场景**：串口/网络有真正的异步 API，直接 `await` 它们比 `Task.Run` 包同步阻塞更省线程（见 `async-与-await-详解`）
> ❌ **超高频小任务**：毫秒级小活开 `Task.Run` 的调度开销大于收益，直接同步执行

> [!pitfall] 常见踩坑
> 坑 1：**用 `Task.Delay` 后忘了 `await`** → 现象：循环直接飞过，间隔无效 → 原因：`Task.Delay(800)` 返回 Task 没 await，立即返回 → 解决：`await Task.Delay(800);`，编译器警告 CS4014 时优先 `await`
>
> 坑 2：**把 `Task.Delay` 当 `Thread.Sleep` 用（占线程）** → 现象：循环里 `await Task.Delay` 没错，但有的人写成 `Task.Delay(...).Wait()` → 原因：`.Wait()` 又把线程占住了，还可能在 UI 线程死锁 → 解决：永远用 `await`，绝不 `.Wait()`/`.Result`
>
> 坑 3：**轮询停止用"杀线程"思想** → 现象：任务无法取消，或界面关了后台还在跑 → 原因：没有停止标志，`Task.Run` 的线程池任务不受控 → 解决：用 `volatile bool` 或 `CancellationToken` 让循环自然退出，后台收尾后回 UI 更新状态
>
> 坑 4：**`Task.Run` 里访问共享变量不加同步** → 现象：偶尔数据错乱 → 原因：线程池线程并发访问非线程安全集合 → 解决：加锁（`lock-与-monitor`）或换 `并发集合`

> [!best] 最佳实践
> - **UI 线程只做"派活 + 收结果"**：`await Task.Run(重活)` 拿到结果再更新界面，重活本身不放 UI
> - **轮询循环用 `CancellationToken` 替代裸 bool**：代码更规范、可配合超时（见 `取消异步操作`）
> - **`Task.Delay` 间隔放在"干活之后"**：先干活再延时，循环周期更准；把延时放干活前会漂移
> - **短任务频繁创建用线程池**：`Task.Run` 开箱即用；长驻线程（串口监听）才考虑专用线程（见 `线程池-vs-专用线程`）
> - **并发任务聚合用 `Task.WhenAll`**：多个 `Task.Run` 并行后统一等待，别一个接一个 `await`（见 `并行任务whenallwhenany`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例观察 5 次轮询日志与线程 ID；把 `Task.Delay(800)` 改为 100 和 3000，观察节奏变化；点"停止轮询"验证中途退出
> **Lv.2 加属性**：给轮询加一个"采集次数" `TextBlock` 实时显示；把模拟温度改成 `Random` 波动（40~60℃），日志加最大/最小值统计
> **Lv.3 改造**：用 `CancellationTokenSource` 替换 `_running` 标志：`Start` 时建 `cts`，`Stop` 时 `cts.Cancel()`，循环里 `token.ThrowIfCancellationRequested()`，体会标准取消模式
> **Lv.4 挑战**：写"双通道并行采集"：用两个 `Task.Run` 分别模拟温度、压力采集（不同延时），配合 `await Task.WhenAll` 汇总后一次刷新界面；尝试给两个通道分别设置采集周期

> [!related] 相关知识链接
> - ← 前置知识：`主线程与后台线程`（后台任务的意义）、`async-与-await-详解`（await 机制）
> - → 后续必学：`取消异步操作`（CancellationToken 规范）、`从-ui-线程安全更新控件`（结果回 UI 的正确姿势）
> - ⇄ 关联概念：`dispatchertimer`（UI 线程定时器对比）、`定时数据采集模式`（轮询实战）、`线程池-vs-专用线程`（选型）
> - 📖 官方文档：[Task.Run 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.run)、[Task.Delay 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.delay)、[基于任务的异步模式](https://learn.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
