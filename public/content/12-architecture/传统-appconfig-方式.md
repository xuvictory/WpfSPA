---
title: 传统 App.config 方式
section: 12-architecture
parent: 12.5 配置文件管理
---

# 传统 App.config 方式

> [!plain] 白话理解
> `App.config` 是 WPF 的**"老式配置文件"**：把串口、IP、阈值写进 XML 的 `<appSettings>` 里，代码用 `ConfigurationManager.AppSettings["ComPort"]` 读出来。老项目都在用它，维护老上位机时你得会读会改；但新项目别再学它了——写起来繁琐、不能强类型绑定、`Settings.settings` 那套还容易踩坑。理解它是为了"接住历史代码"。

> [!def] 官方定义
> `App.config` 是 .NET Framework 时代的标准配置文件，编译后输出为 `<程序名>.exe.config`，由 **System.Configuration** 体系（`ConfigurationManager`，`System.Configuration.ConfigurationManager` NuGet 包）读取。配置项写于 `<appSettings>`（键值对）与 `<connectionStrings>`（连接字符串）等节，运行时可读可写：https://learn.microsoft.com/zh-cn/dotnet/framework/configure-apps/ 。WPF 项目还常配合 `Settings.settings`（强类型设置，命名空间 `Properties.Settings`）使用。它是 .NET Framework 官方方案；.NET Core/.NET 5+ 中 `ConfigurationManager` 包仍可用，但官方推荐新项目改用 `appsettings.json`（见 `appsettingsjson推荐方案`）。

> [!origin] 由来背景
> `App.config` 源自 .NET Framework 1.0（2002 年）——当时 XML 是微软配置的事实标准（Web.config、machine.config 一脉相承），配置以"节（section）"为单元由 `ConfigurationManager` 统一管理，配合 `Settings.settings` 在 VS 里可视化编辑。二十年间积累了海量存量代码。2016 年 .NET Core 引入 JSON 配置体系后，`App.config` 逐步退居"兼容模式"；但在 WPF 老项目、需要 `ConfigurationManager` 兼容层、某些第三方库（如老版日志框架）的场合依然活跃。上位机行业大量老设备软件仍基于 .NET Framework + App.config，因此"会看会改"是必须技能。

> [!essentials] 核心要点
> - **核心 API**：`ConfigurationManager.AppSettings["Key"]`（读）、`.AppSettings["Key"] = value` + `.Save()`（写运行时配置）
> - **连接字符串**：`ConfigurationManager.ConnectionStrings["LocalDb"].ConnectionString`（`<connectionStrings>` 节）
> - **节类型**：`<appSettings>` 键值对、`<connectionStrings>`、自定义 `configSections`（复杂配置）
> - **编译产物**：`App.config` → 发布时自动改名 `<程序名>.exe.config` 复制到输出目录
> - **新老对比**：无强类型绑定、JSON 更友好 → 新项目用 `appsettingsjson推荐方案`，老项目维护用本篇

> [!example] 完整示例
> **App.config 读取演示：ConfigurationManager 读取 appSettings 里的串口参数（波特率、数据位），并显示在界面上：**
>
> **App.config（需在项目右键→属性→添加应用配置文件，并引用 System.Configuration）：**
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <configuration>
>   <appSettings>
>     <add key="ComPort" value="COM3"/>
>     <add key="BaudRate" value="9600"/>
>     <add key="DataBits" value="8"/>
>     <add key="Parity" value="None"/>
>   </appSettings>
> </configuration>
> ```
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="App.config 配置读取" Height="320" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="从 App.config 读取串口参数" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="读取配置并打开串口" Click="OnOpen" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Configuration;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnOpen(object sender, RoutedEventArgs e)
>         {
>             // 从 App.config 的 appSettings 读取键值
>             string port = ConfigurationManager.AppSettings["ComPort"];
>             string baud = ConfigurationManager.AppSettings["BaudRate"];
>             string dataBits = ConfigurationManager.AppSettings["DataBits"];
>
>             OutputText.Text =
>                 $"串口配置：\n  端口 {port}，波特率 {baud}，数据位 {dataBits}\n" +
>                 "→ SerialPort.Open() 已执行（模拟）";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 维护 .NET Framework 老上位机：存量代码用 `App.config` 存串口、连接字符串
> ✅ 需要 `Settings.settings` 强类型设置的旧项目：VS 可视化编辑
> ✅ 第三方库要求 `ConfigurationManager`（老版日志/缓存库）：App.config 是其默认读取源
> ✅ 快速读写"少量键值"的小程序：`AppSettings["Key"]` 简单直接
> ❌ 新项目首选：JSON + 强类型绑定更优，见 `appsettingsjson推荐方案`
> ❌ 复杂层级配置：XML 写嵌套配置繁琐易错，JSON 更适合

> [!pitfall] 常见踩坑
> 坑 1：**改 `App.config` 却看不到效果** → 现象：改了配置重启没变化 → 原因：发布目录里改的是 `.exe.config`，VS 里改的是项目 `App.config`，二者不同步 → 解决：发布后改输出目录的 `<程序名>.exe.config`；源码里改 `App.config` 后重新生成
> 
> 坑 2：**`AppSettings` 键不存在返回 null** → 现象：`Convert.ToInt32(AppSettings["BaudRate"])` 抛空引用 → 原因：键拼错或没配 → 解决：读取后判空/`TryParse`，配置缺失给默认值并打日志（见 `serilog-结构化日志`）
>
> 坑 3：**运行时写配置被权限拒绝** → 现象：`Save()` 抛 `ConfigurationErrorsException` → 原因：安装目录只读（Program Files）或无写权限 → 解决：可写配置放 `%AppData%`/程序数据目录，`App.config` 保持只读部署

> [!best] 最佳实践
> - 读取统一封装：写 `ConfigHelper.GetSetting(key, default)`，键名常量集中，避免魔法字符串
> - 键值集中规划：命名 `Device:Com`、`Alarm:Threshold`（冒号分层），与 JSON 风格一致便于日后迁移
> - 值类型显式转换：`TryParse` + 默认值，别裸用 `Convert`
> - 敏感信息不进配置：连接字符串含密码时用 `ProtectedData`/连接字符串加密（见 `配置加密与运行时修改`）
> - 新老项目迁移：老代码在接入 `appsettingsjson推荐方案` 后可保留 `App.config` 作兼容层，逐步过渡

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，修改 `<appSettings>` 里串口号并重启，观察界面显示新值
> **Lv.2 小试牛刀**：在 `<appSettings>` 新增"报警阈值"键并读取显示，验证 `GetSetting` 封装可用
> **Lv.3 融会贯通**：把示例改成读取 `<connectionStrings>` 里的数据库连接串并显示服务器名，理解两类配置节的差异
> **Lv.4 拆层挑战**：用 `appsettingsjson推荐方案` 重写示例的配置读取（保留同样的键名语义），对比两种写法的差异并总结迁移步骤

> [!related] 相关知识链接
> - ← 前置知识：`架构设计重要性与类型`（配置属基础架构）、`配置加密与运行时修改`
> - → 后续必学：`appsettingsjson推荐方案`（新方案）、`serilog-结构化日志`（配置加载日志）
> - ⇄ 关联概念：`单例模式`（配置中心单例）、12.7 `clickonce-部署与更新`（部署后配置路径变化）
> - 📖 官方文档：.NET Framework 配置：https://learn.microsoft.com/zh-cn/dotnet/framework/configure-apps/ ；ConfigurationManager：https://learn.microsoft.com/zh-cn/dotnet/api/system.configuration.configurationmanager
