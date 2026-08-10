---
title: 应用程序事件（Startup、Exit 等）
section: 01-quickstart
parent: 1.3 应用程序生命周期
---

# 应用程序事件（Startup、Exit 等）

> [!plain] 白话理解
> Application 有一套"人生大事记"——Startup（出生）、Activated/Deactivated（睁眼/闭眼）、SessionEnding（世界末日/Windows关机）、Exit（离世）。你可以在这些关键时刻插入自己的代码，就像在人生的关键节点安排仪式。上位机开发最常用的三个：Startup 里初始化 PLC 连接、Exit 里安全关闭所有设备、SessionEnding 里紧急保存数据（防止 Windows 强行关机导致数据丢失）。

> [!def] 官方定义
> WPF 的 `Application` 类暴露了一系列生命周期事件：（1）`Startup`——应用程序启动后、主窗口打开前触发；（2）`Activated`/`Deactivated`——应用窗口获得/失去焦点时触发；（3）`SessionEnding`——用户注销或系统关机时触发，可取消关机；（4）`Exit`——应用程序正在关闭、窗口已销毁但进程未结束时触发。此外还有 `DispatcherUnhandledException` 用于捕获未处理异常。

> [!origin] 由来背景
> 在 WinForms 中，生命周期事件比较零散：`Application.ApplicationExit`、`Form.Load`、`Form.Closing` 分布在不同的类和事件中。WPF 将它们统一归集到了 Application 类中，提供了清晰的"从生到死"的事件链。特别是 `SessionEnding` 事件，解决了上位机最大的痛点——生产线上的工控机被操作工不小心关机了，如果没有这个事件，正在记录的生产数据就丢了。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - **Startup 事件**：在 `App.xaml` 中声明 `Startup="Application_Startup"` 或在后台订阅，在窗口创建之前执行初始化
> - **Exit 事件**：最后收到的事件，适合做清理工作（关闭日志文件、释放资源、断开数据库连接）
> - **SessionEnding 事件**：Windows 关机/注销时触发，可以 `e.Cancel = true` 阻止关机（给用户保存数据的机会）
> - **Activated/Deactivated 事件**：窗口获得/失去焦点时触发，上位机可用于"切换到此软件时自动刷新数据"
> - **DispatcherUnhandledException**：捕获 UI 线程未处理的异常，可将 `e.Handled = true` 防止程序崩溃

> [!example] 完整示例
> 演示所有关键生命周期事件的触发时机——一个带日志显示的事件追踪器。
>
> ```xml
> <!-- App.xaml -->
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
> </Application>
> ```
>
> ```csharp
> // App.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class App : Application
> {
>     // 用覆盖虚方法的方式订阅事件（比在构造函数中 += 更清晰）
>     protected override void OnStartup(StartupEventArgs e)
>     {
>         base.OnStartup(e);
>        
>         // 启动时初始化——这里是做"重活"的最佳位置
>         AppLog("🟢 应用启动");
>        
>         // 示例：加载配置文件
>         // var config = LoadConfiguration();
>        
>         // 示例：检查数据库连接
>         // if (!CheckDatabase()) MessageBox.Show("数据库连接失败!");
>     }
>
>     protected override void OnActivated(EventArgs e)
>     {
>         base.OnActivated(e);
>         AppLog("👁 应用窗口获得焦点——可以在这里刷新实时数据");
>     }
>
>     protected override void OnDeactivated(EventArgs e)
>     {
>         base.OnDeactivated(e);
>         AppLog("👁‍🗨 应用窗口失去焦点");
>     }
>
>     protected override void OnSessionEnding(SessionEndingCancelEventArgs e)
>     {
>         base.OnSessionEnding(e);
>        
>         var result = MessageBox.Show(
>             "Windows 正在关机/注销！\n\n是否保存当前数据并安全退出？",
>             "⚠ 系统关机警告",
>             MessageBoxButton.YesNo,
>             MessageBoxImage.Warning);
>        
>         if (result == MessageBoxResult.No)
>         {
>             e.Cancel = true; // 阻止关机（给用户时间保存）
>             AppLog("⚠ 用户取消了关机请求");
>         }
>         else
>         {
>             // 紧急保存数据
>             AppLog("⚡ 紧急保存数据...");
>             // SaveCriticalData();
>         }
>     }
>
>     protected override void OnExit(ExitEventArgs e)
>     {
>         AppLog($"🔴 应用退出（ExitCode: {e.ApplicationExitCode}）");
>         // 最终清理：关闭日志、释放非托管资源
>         base.OnExit(e);
>     }
>
>     // 异常处理——捕获未处理的异常防止程序崩溃
>     private void App_DispatcherUnhandledException(object sender,
>         System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
>     {
>         AppLog($"❌ 未处理异常: {e.Exception.Message}");
>        
>         MessageBox.Show($"发生未处理异常:\n{e.Exception.Message}\n\n" +
>             "程序将尝试继续运行。", "错误", 
>             MessageBoxButton.OK, MessageBoxImage.Error);
>        
>         e.Handled = true; // 标记已处理，防止程序崩溃
>     }
>
>     // 全局日志辅助方法（生产环境应写入文件）
>     public static event Action<string>? LogWritten;
>     public static void AppLog(string message)
>     {
>         var log = $"[{DateTime.Now:HH:mm:ss}] {message}";
>         System.Diagnostics.Debug.WriteLine(log);
>         LogWritten?.Invoke(log); // 通知 UI 更新
>     }
> }
> ```
>
> 配合 MainWindow 显示事件日志：
>
> ```xml
> <!-- MainWindow.xaml 关键部分 -->
> <Border Grid.Row="1" CornerRadius="8" Background="#161B22" Padding="12">
>     <ListBox x:Name="lbLog" Foreground="#3FB950" FontFamily="Consolas"
>              FontSize="12" Background="Transparent" BorderThickness="0"/>
> </Border>
> ```
>
> ```csharp
> // MainWindow.xaml.cs
> public MainWindow()
> {
>     InitializeComponent();
>     App.LogWritten += log => lbLog.Items.Insert(0, log);
> }
> ```

