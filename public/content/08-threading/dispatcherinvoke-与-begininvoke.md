---
title: Dispatcher.Invoke 与 BeginInvoke
section: 08-threading
parent: 8.2 Dispatcher 调度器
---

# Dispatcher.Invoke 与 BeginInvoke

> [!plain] 白话理解
> 假设你是产线调度员（后台线程），要把一批生产数据交给主控室（UI 线程）刷新屏幕。`Dispatcher.Invoke` 就像**发传真并盯着对方签收**：你把数据传过去，站在原地等对方回复"收到"才去干下一件事；`Dispatcher.BeginInvoke` 则像**发完邮件就走**：把数据发到主控室的收件箱（消息队列），立刻转身继续处理新任务，主控室有空了自然会看。传真适合"必须确认结果再继续"的场景（比如取界面上的用户输入）；邮件适合"刷状态、记日志、不阻塞采集"的高频场景。
>
> 一句话：**Invoke 等结果、BeginInvoke 不等结果**——选错会造成死锁或界面卡顿。

> [!def] 官方定义
> - **`Dispatcher.Invoke`（同步调度）**：`System.Windows.Threading.Dispatcher.Invoke(Delegate)` 将委托压入 UI 线程的调度队列，**阻塞调用方线程**直到委托在 UI 线程执行完成并返回结果（或抛出异常）。适合需要返回值、需要确认执行完毕的场景。
> - **`Dispatcher.BeginInvoke`（异步调度）**：`Dispatcher.BeginInvoke(Delegate, DispatcherPriority)` 将委托**异步排队**后立即返回一个 `System.Windows.Threading.DispatcherOperation`，调用方不等待 UI 线程执行，也不接收其结果。适合高频、非关键路径的 UI 更新。
> - **`DispatcherPriority`**：排队优先级，决定委托在队列中的顺序（`Background` 最低、`Normal` 默认、`Render` 在渲染前执行、`Send` 最高即等效同步），详见 `dispatcherpriority-优先级`。
> - 📖 官方文档：[Dispatcher 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcher)、[DispatcherPriority 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcherpriority)

> [!origin] 由来背景
> Dispatcher 的消息泵源自 Win32 消息循环（`GetMessage`/`DispatchMessage`）与 WinForms 的 `Control.Invoke` 机制。WPF 把它升级为"调度器（Dispatcher）"：UI 线程运行一个消息循环，`Invoke`/`BeginInvoke` 把工作项投递到该循环。`Invoke` 语义对应 WinForms 的 `Invoke`（同步），`BeginInvoke` 对应 `BeginInvoke`（异步）。随着 `async/await`（C# 5.0，2012）普及，多数场景可用 `await` 代替手动调度，但理解二者的同步/异步语义仍是排查死锁、卡顿的基础。

> [!essentials] 核心要点
> - **`Invoke` 会阻塞调用线程**：后台线程调用 `Invoke` 后停住，直到 UI 线程执行完委托——UI 线程忙（如渲染大窗口）时后台会一直等
> - **`BeginInvoke` 不阻塞**：排队后立即返回，委托按优先级在 UI 线程空闲时执行
> - **同线程调用 `Invoke` 会死锁**：UI 线程内 `Dispatcher.Invoke(...)` 会等待一个永远不会执行的队列项，必须先 `CheckAccess()` 或只用 `BeginInvoke`
> - **`DispatcherOperation.Status`**：`BeginInvoke` 返回的操作对象可查询状态（`Pending`/`Executing`/`Completed`），也可 `Abort()` 撤销未执行项
> - **异常处理差异**：`Invoke` 把委托异常直接抛给调用方；`BeginInvoke` 的委托异常会进入 `DispatcherUnhandledException` 或 Task 的异常流程，不 try/catch 则容易"静默丢失"

