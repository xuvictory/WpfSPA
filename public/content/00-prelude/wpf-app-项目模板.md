---
title: WPF App 项目模板
section: 00-prelude
parent: WPF 项目创建
---

# WPF App 项目模板

> [!plain] 白话理解
> 项目模板就是微软帮你预制的「精装房」——墙体（文件结构）、水电（引用配置）、门窗（窗口框架）都已经搭好了，你只需要拎包入住，往里面摆家具（写业务代码）。VS 2022 创建 WPF 项目时选择「WPF 应用程序」模板，一键生成一个能直接运行的空白窗口程序。你不用从零去配 `using`、去写 `Main` 方法、去引 WPF 的 DLL——模板全帮你干完了。

> [!def] 官方定义
> WPF App 项目模板（WPF Application）是 VS 预定义的项目创建模板，自动生成一个包含 `App.xaml`、`MainWindow.xaml`、`App.xaml.cs`、`MainWindow.xaml.cs`、`.csproj` 等核心文件的最小可运行 WPF 项目。模板默认引用 `PresentationFramework`、`PresentationCore`、`WindowsBase` 等 WPF 核心程序集，并使用 `<UseWPF>true</UseWPF>` 标记启用 WPF SDK。

> [!origin] 由来背景
> 在 WPF 出现之前，WinForms 时代的项目创建需要手动添加对 `System.Windows.Forms.dll` 的引用，`Program.cs` 的 `Main` 方法也要自己写 `Application.Run(new Form1())`。WPF 项目模板在 .NET Framework 3.0 首次引入时，就做了一件重要的事：把 XAML 的编译流程（MSBuild 的 XamlTask）集成到模板中，让开发者感知不到 XAML → BAML 的编译过程。到 .NET Core 3.0 和 .NET 5+ 时代，模板进一步简化，`UseWPF` 一个标记搞定所有 WPF 基础设施。

> [!essentials] 核心要点

> **创建 WPF 项目的两种方式**：

> | 方式 | 操作 | 适用场景 |
> |------|------|---------|
> | VS 界面 | 文件 → 新建 → 项目 → 搜索「WPF 应用程序」→ 输入名称和位置 → 创建 | 日常开发 |
> | dotnet CLI | `dotnet new wpf -n MyScadaApp` | CI/CD 脚本、快速原型 |

> **模板帮你自动生成的 6 个核心文件**：

> | 文件 | 作用 | 你能改什么 |
> |------|------|-----------|
> | `App.xaml` | 应用程序入口，定义全局资源 | 全局样式、启动窗口 |
> | `App.xaml.cs` | 应用程序生命周期事件处理 | `OnStartup`、`OnExit` |
> | `MainWindow.xaml` | 主窗口界面（XAML 标记） | 布局和控件 |
> | `MainWindow.xaml.cs` | 主窗口后台逻辑（C# 代码） | 业务代码 |
> | `AssemblyInfo.cs` | 程序集元数据（版本、公司等） | 版本号、版权信息 |
> | `项目名.csproj` | 项目构建配置 | 目标框架、NuGet 引用 |

> [!example] 完整示例
> ```xml
> <!-- App.xaml — 模板自动生成的内容 -->
> <Application x:Class="MyScadaApp.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <!-- 这里放全局样式、全局资源 -->
>     </Application.Resources>
> </Application>
> ```
>
> ```csharp
> // App.xaml.cs — 应用程序入口代码
> using System.Windows;
> 
> namespace MyScadaApp
> {
>     public partial class App : Application
>     {
>         protected override void OnStartup(StartupEventArgs e)
>         {
>             base.OnStartup(e);
>             // 应用启动时执行：初始化日志、加载配置、检查授权等
>         }
> 
>         protected override void OnExit(ExitEventArgs e)
>         {
>             base.OnExit(e);
>             // 应用退出时执行：关闭串口连接、保存用户配置、清理资源
>         }
>     }
> }
> ```
>
> ```xml
> <!-- MainWindow.xaml — 模板自动生成的主窗口 -->
> <Window x:Class="MyScadaApp.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MainWindow" Height="450" Width="800">
>     <Grid>
>         <!-- 你的上位机界面从这里开始搭建 -->
>     </Grid>
> </Window>
> ```
>
> **dotnet CLI 一键创建**：
> ```bash
> # 打开终端，输入以下命令：
> dotnet new wpf -n MyScadaApp -o C:\Projects\MyScadaApp
> cd C:\Projects\MyScadaApp
> dotnet run
> # 一个空白窗口就弹出来了
> ```

