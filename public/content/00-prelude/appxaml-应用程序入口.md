---
title: App.xaml 应用程序入口
section: 00-prelude
parent: WPF 项目创建
---

# App.xaml 应用程序入口

> [!plain] 白话理解
> `App.xaml` 就是 WPF 程序的「总开关」——双击 .exe 后第一个被执行的代码不在 `MainWindow` 里，而在 `App.xaml.cs` 的 `OnStartup` 方法里。它就像工厂的总配电箱：启动时接通电源（初始化日志、加载配置、读授权文件），然后打开主车间的大门（显示 `MainWindow`），下班时拉闸断电（保存数据、断开连接、清理资源）。`App.xaml` 本身还是个「全局仓库」——你在这里定义的样式、颜色、模板，整个程序的所有窗口都能用。

> [!def] 官方定义
> `App.xaml` 是 WPF 的应用程序定义文件，继承自 `System.Windows.Application` 类。它通过 `StartupUri` 属性指定启动窗口，通过 `Application.Resources` 定义全局可访问的资源字典。`App.xaml.cs` 是其代码隐藏文件，提供 `OnStartup`、`OnExit`、`OnActivated`、`OnDeactivated`、`OnSessionEnding` 等生命周期虚方法。整个应用只有一个 `Application` 实例，可通过 `Application.Current` 在任何位置获取。

> [!origin] 由来背景
> WPF 从诞生起就借鉴了 Web 开发中「全局样式表」的概念，把应用程序级资源集中放在 `App.xaml` 里，避免在每个窗口重复定义。`Application` 类在 .NET Framework 3.0 首次引入时还承担了导航框架（NavigationWindow）、片段导航等职责，后来这些功能逐渐弱化，现在 `App.xaml` 最核心的角色是「应用程序生命周期管理」加「全局资源管理」。到 .NET 8，这个职责没有本质变化。

> [!essentials] 核心要点

> **App.xaml 的四大职责**：

> | 职责 | 实现方式 | 上位机实例 |
> |------|---------|-----------|
> | 指定启动窗口 | `StartupUri="MainWindow.xaml"` | 一般指向主监控窗口 |
> | 全局资源 | `<Application.Resources>` | 统一样式、颜色主题、数据模板 |
> | 启动初始化 | `OnStartup` 重写 | 加载配置文件、初始化日志系统、检查授权 |
> | 退出清理 | `OnExit` 重写 | 保存窗口位置、关闭串口、写退出日志 |

> **Application 生命周期事件**（按触发顺序）：

> ```
> 程序启动
>   → OnStartup        ← 在这里做初始化：读配置、连数据库、建日志
>   → StartupUri 窗口显示
>   → OnActivated      ← 窗口获得焦点时
>   → [用户操作...]
>   → OnDeactivated    ← 窗口失去焦点时（切到其他程序）
>   → OnActivated      ← 再次切回来
>   → OnSessionEnding  ← Windows 关机/注销时（你可阻止关机）
>   → OnExit           ← 程序退出时：保存状态、关闭连接、释放资源
> ```

