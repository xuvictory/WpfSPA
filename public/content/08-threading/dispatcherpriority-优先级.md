---
title: DispatcherPriority 优先级
section: 08-threading
parent: 8.2 Dispatcher 调度器
---

# DispatcherPriority 优先级

> [!plain] 白话理解
> 后台线程给 UI 线程"寄快递"时，可以在包裹上贴一张"加急等级"标签。`DispatcherPriority` 就是这套等级：**用户输入（Input）是加急件，数据绑定（DataBind）是普通件，后台图表重绘（Background）是慢件**。UI 线程每处理完一个消息，就按等级从高到低取快递：先回应用户点击，再刷新数据绑定，最后才去重绘低优先级的后台任务。这样即使采集线程疯狂投递刷新任务，用户点按钮依然秒回。不做分级，低优先级的大量刷新会把 UI 线程塞满，用户操作被无限延后，体验和"卡死"没区别。
>
> 一句话：**优先级决定了"同一时刻投递的多个 UI 任务，谁先被处理"**。

> [!def] 官方定义
> - **`System.Windows.Threading.DispatcherPriority`**：枚举类型，定义 UI 线程消息循环中队列项的调度优先级。数值越大优先级越高，UI 线程从高到低处理各优先级队列。
> - 常用值（从低到高）：`ApplicationIdle`（0，空闲）、`Background`（4，后台渲染/低优先级工作）、`DataBind`（8，数据绑定系统默认使用）、`Normal`（9，默认值）、`Input`（5 之前的历史版本为 5，实际输入优先级更高，`SystemIdle` 之下）、`Render`（7，渲染）、`Send`（10，最高，等价同步执行）。
> - 注意：枚举数值有历史调整（Input=5、Render=7、Send=10 为常见引用），实际语义是"相对顺序"，不必死记数值。
> - **`Dispatcher.BeginInvoke(Delegate, DispatcherPriority)`** 指定优先级；不传时默认 `Normal`。
> - 数据绑定默认在 `DataBind` 优先级刷新，所以"改属性立即刷新界面"其实也是排队等 UI 线程处理的。
> - 📖 官方文档：[DispatcherPriority 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcherpriority)、[WPF 线程模型](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/threading-model)

> [!origin] 由来背景
> Win32 消息循环只有"先进先出"一种顺序，输入消息（WM_MOUSE、WM_KEY）与绘制消息（WM_PAINT）混排，程序员需要手动维护 UI 响应。WPF 的 Dispatcher 引入了**多级优先级队列**：输入、数据绑定、渲染、空闲等工作按类别入队，框架根据当前系统状态（是否有输入、是否需要渲染）决定每轮处理哪个队列。这样即使某个低优先级任务积压，也不会饿死用户输入。该设计延续自 WPF 诞生（2006），至今未变，是保证"高负载下界面仍可操作"的关键机制。

> [!essentials] 核心要点
> - **优先级只影响"同一线程队列内"的顺序**：跨线程调度时，优先级决定委托在 UI 线程队列中的位置
> - **默认 `Normal`**：不指定优先级时走 `Normal`，绝大多数场景够用
> - **数据绑定用 `DataBind`**：`INotifyPropertyChanged` 的属性变更通知在 `DataBind` 优先级排队刷新
> - **用户输入 `Input` 高于普通任务**：`BeginInvoke(..., Input)` 可让"必须立刻响应"的 UI 更新插到普通任务前面
> - **`Background` 适合非关键批量刷新**：图表重绘、日志列表渲染等可延后的工作丢 `Background`，避免挤占交互
> - **`Send` 等效同步**：用 `Send` 优先级投递的委托会被立即执行，等价于 `Invoke`

