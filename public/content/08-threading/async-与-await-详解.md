---
title: async 与 await 详解
section: 08-threading
parent: 8.3 Task 与 async 和 await
---

# async 与 await 详解

> [!plain] 白话理解
> `async/await` 是 C# 为"不阻塞地等待"发明的语法糖，可以理解为**把一段代码切成两半的"记笔记"机制**：UI 线程执行到 `await` 时，先在心里记下"等这个 Task 完成后再继续做后面的事"，然后把线程让出来去处理其他事（渲染、点击、刷新），等 Task 完成时再回来接着做。这就好比车间主任把"等设备回参数"这种 2 秒的等待交给了机器（Task），自己先去处理别的工单，设备一响铃（Task 完成）再回来继续。**最关键的是：`await` 之后的代码默认回到"发起 await 时的线程"**——在 UI 线程发起，await 后依然在 UI 线程，更新控件无需任何 `Dispatcher`。
>
> 一句话：**await 让线程"等但不占着"，回来时还在原线程，所以 UI 代码写完就能直接更新控件**。

> [!def] 官方定义
> - **`async`**：C# 修饰符（C# 5.0，2012 年随 .NET 4.5 引入），标记方法包含 `await` 表达式，方法返回值必须为 `Task`、`Task<T>` 或 `void`（仅事件处理器）。
> - **`await`**：运算符，对 `Task`/`Task<T>`/`ValueTask<T>` 执行"异步等待"。若 Task 未完成，方法挂起并把控制权交还给调用方，同时注册一个延续（continuation）；Task 完成后再恢复执行。**若当前线程有 `SynchronizationContext`（如 UI 线程），延续默认在该上下文上恢复**。
> - **`SynchronizationContext`**：抽象了"把回调投递到哪个线程"的机制。WPF 的 UI 线程有 `DispatcherSynchronizationContext`，因此 `await` 后自动回到 UI 线程。
> - **编译器状态机**：`async` 方法被编译为状态机（`IAsyncStateMachine`），`await` 处切分状态，异常与完成通过 `Task` 传播。
> - **async void 的例外**：`async void` 只允许用于事件处理器（`EventHandler`），其异常无法被调用方捕获，会直接抛到 `SynchronizationContext`（WPF 中即 `DispatcherUnhandledException`）。
> - 📖 官方文档：[异步编程（C#）](https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/)、[Task-based Asynchronous Pattern (TAP)](https://learn.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)、[SynchronizationContext 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.synchronizationcontext)

> [!origin] 由来背景
> 在 async/await 出现前，.NET 异步编程靠回调（`BeginInvoke`/`EndInvoke`、`IAsyncResult`），代码被"回调地狱"割裂，异常处理混乱。微软在 C# 5.0 / .NET 4.5（2012）引入 `async/await` 和 TAP 模式，让异步代码读起来像同步代码。它基于 `SynchronizationContext` 自动做线程切换：UI 线程发起的 `await` 自动回到 UI 上下文，开发者几乎不需要手动 `Dispatcher`。这一设计让"后台干活、前台刷新"的门槛大幅降低，成为现代 WPF 上位机开发的绝对主流。

> [!essentials] 核心要点
> - **`async` 不创建新线程**：它只是"标记可等待"，真正跑后台要配合 `Task.Run`；`await Task.Delay` 不占线程（走系统定时器）
> - **`await` 后自动回 UI 上下文**：UI 线程发起的 await，延续在 UI 线程执行，直接更新控件
> - **返回值 `Task<T>` 用 `await` 解包**：`int v = await SomeAsync();`，不要用 `.Result`（会阻塞、易死锁）
> - **`async void` 仅限事件处理器**：其他场合会吞异常、无法等待
> - **异常经 `Task` 传播**：`await` 会重新抛出被等待 Task 的异常，`try/catch` 包住 `await` 即可捕获
> - **方法命名约定**：返回 `Task` 的异步方法名以 `Async` 结尾（如 `ReadAsync`），这是 .NET 约定

> [!example] 完整示例
> **async / await 详解：异步加载设备参数并返回结果：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="async 与 await 详解" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="async / await 详解" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 同步版：阻塞线程，界面卡住 -->
>         <Button Content="同步加载设备参数（阻塞 UI）" Click="OnSyncLoadClick"
>                 Margin="0,5" Padding="8" Background="#DA3633" Foreground="White"/>
>         <!-- 异步版：await 期间界面可操作 -->
>         <Button Content="异步加载设备参数（await 不阻塞）" Click="OnAsyncLoadClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="ResultText" Foreground="#8B949E" TextWrapping="Wrap"
>                    Margin="0,10,0,0" MinHeight="120"/>
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
>         public MainWindow() => InitializeComponent();
>
>         // 同步版：Thread.Sleep 会阻塞调用线程，期间窗口无法响应
>         private void OnSyncLoadClick(object sender, RoutedEventArgs e)
>         {
>             ResultText.Text = "开始同步加载…（窗口已卡住）";
>             Thread.Sleep(2000); // 模拟串口读超时
>             ResultText.Text = $"同步加载完成，参数 = {LoadParams()}\r\n" +
>                               $"耗时 2 秒，期间 UI 被阻塞";
>         }
>
>         // 异步版：await 让出线程，不阻塞 UI
>         private async void OnAsyncLoadClick(object sender, RoutedEventArgs e)
>         {
>             ResultText.Text = "开始异步加载…（窗口可正常操作）";
>             string param = await LoadParamsAsync(); // 异步等待，UI 不卡
>             ResultText.Text = $"异步加载完成，参数 = {param}\r\n" +
>                               $"await 期间界面保持流畅";
>         }
>
>         // 模拟读取设备参数（同步耗时 2 秒）
>         private string LoadParams()
>         {
>             Thread.Sleep(2000);
>             return "速度 1500 RPM / 电流 3.2 A";
>         }
>
>         // 模拟读取设备参数（异步版本）
>         private async Task<string> LoadParamsAsync()
>         {
>             await Task.Delay(2000); // 异步等待，不占用线程
>             return "速度 1500 RPM / 电流 3.2 A";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **串口/TCP/HTTP 等 IO 等待**：`await SerialPort.ReadAsync`/`HttpClient.GetAsync` 等待期间 UI 全程可操作（第 9 章通信大量使用）
> ✅ **耗时计算的"让位"**：`await Task.Run(() => 图像处理)` 把 CPU 重活放线程池，完成自动回 UI 更新结果
> ✅ **窗口启动加载数据**：`Loaded` 事件里 `await LoadParamsAsync()` 填充下拉框，不阻塞窗口显示
> ✅ **定时轮询的等待**：`while (true) { await Task.Delay(500); ... }` 实现无阻塞周期任务
> ❌ **CPU 密集短任务**：`await Task.Run(() => 1+1)` 白开销，同步执行即可
> ❌ **后台类库不适合默认回 UI 上下文**：库代码（非 UI）应 `ConfigureAwait(false)` 避免无谓的上下文切换

> [!pitfall] 常见踩坑
> 坑 1：**用 `.Result` / `.Wait()` 阻塞等待异步方法** → 现象：UI 线程调用时界面完全卡死（死锁）→ 原因：`.Wait()` 阻塞 UI 线程，而异步方法要回到 UI 上下文完成延续，互相等待 → 解决：从 UI 事件开始就用 `async` + `await` 贯穿到底（"async all the way"），绝不 `.Result`
>
> 坑 2：**`async void` 滥用（非事件处理器）** → 现象：异常静默丢失、调用方无法 await → 原因：`async void` 异常直接抛给 `SynchronizationContext` → 解决：普通方法一律 `async Task`；事件处理器里的 `async void` 也要 try/catch 包住并记日志
>
> 坑 3：**`await` 后还想"回到后台线程"** → 现象：await 后代码又回到 UI 线程，后台处理被迫与 UI 竞争 → 原因：await 默认回原上下文 → 解决：重活放 `await Task.Run` 内，UI 上只做"拿到结果更新控件"；库代码加 `ConfigureAwait(false)`
>
> 坑 4：**忘记 `await` 直接调用异步方法** → 现象：结果还没好就执行下一行，拿到空值/未完成 Task → 原因：`LoadAsync()` 没加 `await`，返回的 Task 被忽略 → 解决：编译器警告 `CS4014` 不能无视，要么 `await` 要么显式 `.FireAndForget()` 处理异常

> [!best] 最佳实践
> - **async all the way**：从事件处理器到业务方法全链路 `async/await`，杜绝 `.Result`/`.Wait()`
> - **事件处理器里 `try/catch` 包住 `await`**：`async void` 的异常无处可逃，自己记录日志
> - **UI 更新放在 await 之后直接写**：不用 Dispatcher，WPF 上下文自动保证
> - **库/服务层加 `ConfigureAwait(false)`**：不依赖 UI 上下文的代码避免无谓切换，性能更好
> - **IO 等待用真正的异步 API**：`await` 串口/网络异步方法，比 `Task.Run` 包同步 API 更省线程
> - **配合 `CancellationToken`**：所有长等待都该传取消令牌，窗口关闭时优雅中止（见 `取消异步操作`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例点红色（同步）按钮观察卡顿，再点绿色（异步）按钮验证流畅；把 `Task.Delay(2000)` 改为 8000，观察异步版期间仍可拖窗口
> **Lv.2 加属性**：在异步加载开始时显示"加载中…"并禁用按钮，`await` 完成后恢复；给 `LoadParamsAsync` 加 `try/catch` 模拟抛异常，验证能捕获
> **Lv.3 改造**：新增"进度加载"：`LoadParamsAsync` 里循环 10 次 `await Task.Delay(200)`，用 `IProgress<string>` 汇报进度到 `ProgressBar`，体验"后台推进、UI 刷新"
> **Lv.4 挑战**：用 `async/await` 实现"多路并行采集"：`await Task.WhenAll(读温度, 读压力, 读流量)` 三个异步方法并发执行，全部完成后一次性更新界面；再对比串行 `await` 的总耗时（可先看 `并行任务whenallwhenany`）

> [!related] 相关知识链接
> - ← 前置知识：`主线程与后台线程`（线程模型）、`taskrun-与-taskdelay`（后台任务怎么开）
> - → 后续必学：`从-ui-线程安全更新控件`（await 后的 UI 更新模式）、`取消异步操作`（CancellationToken 配合）
> - ⇄ 关联概念：`dispatcherinvoke-与-begininvoke`（与手动调度对比）、`并行任务whenallwhenany`（多任务编排）、`backgroundworker-使用与对比`（老写法对比）
> - 📖 官方文档：[C# 异步编程](https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/)、[Task-based Asynchronous Pattern (TAP)](https://learn.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)、[异步编程模式](https://learn.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/)