> [!example] 完整示例
> **Dispatcher.Invoke 与 BeginInvoke 演示：同步 vs 异步调度到 UI 线程：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Dispatcher.Invoke 与 BeginInvoke" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="Invoke 与 BeginInvoke 对比" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- Invoke：同步阻塞，等 UI 线程执行完才返回 -->
>         <Button Content="后台线程 Invoke（同步等待结果）" Click="OnInvokeClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <!-- BeginInvoke：异步投递，立即返回不等待 -->
>         <Button Content="后台线程 BeginInvoke（异步不等待）" Click="OnBeginInvokeClick"
>                 Margin="0,5" Padding="8" Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="150" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading;
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // Invoke：同步调度，后台线程会一直等 UI 线程执行完才继续
>         private void OnInvokeClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             new Thread(() =>
>             {
>                 AppendLog("后台线程：准备调用 Invoke（会阻塞等待）");
>                 Dispatcher.Invoke(() =>
>                 {
>                     AppendLog("UI 线程：正在执行 Invoke 的回调…");
>                     Thread.Sleep(500); // 模拟 UI 线程忙
>                     AppendLog("UI 线程：Invoke 回调执行完毕");
>                 });
>                 AppendLog("后台线程：Invoke 已返回，继续执行");
>             }).Start();
>         }
>
>         // BeginInvoke：异步调度，投递后立即返回，不等待 UI 执行
>         private void OnBeginInvokeClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             new Thread(() =>
>             {
>                 AppendLog("后台线程：准备调用 BeginInvoke（不等待）");
>                 Dispatcher.BeginInvoke(new Action(() =>
>                 {
>                     AppendLog("UI 线程：正在执行 BeginInvoke 的回调…");
>                     Thread.Sleep(500);
>                     AppendLog("UI 线程：BeginInvoke 回调执行完毕");
>                 }), DispatcherPriority.Normal);
>                 AppendLog("后台线程：BeginInvoke 立即返回，继续执行");
>             }).Start();
>         }
>
>         // 日志统一回到 UI 线程追加
>         private void AppendLog(string line) =>
>             Dispatcher.Invoke(() => LogText.Text += line + Environment.NewLine);
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **Invoke：需要 UI 线程的执行结果**——后台线程要读取 `TextBox` 里的参数再继续计算，`Invoke` 能拿返回值
> ✅ **Invoke：必须保证顺序**——采集到一条数据、立刻确认它已显示到界面（如单次确认消息），再取下一条
> ✅ **BeginInvoke：高频状态刷新**——模拟量、状态灯每秒更新几十次，异步排队不拖累采集循环
> ✅ **BeginInvoke：日志/流水追加**——多个后台线程并发写日志，异步排队天然串行、不乱序
> ❌ **BeginInvoke：需要立即确认结果**——用错会读到旧值/空值，出现"数据看起来没更新"
> ❌ **Invoke：UI 线程正忙时调用**——UI 在渲染大界面时，后台线程的 `Invoke` 会长时间阻塞，形成假死

> [!pitfall] 常见踩坑
> 坑 1：**UI 线程里调 `Dispatcher.Invoke` 等自己** → 现象：程序完全卡死，无响应 → 原因：UI 线程排队一个"需要 UI 线程执行"的委托，而 UI 线程正等它完成，形成自死锁 → 解决：调用前 `Dispatcher.CheckAccess()`，同线程直接执行；或把方法整体做成 `async` 用 `await`
>
> 坑 2：**后台线程 `Invoke` + UI 线程也等后台** → 现象：两边都卡住（经典交叉死锁）→ 原因：后台 `Invoke` 等 UI，UI 事件处理又 `.Wait()` 等后台 Task → 解决：UI 侧不要 `.Wait()`/`.Result`，用 `async/await`（详见 `async-与-await-详解` 的死锁章节）
>
> 坑 3：**`BeginInvoke` 委托里抛异常"没反应"** → 现象：功能没生效但控制台也看不到错误 → 原因：`BeginInvoke` 异步执行，异常不进调用方 try/catch → 解决：委托内部自己 try/catch，或在 `Application.DispatcherUnhandledException` 里统一记录

> [!best] 最佳实践
> - **优先 `async/await`**：`await` 后自然回 UI 上下文，比手动 `Invoke` 少一层心智负担（见 `async-与-await-详解`）
> - **高频刷新用 `BeginInvoke` + 降频**：采集循环里每 100ms 才投递一次，避免 UI 队列积压
> - **`Invoke` 的返回值用 `Dispatcher.Invoke<T>(Func<T>)`**：后台线程读界面参数时类型安全、不用 cast
> - **用 `Dispatcher.CurrentDispatcher` 前先确认上下文**：它拿的是"当前线程"的 Dispatcher，后台线程调用会拿到一个没有窗口的 Dispatcher，白忙
> - **`IProgress<T>` 内部也走调度**：MVVM/采集场景用 `Progress<T>` 汇报进度，代码比手写 `BeginInvoke` 更干净

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例分别点两个按钮，观察日志顺序：Invoke 是"后台→UI→UI→后台"，BeginInvoke 是"后台→后台→UI→UI"；把 UI 线程 `Thread.Sleep(500)` 改成 2000，对比阻塞差异
> **Lv.2 加属性**：给 BeginInvoke 的 `DispatcherOperation` 存到字段，再点一个"撤销未执行操作"按钮调用 `operation.Abort()`，观察日志不再追加
> **Lv.3 改造**：把 OnInvokeClick 改造成 `async`：`await Dispatcher.InvokeAsync(...)`（WPF 4.5+），验证 `InvokeAsync` 是"异步等待"语义，后台不再阻塞
> **Lv.4 挑战**：实现"带返回值"的 Invoke：后台线程用 `Dispatcher.Invoke(() => txtParam.Text)` 读取界面上的间隔秒数，据此动态调整采集循环的睡眠时长

> [!related] 相关知识链接
> - ← 前置知识：`为什么不能跨线程访问控件`（为什么必须调度）、`主线程与后台线程`（线程模型）
> - → 后续必学：`dispatcherpriority-优先级`（排队顺序如何决定）、`检查是否需要调度`（CheckAccess 优化）
> - ⇄ 关联概念：`async-与-await-详解`（现代替代方案）、`从-ui-线程安全更新控件`（IProgress 方式）、`死锁的成因与避免`（交叉等待的本质）
> - 📖 官方文档：[Dispatcher 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcher)、[DispatcherPriority 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcherpriority)
