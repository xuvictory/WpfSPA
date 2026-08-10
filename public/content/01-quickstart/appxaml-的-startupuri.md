---
title: App.xaml 的 StartupUri
section: 01-quickstart
parent: 1.3 应用程序生命周期
---

# App.xaml 的 StartupUri

> [!plain] 白话理解
> 你就把 `StartupUri` 理解成程序的"大门"。你一启动 WPF 程序，系统不知道要先打开哪个窗口——是登录窗口？主控界面？还是参数设置页？`StartupUri` 就是告诉系统："启动后，第一个打开的是 MainWindow.xaml"。就像你进入一栋大楼，进门看到的大厅——它就是 App.xaml 里指的那扇门。

> [!def] 官方定义
> `StartupUri` 是 App.xaml 根元素 `<Application>` 的一个属性，类型为 `Uri`。它指定了 WPF 应用程序启动时自动加载并显示的窗口（Window）所对应的 XAML 文件路径。当设置了 `StartupUri` 后，WPF 框架会在 `Application.Run()` 被调用时自动实例化该窗口并设为 `Application.MainWindow`。

> [!origin] 由来背景
> 早期的 Windows 程序（C++ MFC/Win32）需要手写 WinMain 函数，在几百行初始化代码里注册窗口类、创建消息循环、显示窗口。WPF 的目标之一就是"让简单的事情简单"——99% 的应用只需要在 App.xaml 中一行 `StartupUri="MainWindow.xaml"` 就能启动，底层所有窗口注册、消息循环都被封装在 `Application.Run()` 中自动完成。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - `StartupUri` 在 App.xaml 的 `<Application>` 标签中设置，路径相对于项目根目录
> - 设置 `StartupUri="MainWindow.xaml"` 后，WPF 启动时自动 `new MainWindow()` 并调用 `Show()`
> - 如果没有设置 `StartupUri`，你必须在 `Application.Startup` 事件中手动创建和显示窗口
> - 路径用 XAML 相对路径格式：子文件夹用 `Views/MainWindow.xaml`，类名直接写 `MainWindow`
> - 被 StartupUri 指向的窗口会自动成为 `Application.Current.MainWindow`（主窗口）

> [!example] 完整示例
> 演示两种启动方式：默认 StartupUri 方式 vs 手动控制方式。
>
> App.xaml 默认方式——最简单的启动配置：
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
> App.xaml 手动控制方式——去掉 StartupUri，在代码中自己决定启动哪个窗口：
>
> ```xml
> <!-- App.xaml（去掉 StartupUri） -->
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              Startup="Application_Startup">
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
>     private void Application_Startup(object sender, StartupEventArgs e)
>     {
>         // 手动控制启动逻辑——可以在这里做判断
>         // 例如：检查配置文件，决定是打开登录窗口还是直接进主界面
>        
>         // 场景1：直接开主窗口
>         var mainWindow = new MainWindow();
>         mainWindow.Show();
>        
>         // 场景2：先开登录窗口（启用下面代码，注释上面）
>         // var loginWindow = new LoginWindow();
>         // loginWindow.ShowDialog();  // 模态等待登录完成
>         // if (loginWindow.LoginSuccess)
>         // {
>         //     var mainWindow = new MainWindow();
>         //     mainWindow.Show();
>         // }
>     }
> }
> ```
>
> App.xaml.cs 中也可以读取命令行参数来决定行为：
>
> ```csharp
> private void Application_Startup(object sender, StartupEventArgs e)
> {
>     // e.Args 包含命令行参数，上位机常用
>     if (e.Args.Length > 0 && e.Args[0] == "--auto")
>     {
>         // 自动模式：跳过UI直接启动采集
>         var main = new MainWindow();
>         main.WindowState = WindowState.Minimized;
>         main.Show();
>     }
>     else
>     {
>         new MainWindow().Show();
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 单窗口应用——直接设置 `StartupUri="MainWindow.xaml"`，一行搞定
> ✅ 多窗口应用——去掉 StartupUri，在 Startup 事件中根据条件决定先开哪个窗口（如登录→主界面）
> ✅ 上位机自启动——配合命令行参数 `--auto`，程序开机自启动时最小化到托盘
> ❌ 纯后台服务——不需要 UI 窗口，Applycation 模式不适合，应改用 Worker Service

> [!pitfall] 常见踩坑
> 坑 1：**StartupUri 路径写错或大小写不匹配** → 运行时抛 `IOException: "Cannot locate resource 'mainwindow.xaml'"`。解决办法：检查文件名大小写和路径，`MainWindow.xaml` 不是 `mainwindow.xaml`
> 
> 坑 2：**同时设置 StartupUri 和 Startup 事件** → 如果 App.xaml 中既有 `StartupUri` 又在 .cs 中写了 `Application_Startup`，两者都会执行——StartupUri 指定的窗口先打开，然后 Startup 事件触发。通常二者选其一即可
>
> 坑 3：**StartupUri 指向的不是 Window 子类** → StartupUri 只能指向 .xaml 文件对应的 Window 子类。如果指向 UserControl 或 Page，运行时会报类型转换错误

> [!best] 最佳实践
> - 简单应用直接用 `StartupUri`，一行代码就搞定启动；需要登录/初始化逻辑时才用 Startup 事件
> - 上位机项目建议使用手动控制方式（Startup 事件），可以加入初始化检查（如：SQLite 数据库是否存在、OPC 服务是否可用）
> - 把启动时的初始化逻辑（如读取配置文件、连接数据库）放在 `Startup` 事件中，而不是 MainWindow 的构造函数中，职责更清晰
> - 使用 `e.Args` 接收命令行参数，支持上位机常见的"开机自启最小化到托盘"需求

> [!practice] 上手练习
> **Lv.1 照猫画虎**：打开现有项目的 App.xaml，观察 `StartupUri` 的值。尝试改为 `StartupUri="NonExistent.xaml"`，运行看报什么错
> **Lv.2 小试牛刀**：删除 StartupUri，改用 Startup 事件手动创建并显示 MainWindow，确保程序仍然正常运行
> **Lv.3 融会贯通**：新建一个 LoginWindow（简单的登录窗口），改造 Startup 事件逻辑：先弹出 LoginWindow.ShowDialog()，只有用户点击"登录"才打开 MainWindow，否则 `Application.Current.Shutdown()`

> [!related] 相关知识链接
> - ← 前置知识：创建 Hello World 项目（理解 App.xaml 在项目中的位置）
> - → 后续必学：Application 类详解（Application 是 StartupUri 所属的类）
> - → 后续必学：应用程序事件（Startup 是 Application 最重要的生命周期事件）
> - → 后续必学：Application.Current 全局访问（在任何地方都能获取 Application 实例）
> - ⇄ 关联概念：Window.Show() vs ShowDialog()、启动参数 e.Args
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.application.startupuri
