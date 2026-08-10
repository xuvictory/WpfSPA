---
title: Window 常用事件（Loaded、Closing 等）
section: 01-quickstart
parent: 1.4 窗口 Window 详解
---

# Window 常用事件（Loaded、Closing 等）

> [!plain] 白话理解
> 一个窗口的一生有几个关键瞬间：刚出生时（Loaded——布局完成、控件可用）、要关门时（Closing——门把手已经转了但门还没合上）、门关了（Closed——永远锁死了）、内容变了（ContentRendered——第一次画完界面）、被激活了（Activated——用户点了一下这个窗口）。你可以在这些关键时刻"拦住"窗口，做一些该做的事。上位机最常见：Loaded 时启动 PLC 通信、Closing 时保存窗口位置和配置、Closed 时释放硬件资源。

> [!def] 官方定义
> Window 类提供的生命周期事件包括：`SourceInitialized`（窗口句柄创建完成，可调用 Win32 API）→ `Loaded`（布局系统完成，所有控件可用）→ `ContentRendered`（内容首次渲染完成）→ `Activated`/`Deactivated`（窗口获得/失去焦点）→ `Closing`（关闭前，可取消 `e.Cancel = true`）→ `Closed`（已关闭，窗口对象即将销毁）→ `Unloaded`（从可视化树移除）。此外还有 `LocationChanged`（移动）、`StateChanged`（最小化/最大化/还原）、`SizeChanged`（尺寸变化）。

> [!origin] 由来背景
> WinForms 的事件顺序比较简单：Load → Activated → Closing → Closed。WPF 把这套事件系统升级为"路由事件 + CLR 事件"双层模型，并增加了 `ContentRendered`（界面完成渲染的确切时刻）、`SourceInitialized`（底层窗口句柄可用的时刻）等更精细的事件。这对于需要精确控制窗口行为的工控软件非常重要——比如上位机全屏窗口必须在 `SourceInitialized` 之后才能调用 Win32 API 隐藏鼠标光标。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - **Loaded**：所有控件初始化完毕，布局计算完成——这是做初始化工作的最佳时机（如启动定时器、连接 PLC）
> - **Closing**：窗口即将关闭，通过 `e.Cancel = true` 可以阻止关闭——实现"有未保存数据时确认退出"
> - **Closed**：窗口已关闭，适合释放资源——但窗口对象尚未被 GC，属性仍可读取
> - **ContentRendered**：第一次绘制完成，适合在此时执行"不希望在界面白屏时执行"的操作
> - **Activated/Deactivated**：上位机常用——切换到本窗口时刷新实时数据，切走时暂停轮询
> - **StateChanged**：最小化/最大化/还原时触发，可用来做"最小化到托盘"

> [!example] 完整示例
> 演示窗口全生命周期事件——一个带日志追踪的数据采集窗口。
>
> ```xml
> <!-- WindowEventsDemo.xaml -->
> <Window x:Class="HmiDemo.WindowEventsDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="窗口事件演示" Height="480" Width="600"
>         Background="#0D1117">
>     <Grid Margin="16">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>        
>         <TextBlock Grid.Row="0" Text="📋 窗口生命周期事件日志" FontSize="18"
>                    FontWeight="Bold" Foreground="#FF6B35" Margin="0,0,0,10"/>
>        
>         <!-- 事件日志列表 -->
>         <ListBox Grid.Row="1" x:Name="lbLog" Background="#161B22"
>                  Foreground="#3FB950" FontFamily="Consolas" FontSize="12"
>                  BorderThickness="0"/>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // WindowEventsDemo.xaml.cs
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo;
>
> public partial class WindowEventsDemo : Window
> {
>     private DispatcherTimer? _dataTimer;
>     private bool _hasUnsavedData;
>
>     public WindowEventsDemo()
>     {
>         InitializeComponent();
>        
>         // 注册所有生命周期事件
>         Loaded += Window_Loaded;
>         ContentRendered += Window_ContentRendered;
>         Activated += Window_Activated;
>         Deactivated += Window_Deactivated;
>         Closing += Window_Closing;
>         Closed += Window_Closed;
>         StateChanged += Window_StateChanged;
>         LocationChanged += Window_LocationChanged;
>        
>         Log("构造函数：InitializeComponent 完成");
>     }
>
>     // ====== Loaded —— 布局完成，控件可用 ======
>     private void Window_Loaded(object sender, RoutedEventArgs e)
>     {
>         Log("🟢 Loaded：窗口布局完成，所有控件已可用");
>        
>         // 最佳初始化时机——启动数据采集定时器
>         _dataTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         _dataTimer.Tick += (s, args) =>
>         {
>             Log($"📡 采集数据... (时间: {DateTime.Now:HH:mm:ss})");
>             _hasUnsavedData = true; // 模拟产生数据
>         };
>         _dataTimer.Start();
>        Log("→ 数据采集定时器已启动");
>     }
>
>     // ====== ContentRendered —— 首次渲染完成 ======
>     private void Window_ContentRendered(object? sender, EventArgs e)
>     {
>         Log("🎨 ContentRendered：内容首次渲染完成，界面不再白屏");
>     }
>
>     // ====== Activated —— 窗口获得焦点 ======
>     private void Window_Activated(object? sender, EventArgs e)
>     {
>         Log("👁 Activated：窗口获得焦点——恢复数据刷新");
>         _dataTimer?.Start(); // 恢复定时器
>     }
>
>     // ====== Deactivated —— 窗口失去焦点 ======
>     private void Window_Deactivated(object? sender, EventArgs e)
>     {
>         Log("👁‍🗨 Deactivated：窗口失去焦点——暂停数据刷新（节省CPU）");
>         _dataTimer?.Stop(); // 暂停定时器：切到其他窗口时不做无谓刷新
>     }
>
>     // ====== Closing —— 关闭前（可阻止） ======
>     private void Window_Closing(object? sender,
>         System.ComponentModel.CancelEventArgs e)
>     {
>         Log("🔶 Closing：窗口正在关闭...");
>        
>         // 如果有未保存数据，给用户确认的机会
>         if (_hasUnsavedData)
>         {
>             var result = MessageBox.Show(
>                 "还有未保存的采集数据，确定要退出吗？",
>                 "确认退出",
>                 MessageBoxButton.YesNo,
>                 MessageBoxImage.Warning);
>            
>             if (result == MessageBoxResult.No)
>             {
>                 e.Cancel = true;  // ← 阻止关闭
>                 Log("→ 用户取消关闭");
>                 return;
>             }
>         }
>        
>         // 允许关闭前做清理
>         _dataTimer?.Stop();
>         Log("→ 定时器已停止，保存窗口状态...");
>     }
>
>     // ====== StateChanged —— 窗口状态变化 ======
>     private void Window_StateChanged(object? sender, EventArgs e)
>     {
>         string state = WindowState switch
>         {
>             WindowState.Normal => "正常",
>             WindowState.Maximized => "最大化",
>             WindowState.Minimized => "最小化",
>             _ => "未知"
>         };
>         Log($"📐 StateChanged：窗口状态变为 [{state}]");
>     }
>
>     // ====== LocationChanged —— 窗口移动 ======
>     private void Window_LocationChanged(object? sender, EventArgs e)
>     {
>         // 注意：移动时频繁触发，生产环境建议做节流
>         // Log($"📍 LocationChanged：新位置 ({Left:F0}, {Top:F0})");
>     }
>
>     // ====== Closed —— 已关闭 ======
>     private void Window_Closed(object? sender, EventArgs e)
>     {
>         // Closed 事件中不能再阻止关闭，只能做最终清理
>         Log("🔴 Closed：窗口已关闭——释放硬件资源");
>         // 实际项目中：释放 PLC 连接、关闭串口、释放非托管内存等
>     }
>    
>     // 日志辅助方法
>     private void Log(string msg)
>     {
>         var log = $"[{DateTime.Now:HH:mm:ss.fff}] {msg}";
>         lbLog.Items.Insert(0, log);
>         System.Diagnostics.Debug.WriteLine(log);
>     }
> }
> ```

