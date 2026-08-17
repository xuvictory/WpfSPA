---
title: BackgroundWorker 使用与对比
section: 08-threading
parent: 8.4 BackgroundWorker
---

# BackgroundWorker 使用与对比

> [!plain] 白话理解
> `BackgroundWorker` 是 .NET 2.0 时代的"老式派遣单"：你填好三张表——**DoWork（后台干什么活）、ProgressChanged（干到哪报进度）、RunWorkerCompleted（干完怎么汇报）**，然后喊一声 `RunWorkerAsync()`，它就自动派一个线程去干活。它最大的功劳是：**进度和完成回调自动回到 UI 线程**，后台代码里完全不用写 Dispatcher。但它的缺点也很明显：事件满天飞、一个任务就要建一个对象、取消只能"请求"不能强制、异步组合（任务接任务）非常别扭。如今用 `async/await` + `Task` + `Progress<T>` 几行就能实现同样的效果，且更灵活。**学它的价值在于：读老项目时认得它，对比后知道新项目该用什么**。
>
> 一句话：**BackgroundWorker 是"能自动回 UI 的老式异步"，新代码优先 async/await，老代码遇到要会读**。

> [!def] 官方定义
> - **`System.ComponentModel.BackgroundWorker`**：.NET 2.0（2005）引入的组件，在后台线程执行操作并通过事件与 UI 线程通信。
> - 核心事件：`DoWork`（后台线程执行）、`ProgressChanged`（调用 `ReportProgress` 时触发，**运行在 UI 线程**）、`RunWorkerCompleted`（任务结束，**运行在 UI 线程**）。
> - 核心属性：`WorkerReportsProgress`（允许进度报告，默认 false）、`WorkerSupportsCancellation`（支持取消，默认 false）。
> - 核心方法：`RunWorkerAsync(object? argument)`（启动）、`ReportProgress(int percent, object? userState)`（报告进度）、`CancelAsync()`（请求取消）。
> - 取消语义：`CancelAsync` 只是设置 `CancellationPending = true`，后台代码必须主动检查并在 `DoWorkEventArgs.Cancel = true` 时退出，无法强制终止。
> - 📖 官方文档：[BackgroundWorker 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.backgroundworker)、[如何实现进度报告](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.backgroundworker.reportprogress)

> [!origin] 由来背景
> .NET 1.x 时代做后台任务要手写 `Thread` + 委托，还要自己处理"回 UI 线程"，门槛极高。.NET 2.0（2005）推出 `BackgroundWorker`，把"后台干活 + 进度回报 + 完成通知 + 请求取消"打包成一个组件，WinForms 率先大量使用。WPF 发布后也兼容使用它——其进度/完成回调通过捕获 `SynchronizationContext` 自动回 UI。但 .NET 4.0 的 TPL（Task）和 4.5 的 async/await 出现后，`Task.Run` + `await` + `Progress<T>` 以更少的代码覆盖了它的全部能力，还支持取消令牌、异常聚合、组合复用。`BackgroundWorker` 于是从"推荐方案"退为"历史兼容方案"，但大量存量上位机项目（尤其 WinForms 迁移项目）仍在使用，值得读懂。

> [!essentials] 核心要点
> - **三个事件分工明确**：`DoWork` 干后台活、`ProgressChanged` 报进度、`RunWorkerCompleted` 收尾，后两者自动回 UI 线程
> - **必须开开关才有效**：不设 `WorkerReportsProgress = true`，`ReportProgress` 会抛 `InvalidOperationException`
> - **`RunWorkerAsync` 只能跑一次**：同一个实例不能重复启动，重复使用要新建
> - **取消是协作式的**：`CancelAsync` 只置标志，`DoWork` 里要自己检查 `CancellationPending` 并退出，不会强杀线程
> - **异常封装**：`DoWork` 抛异常会在 `RunWorkerCompleted` 的 `e.Error` 中给出，需判空后使用
> - **不能传多个参数**：`RunWorkerAsync` 只能带一个 `object` 参数，多参数要自己包成对象/元组