> [!example] 完整示例
>
> ```xml
> <!-- App.xaml — 全局入口 + 全局资源 -->
> <Application x:Class="PlcMonitor.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml"
>              ShutdownMode="OnMainWindowClose">
>     <!-- 全局资源字典 -->
>     <Application.Resources>
>         <!-- 全局颜色定义（上位机三色系统：绿=正常/红=报警/灰=离线） -->
>         <SolidColorBrush x:Key="StatusNormal" Color="LimeGreen"/>
>         <SolidColorBrush x:Key="StatusAlarm" Color="Red"/>
>         <SolidColorBrush x:Key="StatusOffline" Color="Gray"/>
>         <SolidColorBrush x:Key="PrimaryBlue" Color="#0078D4"/>
> 
>         <!-- 全局字体样式 -->
>         <Style TargetType="TextBlock">
>             <Setter Property="FontFamily" Value="Microsoft YaHei"/>
>             <Setter Property="FontSize" Value="14"/>
>         </Style>
> 
>         <!-- 全局按钮样式 -->
>         <Style TargetType="Button">
>             <Setter Property="Height" Value="32"/>
>             <Setter Property="MinWidth" Value="80"/>
>             <Setter Property="Margin" Value="4"/>
>             <Setter Property="FontSize" Value="14"/>
>             <Setter Property="Cursor" Value="Hand"/>
>         </Style>
> 
>         <!-- 引用外部样式文件 -->
>         <ResourceDictionary Source="Styles/DataGridStyles.xaml"/>
>     </Application.Resources>
> </Application>
> ```
>
> ```csharp
> // App.xaml.cs — 应用程序生命周期管理
> using System.IO;
> using System.Windows;
> using Serilog;
> 
> namespace PlcMonitor
> {
>     public partial class App : Application
>     {
>         protected override void OnStartup(StartupEventArgs e)
>         {
>             base.OnStartup(e);
> 
>             // 1. 初始化日志系统
>             Log.Logger = new LoggerConfiguration()
>                 .WriteTo.File("logs/scada-.log", rollingInterval: RollingInterval.Day)
>                 .CreateLogger();
>             Log.Information("========== PLC 监控系统启动 ==========");
> 
>             // 2. 加载配置文件
>             string configPath = "appsettings.json";
>             if (!File.Exists(configPath))
>             {
>                 Log.Warning("配置文件不存在，使用默认配置");
>                 // 创建默认配置文件
>                 File.WriteAllText(configPath, 
>                     "{\"ComPort\":\"COM3\",\"BaudRate\":9600,\"PlcIp\":\"192.168.1.100\"}");
>             }
> 
>             // 3. 处理未捕获的异常（全局异常兜底）
>             this.DispatcherUnhandledException += (s, args) =>
>             {
>                 Log.Fatal(args.Exception, "未处理的异常");
>                 MessageBox.Show($"程序发生严重错误：\n{args.Exception.Message}", 
>                                 "系统错误", MessageBoxButton.OK, MessageBoxImage.Error);
>                 args.Handled = true; // 防止程序崩溃
>             };
>         }
> 
>         protected override void OnExit(ExitEventArgs e)
>         {
>             Log.Information("========== PLC 监控系统退出 (退出码:{Code}) ==========", 
>                             e.ApplicationExitCode);
>             Log.CloseAndFlush();
>             base.OnExit(e);
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 全局初始化：加载配置文件、初始化日志框架、注册全局异常处理
> ✅ 全局样式定义：统一全应用的颜色、字体、控件默认样式
> ✅ 单实例控制：在 `OnStartup` 中检测是否已有实例在运行（上位机通常只允许开一个）
> ✅ 多语言切换：在 `Application.Resources` 中动态替换资源字典实现主题/语言切换
> ❌ 窗口级专属资源——应该放在各自的 Window.Resources 里，不要污染全局

> [!pitfall] 常见踩坑
> 坑 1：**在 `OnStartup` 中做了耗时操作，窗口半天弹不出来** → `OnStartup` 执行完之前，`StartupUri` 指定的窗口不会显示。如果你在这里同步读大文件、连数据库、初始化 OPC 客户端，用户会以为程序卡死了。**解决方案**：耗时初始化放在 `MainWindow.Loaded` 事件里（窗口先显示），或使用启动闪屏（Splash Screen）——在 .csproj 中配 `<SplashScreen>Resources\splash.png</SplashScreen>`。
>
> 坑 2：**`StartupUri` 拼错文件名或忘了设，编译通过但运行时闪退** → `StartupUri` 指定的文件不存在时，WPF 在运行时抛出 `IOException`，因为发生在启动阶段，你可能只看到一个一闪而过的错误。**解决方案**：确保 `StartupUri` 的文件名和实际文件完全一致（包括大小写），并且文件的「生成操作」是 `Page`。
>
> 坑 3：**在 `Application.Resources` 里定义了一个超大的字典，每次启动都卡** → 全局资源在启动时全部加载到内存。如果你塞了几十 MB 的图片资源到 `Application.Resources`，启动会明显变慢。**解决方案**：大资源（如图片）用懒加载，只在用到时才加载；常用的小样式、画刷放全局。

> [!best] 最佳实践
> - `ShutdownMode="OnMainWindowClose"`：主窗口关闭时自动退出程序（默认行为，一般不需要改）
> - `ShutdownMode="OnLastWindowClose"`：所有窗口都关闭后才退出（多窗口应用用这个）
> - `ShutdownMode="OnExplicitShutdown"`：只有调用 `Application.Current.Shutdown()` 才退出（后台驻留程序用这个）
> - 全局资源分文件管理：App.xaml 里只放最通用的（颜色、字体），控件专属样式用单独的 ResourceDictionary 文件，在 App.xaml 中通过 `MergedDictionaries` 引入
> - 善用 `Application.Current`：在任何地方都可以通过 `Application.Current.MainWindow` 获取主窗口、`Application.Current.Resources["PrimaryBlue"]` 获取全局资源

> [!practice] 上手练习
> **Lv.1 照猫画虎**：新建 WPF 项目，在 `App.xaml` 的 `<Application.Resources>` 中定义一个全局的 `SolidColorBrush`（命名为 `PrimaryBlue`，颜色 `#0078D4`）。在 `MainWindow.xaml` 中给某个 Button 的 Background 引用这个资源（`Background="{StaticResource PrimaryBlue}"`）。运行确认按钮变蓝。
>
> **Lv.2 小试牛刀**：在 `App.xaml.cs` 的 `OnStartup` 中写代码：从 `appsettings.json` 读取窗口标题配置，动态设置 `MainWindow.Title`。在 `OnExit` 中写代码：把当前时间写入 `shutdown.log` 文件。运行验证。
>
> **Lv.3 融会贯通**：制作一个上位机三色主题系统：定义 NormalGreen、WarningYellow、AlarmRed、OfflineGray 四个全局画刷。在 App.xaml.cs 的 `OnStartup` 中根据 `appsettings.json` 中的 `Theme` 字段，动态替换全局资源字典（实现白天/黑夜主题切换）。主窗口中使用这些画刷来标识设备状态。

> [!related] 相关知识链接
> - ← WPF App 项目模板——模板自动生成的 App.xaml 初始内容
> - → MainWindow.xaml 主窗口——StartupUri 指向的就是它
> - → 项目文件结构详解——App.xaml 在整个结构中的位置
> - ⇄ 全局样式与资源字典——Application.Resources 的高级用法
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.application
