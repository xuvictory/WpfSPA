---
title: Application 类详解
section: 01-quickstart
parent: 1.3 应用程序生命周期
---

# Application 类详解

> [!plain] 白话理解
> 如果把 WPF 程序比作一家公司，`Application` 就是这家公司的 CEO。它不干具体的活（那是各个 Window 和控件的事），但它掌控全局：公司什么时候开业（Startup）、什么时候关门（Exit）、各部门之间怎么协调（Application.Current 全局访问）。你写的每一行 WPF 代码，都运行在 Application 这个"大管家"的管理之下。

> [!def] 官方定义
> `Application` 类是 WPF 应用程序的入口和管理核心。它继承自 `DispatcherObject`，负责：（1）管理应用程序的生存周期（启动、运行、退出）；（2）提供全局资源字典（Application.Resources）；（3）维护窗口集合（Application.Windows）；（4）处理未捕获异常（DispatcherUnhandledException）；（5）提供 `Application.Current` 静态属性用于全局访问。

> [!origin] 由来背景
> Application 类的设计灵感来源于 Windows 编程中的"消息循环"概念。在 Win32 时代，每个程序都有一个 `while(GetMessage())` 循环不断接收和处理消息。WPF 把这个循环封装进了 `Application.Run()` 方法，开发者不再需要关心底层消息泵。同时 Application 还承担了 WinForms 中"Application 静态类"和"MFC 中 CWinApp"的双重角色。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - Application 通过 `App.xaml` 和 `App.xaml.cs` 定义，项目模板默认生成，是程序的入口
> - 核心属性：`Current`（全局单例）、`MainWindow`（主窗口）、`Windows`（所有打开窗口的集合）、`Resources`（全局资源字典）、`ShutdownMode`（退出模式）
> - 核心方法：`Run()`（启动消息循环）、`Shutdown()`（退出程序）
> - 核心事件：`Startup`（启动时）、`Exit`（退出时）、`SessionEnding`（系统关机/注销）、`DispatcherUnhandledException`（未处理异常）
> - `Application.Current` 可以在程序中任何位置访问——这是最常用的全局入口

> [!example] 完整示例
> 演示如何通过自定义 App 类管理全局资源和日志。
>
> ```xml
> <!-- App.xaml -->
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <!-- 全局颜色资源——任何窗口都能引用 -->
>         <Color x:Key="PrimaryColor">#FF6B35</Color>
>         <Color x:Key="BgDarkColor">#0D1117</Color>
>         <Color x:Key="BgCardColor">#161B22</Color>
>        
>         <!-- 全局样式 -->
>         <Style x:Key="PrimaryButton" TargetType="Button">
>             <Setter Property="Background" Value="#FF6B35"/>
>             <Setter Property="Foreground" Value="White"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="Height" Value="36"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="Button">
>                         <Border CornerRadius="6" Background="#FF6B35">
>                             <ContentPresenter HorizontalAlignment="Center" 
>                                               VerticalAlignment="Center"/>
>                         </Border>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>     </Application.Resources>
> </Application>
> ```
>
> ```csharp
> // App.xaml.cs
> using System.IO;
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class App : Application
> {
>     // 全局属性——在 App 类中定义，任何窗口都可以访问
>     public static string AppDataPath { get; } = 
>         Path.Combine(Environment.GetFolderPath(
>             Environment.SpecialFolder.LocalApplicationData), "HmiDemo");
>    
>     public static string LogFilePath =>
>         Path.Combine(AppDataPath, $"log_{DateTime.Now:yyyyMMdd}.txt");
>
>     protected override void OnStartup(StartupEventArgs e)
>     {
>         base.OnStartup(e);
>        
>         // 应用启动时的初始化工作
>         Directory.CreateDirectory(AppDataPath);
>         WriteLog("应用程序启动");
>        
>         // 读取命令行参数
>         foreach (var arg in e.Args)
>         {
>             WriteLog($"启动参数: {arg}");
>         }
>     }
>
>     protected override void OnExit(ExitEventArgs e)
>     {
>         // 应用退出时的清理工作
>         WriteLog($"应用程序退出（ExitCode: {e.ApplicationExitCode}）");
>         base.OnExit(e);
>     }
>
>     /// <summary>
>     /// 全局日志写入方法
>     /// </summary>
>     public static void WriteLog(string message)
>     {
>         var log = $"[{DateTime.Now:HH:mm:ss}] {message}\n";
>         File.AppendAllText(LogFilePath, log);
>         System.Diagnostics.Debug.Write(log); // VS 输出窗口也能看到
>     }
> }
> ```
>
> 在其他窗口中调用全局资源和方法：
>
> ```csharp
> // 任何窗口或 UserControl 中都可以这样用
> var primaryColor = (Color)Application.Current.Resources["PrimaryColor"];
> App.WriteLog("主窗口加载完成");
> ```