> [!scene] 适用场景
> ✅ Startup——加载配置、连接数据库/OPC、初始化日志系统、检查许可证
> ✅ Exit——断开所有连接、保存窗口状态（位置/大小）、写入关闭日志
> ✅ SessionEnding——上位机"防误关机"保护，紧急保存正在采集的数据
> ✅ Activated/Deactivated——切换到此应用时自动刷新数据，切走时暂停轮询（节约CPU）
> ✅ DispatcherUnhandledException——全局异常兜底，防止生产环境中程序无声崩溃
> ❌ 不要把大量业务逻辑塞进这些事件中——它们应该调用业务层的初始化/清理方法

> [!pitfall] 常见踩坑
> 坑 1：**在 Startup 事件中做同步耗时操作导致窗口迟迟不出来** → Startup 阻塞会延迟 UI 显示。应该用 `async void` 将耗时操作异步化，或者把初始化放到 MainWindow.Loaded 中分批进行
> 
> 坑 2：**SessionEnding 中 e.Cancel = true 滥用** → 虽然有权限阻止关机，但频繁阻止会让操作工反感。正确做法：只在有未保存数据时弹窗确认，默认允许关机
>
> 坑 3：**DispatcherUnhandledException 中直接 return 而不设 e.Handled = true** → 不设置 Handled 的话，异常继续向上传播，最终还是会导致程序崩溃。另外，这个事件只捕获 UI 线程的异常，后台线程异常用 `TaskScheduler.UnobservedTaskException`

> [!best] 最佳实践
> - 优先使用 `override OnXxx` 方法而不是在构造函数中 subscribe 事件——代码结构更清晰，不容易遗漏
> - Exit 事件中做好"优雅退出"：停止所有 Timer、断开所有 Socket、关闭所有文件流、释放所有非托管资源
> - SessionEnding 事件只需关心"有没有未保存数据"，不要在里面做复杂的 UI 操作（关机时系统给你的时间有限）
> - 上位机上线前必须测试：Windows 关机时程序是否能正常退出、数据是否丢失——这是工控系统的底线

> [!practice] 上手练习
> **Lv.1 照猫画虎**：复制上面的 App.xaml.cs 代码，覆盖 OnStartup 和 OnExit，运行后关闭窗口观察 VS 输出窗口中的日志
> **Lv.2 小试牛刀**：在 App 类中添加一个 `public static bool HasUnsavedData` 属性，MainWindow 中点击某个按钮设为 true。在 `OnSessionEnding` 中检查这个属性，决定是否阻止关机
> **Lv.3 融会贯通**：实现一个"启动耗时操作不阻塞 UI"的方案——OnStartup 中先快速打开 MainWindow（空壳），再用 Dispatcher.BeginInvoke 延迟加载重量级组件（数据库连接、PLC 通信）

> [!related] 相关知识链接
> - ← 前置知识：Application 类详解（理解 Application 的属性和方法）
> - ← 前置知识：App.xaml 的 StartupUri（Startup 事件的触发时机与 StartupUri 的关系）
> - → 后续必学：Application.Current 全局访问（在任何地方获取 Application 来订阅事件）
> - → 后续必学：ShutdownMode 属性（控制 Exit 事件何时触发）
> - → 后续必学：单实例应用实现（Startup 事件是实现单实例的关键时机）
> - ⇄ 关联概念：Window.Loaded/Closing 事件（窗口级别的生命周期）、TaskScheduler.UnobservedTaskException
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/application-management-overview