> [!scene] 适用场景
> ✅ Loaded——启动数据采集/PLC 通信/DispathcerTimer、加载配置文件、恢复上次窗口位置和大小
> ✅ Closing——检查未保存数据、"新建窗口"询问保存路径、记录窗口退出日志
> ✅ ContentRendered——在界面完全显示后才执行耗时初始化（先显示窗口骨架，用户不会觉得卡）
> ✅ Activated/Deactivated——切换到本软件时刷新数据，切走时暂停轮询（工控机可能同时开多个软件）
> ✅ StateChanged——最小化到系统托盘、最大化时调整内部布局
> ❌ 把大量业务逻辑写在事件中——应该调用 Service/Manager 层的方法，事件只做调度

> [!pitfall] 常见踩坑
> 坑 1：**Loaded 事件触发多次** → 每当窗口从可视化树移除再添加，Loaded 就会重新触发。所以不要在 Loaded 中做"只应执行一次"的初始化（如注册全局键盘钩子）。用 `_isInitialized` 标志位控制
> 
> 坑 2：**Closing 中弹 MessageBox 后仍然关闭了窗口** → 如果用户点的是 MessageBox 的"关闭"按钮（X按钮），返回值可能不是 No，导致逻辑没拦住。正确写法：明确比较 `== MessageBoxResult.No` 时才 Cancel
>
> 坑 3：**Closed 事件中访问控件抛 ObjectDisposedException** → Closed 时窗口控件已经释放（Disposed），访问 TextBlock.Text 等可能出异常。Closed 中应只释放非托管资源，不要操作 UI 控件

> [!best] 最佳实践
> - 复杂的 Loaded 逻辑用 `async void` 异步执行：`Loaded += async (s, e) => { await LoadDataAsync(); };`
> - Closing 事件中设定一段"退出超时时间"——上位机断开 PLC 连接可能需要2-3秒，但别让用户无限等待
> - Deactivated 时暂停 DispatcherTimer，Activated 时恢复——工控机多任务运行时能明显降低 CPU 占用
> - LocationChanged 和 SizeChanged 做节流处理（Throttle），窗口拖拽时这些事件能一秒触发上百次

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的窗口事件日志 Demo，分别做以下操作观察事件触发顺序：启动 → 最小化 → 还原 → 切换到其他窗口 → 切回来 → 关闭窗口
> **Lv.2 小试牛刀**：在 Loaded 中恢复上次关闭时的窗口位置（保存到 App.config 或 JSON 文件），在 Closing 中保存当前窗口位置
> **Lv.3 融会贯通**：实现"最小化到系统托盘"——StateChanged 检测到 Minimized 时 `Hide()` + `ShowInTaskbar = false`，托盘图标点击时 `Show()` + `WindowState = Normal` + `Activate()`

> [!related] 相关知识链接
> - ← 前置知识：Window 常用属性（WindowState 与 StateChanged 事件联动）
> - ← 前置知识：Window 常用方法（Close() 触发 Closing/Closed 事件链）
> - ← 前置知识：应用程序事件（Application 级别 vs Window 级别的事件层级）
> - → 后续必学：窗口传值与数据交互（Closing 关闭前把数据传回主窗口）
> - ⇄ 关联概念：DispatcherTimer、路由事件（Routed Events）、Application.SessionEnding
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/windows/wpf-windows-overview