> [!scene] 适用场景
> ✅ 全局资源管理——将项目统一使用的颜色、字体、按钮样式定义在 App.xaml 的 Resources 中
> ✅ 全局日志/配置——App 类是存放 `public static` 全局属性的最佳位置
> ✅ 未处理异常捕获——在 `DispatcherUnhandledException` 中记录崩溃日志，避免程序闪退
> ✅ 启动初始化——数据库连接、OPC 服务检测、配置文件加载等
> ❌ 业务逻辑——不要往 App 类里塞大量业务代码，它只负责"管理"不负责"执行"

> [!pitfall] 常见踩坑
> 坑 1：**Application.Current 为 null** → 发生在非 UI 线程、控制台程序或单元测试环境。WPF 的 Application 只在 UI 线程和 WPF 项目中有实例，后台线程上 `Application.Current` 是 null
> 
> 坑 2：**在 App 构造函数中做耗时操作** → 构造函数执行完才开始加载 StartupUri 窗口，如果在 App 构造函数里同步读取大文件，程序会"卡在启动画面"很久。把初始化放到 OnStartup 异步进行
>
> 坑 3：**Shutdown() vs Environment.Exit()** → `App.Current.Shutdown()` 是优雅退出（触发 Exit 事件，给窗口清理机会），`Environment.Exit()` 是暴力终止（不触发任何事件，数据可能丢失）。上位机项目的"急停"也别用 Environment.Exit()

> [!best] 最佳实践
> - 把全局样式、颜色、转换器统一定义在 App.xaml 的 `<Application.Resources>` 中，所有窗口自动继承
> - 覆盖 `OnStartup` 和 `OnExit` 方法（而不是用事件订阅）来做初始化和清理——语法更清晰
> - 全局数据（如当前登录用户、系统配置）用 `public static` 属性存在 App 类中，方便全局访问
> - 上位机项目务必定制 `DispatcherUnhandledException`——生产环境中任何未捕获异常都应该被记录，避免程序闪退用户一脸懵

> [!practice] 上手练习
> **Lv.1 照猫画虎**：打开项目的 App.xaml，在 `<Application.Resources>` 中添加一个全局样式，在 MainWindow 中引用它，感受全局样式的好处
> **Lv.2 小试牛刀**：在 App 类中添加一个全局 Counter 属性（`public static int VisitCount`），在 MainWindow 的 Loaded 事件中自增并显示，关闭后再打开看数字是否变化——理解 Application 实例的生命周期
> **Lv.3 融会贯通**：捕获 `DispatcherUnhandledException` 事件，把异常信息写到日志文件，并弹出一个友好的错误提示窗口（而非默认的崩溃对话框）

> [!related] 相关知识链接
> - ← 前置知识：App.xaml 的 StartupUri（理解 Application 如何启动窗口）
> - → 后续必学：应用程序事件（Startup、Exit 等）（Application 最核心的生命周期事件）
> - → 后续必学：Application.Current 全局访问（如何从任意位置获取 Application 实例）
> - → 后续必学：ShutdownMode 属性（控制应用何时退出）
> - ⇄ 关联概念：Dispatcher 线程模型、Application.Resources 全局资源字典
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.application