> [!example] 完整示例
> **DispatcherPriority 优先级演示：后台渲染与高优先级的执行顺序：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DispatcherPriority 优先级" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="DispatcherPriority 优先级" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 同时按不同优先级投递多个回调 -->
>         <Button Content="按不同优先级投递回调" Click="OnPostClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="170" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnPostClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "开始投递（优先级高的先执行）：\r\n";
>             var dispatcher = Dispatcher;
>
>             // 先投递低优先级（后台渲染），再投递高优先级（用户输入）
>             dispatcher.BeginInvoke(new Action(() =>
>                 LogText.Text += "[Background] 低优先级：后台图表重绘\r\n"),
>                 DispatcherPriority.Background);
>
>             dispatcher.BeginInvoke(new Action(() =>
>                 LogText.Text += "[Input] 高优先级：用户输入响应\r\n"),
>                 DispatcherPriority.Input);
>
>             dispatcher.BeginInvoke(new Action(() =>
>                 LogText.Text += "[DataBind] 中优先级：数据绑定刷新\r\n"),
>                 DispatcherPriority.DataBind);
>
>             // Normal 优先级在 Input 之后执行
>             dispatcher.BeginInvoke(new Action(() =>
>                 LogText.Text += "[Normal] 普通优先级：日志刷新\r\n"),
>                 DispatcherPriority.Normal);
>
>             LogText.Text += "投递完成，按优先级排序执行 →\r\n";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **用户操作必须"秒回"的更新**：急停确认弹窗、参数下发回显，用 `Input` 优先级插队，避免被批量刷新排队挡住
> ✅ **大批量后台渲染让路**：趋势图重绘、日志列表追加几百行，用 `Background` 优先级，不抢交互
> ✅ **理解数据绑定为何"有时滞后"**：属性改了界面没立刻变，往往就是 `DataBind` 优先级在排队，等本帧空闲才刷新
> ❌ **追求绝对实时的关键逻辑**：优先级只是"排队顺序"，不是抢占式调度，UI 线程正忙时高优先级照样等
> ❌ **滥用 `Send`/`Input` 做普通刷新**：每个刷新都插队会打乱渲染节奏，反而造成闪烁与开销

> [!pitfall] 常见踩坑
> 坑 1：**以为优先级能"抢占"正在执行的 UI 代码** → 现象：高优先级任务还是等了一会儿才执行 → 原因：UI 线程正在跑一个长委托，队列再高也得等它跑完 → 解决：长委托本身要拆小或放后台，优先级只解决"排队顺序"
>
> 坑 2：**所有刷新都用默认 `Normal`，用户操作被挤** → 现象：采集线程每 10ms 投递一次刷新，用户点按钮明显延迟 → 原因：`Normal` 任务积压，输入队列虽高但每轮处理间隙小 → 解决：刷新用 `Background`，让输入队列有机会插进来
>
> 坑 3：**用 `Input` 投递高频数据刷新** → 现象：界面闪烁、输入反而受影响 → 原因：数据刷新不应挤占输入队列，语义用错 → 解决：数据/图表刷新用 `DataBind` 或 `Background`，`Input` 只留给真正的交互响应

> [!best] 最佳实践
> - **数据刷新默认走 `DataBind`/`Normal`**：与 WPF 数据绑定节奏一致，不必手动指定
> - **非关键、大批量更新统一 `Background`**：一个 `const DispatcherPriority BackgroundRefresh = DispatcherPriority.Background;` 常量，全项目复用
> - **用户交互反馈用 `Input` 但别滥用**：仅限急停、报警确认这类"必须马上看到"的场景
> - **用 `DispatcherTimer` 降频代替高优先级**：刷新任务太多时，先降频率再谈优先级（见 `dispatchertimer`）
> - **调试时在日志里带上优先级**：`DispatcherOperation.Priority` 能打印实际生效的优先级，排查"为什么这个任务跑这么晚"

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例观察输出顺序为 Input → DataBind → Normal → Background（与投递顺序无关）；把 Input 那行改成 Send，观察它变成第一个立即执行
> **Lv.2 加属性**：在示例中加一个 `Background` 优先级的循环任务（`while` 投递 100 次），同时再投递一个 `Input` 任务，观察 `Input` 始终先执行，验证高优先级插队
> **Lv.3 改造**：把"批量日志追加"改成 `Background` 优先级：模拟 500 行日志一次 `BeginInvoke`，比较 `Normal` 与 `Background` 下拖动窗口的流畅度差异
> **Lv.4 挑战**：实现一个"优先级队列观察器"：在 UI 上用一个 ComboBox 选优先级、一个按钮投递、一个 ListBox 实时显示执行顺序，验证 5 种优先级相对顺序

> [!related] 相关知识链接
> - ← 前置知识：`dispatcherinvoke-与-begininvoke`（调度基础）、`为什么不能跨线程访问控件`（为什么要调度）
> - → 后续必学：`dispatchertimer`（定时刷新与优先级配合）、`检查是否需要调度`（CheckAccess 优化）
> - ⇄ 关联概念：`async-与-await-详解`（await 默认在 DataBind 后恢复 UI 上下文）、`定时数据采集模式`（低优先级批量刷新典型应用）
> - 📖 官方文档：[DispatcherPriority 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcherpriority)、[Dispatcher.BeginInvoke 方法](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.threading.dispatcher.begininvoke)