> [!example] 完整示例
> **BackgroundWorker 使用演示：后台执行耗时任务并报告进度：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="BackgroundWorker 使用与对比" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="BackgroundWorker 进度报告" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 进度条展示后台任务进度 -->
>         <ProgressBar x:Name="Progress" Height="18" Maximum="100"
>                      Foreground="#58A6FF" Background="#0D1117"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E"
>                    TextWrapping="Wrap" Margin="0,8,0,10"/>
>         <!-- 启动与取消 -->
>         <Button x:Name="StartButton" Content="开始批量处理" Click="OnStartClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <Button x:Name="CancelButton" Content="取消处理" IsEnabled="False"
>                 Click="OnCancelClick" Margin="0,5" Padding="8"
>                 Background="#DA3633" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Threading;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private BackgroundWorker _worker;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnStartClick(object sender, RoutedEventArgs e)
>         {
>             StartButton.IsEnabled = false;
>             CancelButton.IsEnabled = true;
>             Progress.Value = 0;
>
>             // 创建并配置 BackgroundWorker
>             _worker = new BackgroundWorker
>             {
>                 WorkerReportsProgress = true,  // 允许报告进度
>                 WorkerSupportsCancellation = true // 支持取消
>             };
>             _worker.DoWork += OnDoWork;                 // 后台线程执行
>             _worker.ProgressChanged += OnProgressChanged; // 进度回调（UI 线程）
>             _worker.RunWorkerCompleted += OnCompleted;    // 完成回调（UI 线程）
>             _worker.RunWorkerAsync("批量处理 100 条记录");
>         }
>
>         // 后台线程：不能直接操作控件
>         private void OnDoWork(object sender, DoWorkEventArgs e)
>         {
>             for (int i = 1; i <= 100; i++)
>             {
>                 if (_worker.CancellationPending) // 检查取消请求
>                 {
>                     e.Cancel = true;
>                     return;
>                 }
>                 Thread.Sleep(40); // 模拟每条记录的处理耗时
>                 _worker.ReportProgress(i); // 上报进度
>             }
>             e.Result = $"处理完成，共 100 条记录";
>         }
>
>         // 进度更新：自动运行在 UI 线程，可直接操作控件
>         private void OnProgressChanged(object sender, ProgressChangedEventArgs e)
>         {
>             Progress.Value = e.ProgressPercentage;
>             StatusText.Text = $"正在处理… {e.ProgressPercentage}%";
>         }
>
>         // 完成回调：同样运行在 UI 线程
>         private void OnCompleted(object sender, RunWorkerCompletedEventArgs e)
>         {
>             if (e.Cancelled)
>                 StatusText.Text = "处理已被用户取消";
>             else if (e.Error != null)
>                 StatusText.Text = "处理出错：" + e.Error.Message;
>             else
>                 StatusText.Text = e.Result?.ToString();
>
>             StartButton.IsEnabled = true;
>             CancelButton.IsEnabled = false;
>         }
>
>         private void OnCancelClick(object sender, RoutedEventArgs e)
>         {
>             _worker?.CancelAsync(); // 请求取消
>             StatusText.Text = "已请求取消…";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **维护 WinForms/老 WPF 项目**：存量代码全是 BackgroundWorker，读懂才能改造迁移
> ✅ **一次性后台任务 + 进度**：简单的"导出报表、批量导入"且不想引入 async 的旧风格代码
> ✅ **逐步向 async 迁移的过渡**：新代码用 async/await，老功能暂不动，两套并存
> ❌ **新项目开发**：`Task.Run` + `await` + `Progress<T>` 更简洁，没必要再用 BackgroundWorker
> ❌ **需要组合/复用的异步流**：多个任务串联、并联、超时、取消传播，BackgroundWorker 都力不从心

> [!pitfall] 常见踩坑
> 坑 1：**忘了设 `WorkerReportsProgress = true` 就 `ReportProgress`** → 现象：抛 `InvalidOperationException` → 原因：开关未开 → 解决：构造后必须显式设置；不设 `WorkerSupportsCancellation` 就 `CancelAsync` 同理
>
> 坑 2：**重复 `RunWorkerAsync` 同一个实例** → 现象：抛"此 BackgroundWorker 当前正忙"异常 → 原因：实例不可复用 → 解决：每次启动新建实例，或在 `RunWorkerCompleted` 里置 null 便于重建
>
> 坑 3：**以为 `CancelAsync` 能强制停止** → 现象：点取消后任务还在跑 → 原因：取消是协作式，只置标志 → 解决：`DoWork` 循环里每步检查 `CancellationPending`，设置 `e.Cancel = true` 后 return；若卡在阻塞调用（如串口 Read）则无法中途停，需另设计超时
>
> 坑 4：**在 `DoWork` 里直接改控件** → 现象：跨线程访问异常 → 原因：DoWork 跑在后台线程 → 解决：界面更新只在 `ProgressChanged`/`RunWorkerCompleted` 里做（它们自动回 UI），后台只准备数据

> [!best] 最佳实践
> - **新代码用 `async/await` + `Progress<T>` 替代**：同功能代码量少一半，还支持 CancellationToken（见 `async-与-await-详解`、`从-ui-线程安全更新控件`）
> - **读老代码时把三事件对应关系画出来**：DoWork→ProgressChanged→RunWorkerCompleted 的触发链，对应现代写法的 Task.Run→IProgress.Report→await 后
> - **多参数用元组/自定义类**：`RunWorkerAsync((param1, param2))` 别为传参硬塞字段
> - **`RunWorkerCompleted` 里判空 `e.Error`**：后台异常必须展示，不能静默吞掉
> - **迁移策略**：把 `DoWork` 逻辑抽成普通方法（`Task RunJobAsync(IProgress<int>)`），事件壳逐层替换为 await

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例观察进度条与状态文本；把 `Thread.Sleep(40)` 改 100，处理更慢方便观察；中途点"取消处理"看协作式取消效果
> **Lv.2 加属性**：给 `ReportProgress(i)` 加第二个参数传对象：`_worker.ReportProgress(i, $"第{i}条:OK")`，在 `ProgressChanged` 里读 `e.UserState` 并显示到状态文本
> **Lv.3 改造**：把示例完整改写成 `async/await` 版：`Task.Run` + `Progress<int>` 替代 BackgroundWorker，逻辑等价、代码更短，对比两者差异
> **Lv.4 挑战**：做一个"新旧对照面板"：左半用 BackgroundWorker、右半用 async/await 执行相同"100 条记录批量处理"，各自显示进度与耗时，验证两者功能等价、async 版代码更少

> [!related] 相关知识链接
> - ← 前置知识：`主线程与后台线程`（后台任务基础）、`为什么不能跨线程访问控件`（为什么回调要回 UI）
> - → 后续必学：`async-与-await-详解`（现代替代方案）、`从-ui-线程安全更新控件`（Progress\<T\> 写法）
> - ⇄ 关联概念：`taskrun-与-taskdelay`（Task.Run 替代 RunWorkerAsync）、`取消异步操作`（CancellationToken 替代 CancelAsync）、`dispatcherinvoke-与-begininvoke`（底层调度）
> - 📖 官方文档：[BackgroundWorker 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.backgroundworker)、[Progress\<T\> 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.progress-1)