> [!scene] 适用场景
> ✅ 所有 WPF 桌面应用的起点——不管你做什么上位机项目，第一步总是从模板创建项目
> ✅ 学习阶段：每次学习新功能就新建一个临时项目，随便折腾不心疼
> ✅ 团队标准化：统一使用一种模板，保证团队每个成员的项目初始结构一致
> ❌ 控制台工具——用「控制台应用」模板更合适
> ❌ 类库——用「类库」模板，不应该带窗口

> [!pitfall] 常见踩坑
> 坑 1：**创建项目时选了「WPF 应用程序 (.NET Framework)」而不是「WPF 应用程序」** → 前者基于老的 .NET Framework 4.x，后者基于新的 .NET 6/7/8。对于新项目，选不带 Framework 后缀的那个。判断方法：看 .csproj 里有没有 `<TargetFramework>net8.0-windows</TargetFramework>`（新版）还是 `<TargetFrameworkVersion>v4.8</TargetFrameworkVersion>`（老版）。
>
> 坑 2：**创建后编译报错「找不到 Main 方法」** → 可能是 App.xaml 的 `Build Action` 被错误改成了 `Page` 以外的值。在解决方案资源管理器中右键 `App.xaml` → 属性 → 确认「生成操作」是 `ApplicationDefinition`。
>
> 坑 3：**模板生成的项目跑不起来，窗口一闪就退** → 检查 `App.xaml` 中的 `StartupUri` 是否正确指向你的主窗口文件名（区分大小写）。如果 App.xaml.cs 中重写了 `OnStartup` 但没有调用 `base.OnStartup(e)`，窗口也可能不会显示。

> [!best] 最佳实践
> - 创建项目时给有意义的名字：`ScadaMonitor`、`PlcConfigTool` 而不是 `WpfApp1`、`WpfApp2`。项目名就是最终 .exe 的文件名
> - 位置选了合理路径再创建：VS 默认路径很长且带空格，建议统一放在 `C:\Projects\` 或 `D:\Dev\` 等短路径下
> - 创建后第一件事：改 `MainWindow` 的 `Title` 和 `WindowStartupLocation="CenterScreen"`，让窗口启动时居中而不是出现在左上角
> - 用 `dotnet new` 脚本化创建：如果团队新人多，写一个项目脚手架脚本，包含公司统一的目录结构和基础引用

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 VS 2022 创建一个名为 `MyFirstScada` 的 WPF 项目。不要改任何代码，直接按 `F5` 运行，确认空白窗口正常显示。然后改用 `dotnet new wpf -n MyFirstScada` 命令行方式再创建一次，对比两种方式的文件生成结果。
>
> **Lv.2 小试牛刀**：在 `App.xaml.cs` 的 `OnStartup` 方法中加一行 `MessageBox.Show("上位机监控系统启动")`，在 `OnExit` 中加一行 `MessageBox.Show("系统已安全退出")`。运行验证消息框是否弹出。
>
> **Lv.3 融会贯通**：创建一个 WPF 项目，把 `MainWindow` 窗口的 `Title` 改成「PLC 设备监控系统 V1.0」，窗口大小改为 `1000x600`，窗口启动位置设为屏幕中央。在 `App.xaml.cs` 中写入配置文件检查逻辑：如果 `config.json` 不存在，弹窗提示「首次运行，请配置通讯参数」。

> [!related] 相关知识链接
> - → 项目文件结构详解——模板生成的每个文件详细解读
> - → App.xaml 应用程序入口——全局资源和启动流程
> - → MainWindow.xaml 主窗口——窗口属性和布局
> - ⇄ .csproj 项目文件说明——模板生成的构建配置
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/get-started/create-app-visual-studio
