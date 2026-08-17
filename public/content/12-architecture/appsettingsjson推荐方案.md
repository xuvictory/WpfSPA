---
title: appsettings.json（推荐方案）
section: 12-architecture
parent: 12.5 配置文件管理
---

# appsettings.json（推荐方案）

> [!plain] 白话理解
> `appsettings.json` 就是上位机的**"总操作面板"**：串口号、PLC 的 IP、报警阈值、日志级别都写在里面，程序启动时读一遍。改配置不用重新编译——现场调试时改个 `COM3`、把阈值从 85 改到 80，重启程序就生效。相比老式 `App.config`，JSON 结构清晰、微软官方配置系统 `Microsoft.Extensions.Configuration` 直接支持绑定成强类型类。

> [!def] 官方定义
> `appsettings.json` 是 **Microsoft.Extensions.Configuration** 配置体系默认使用的 JSON 配置文件；配套的 `ConfigurationBuilder` 支持 JSON 文件、环境变量、命令行参数等多数据源，通过 `GetSection`/`Get<T>` 把配置映射为强类型对象。它是 .NET Core/.NET 5+ 官方推荐配置方案（Web 与桌面通用）：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/configuration ；WPF 桌面应用接入方式：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/system-dependencies 。与 WPF 自带的 `System.Configuration.ConfigurationManager`（老式 App.config）是两套体系，官方推荐新项目用前者。

> [!origin] 由来背景
> `appsettings.json` 是 ASP.NET Core（2016 年发布）带来的配置革命产物：老式 `App.config` 的 XML 结构繁琐、强类型绑定弱、多环境切换痛苦（Debug/Release/生产各一份）。微软在 .NET Core 中重做配置系统，以 JSON 为基础、构建器（Builder）组合多源（文件/环境变量/命令行），并支持 `IOptions<T>` 强类型绑定与运行时热更新。WPF 桌面应用从 .NET Core 3.0 起也可完整使用该体系，逐渐取代 `App.config` 成为 .NET 桌面开发配置主流。上位机里"多产线不同配置"正是其多环境/多文件优势的最佳舞台。

> [!essentials] 核心要点
> - **核心包**：`Microsoft.Extensions.Configuration` + `Microsoft.Extensions.Configuration.Json` + `Microsoft.Extensions.Configuration.Binder`
> - **构建流程**：`ConfigurationBuilder().SetBasePath(AppContext.BaseDirectory).AddJsonFile("appsettings.json")` → `.Build()`
> - **强类型绑定**：`config.GetSection("Device").Get<DeviceOptions>()` 映射为类，杜绝魔法字符串
> - **层级结构**：JSON 天然支持嵌套（`"Device": { "Com": "COM3", "BaudRate": 9600 }`）
> - **与 App.config 区别**：JSON 更简洁、支持绑定/热更新；老式 `App.config` 用 `ConfigurationManager.AppSettings`（见 `传统-appconfig-方式`）

> [!example] 完整示例
> **appsettings.json 读取演示：仿照 .NET Core 配置体系，用 JSON 存放设备与通信参数，程序读取后绑定到界面，比 App.config 更结构化：**
>
> **appsettings.json（复制到输出目录）：**
> ```json
> {
>   "Device": {
>     "Name": "高速贴片机",
>     "Ip": "192.168.1.50",
>     "Port": 502
>   },
>   "Comm": {
>     "TimeoutMs": 3000,
>     "RetryCount": 3
>   }
> }
> ```
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="appsettings.json 配置" Height="340" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="从 appsettings.json 读取配置" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="加载配置并连接设备" Click="OnLoad" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.IO;
> using System.Text.Json;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 强类型配置类，与 JSON 结构一一对应
>     public class DeviceOptions
>     {
>         public string Name { get; set; }
>         public string Ip { get; set; }
>         public int Port { get; set; }
>     }
>
>     public class AppOptions
>     {
>         public DeviceOptions Device { get; set; }
>         public int TimeoutMs { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnLoad(object sender, RoutedEventArgs e)
>         {
>             // 读取 JSON 文件并反序列化为强类型对象（真实项目可用 Microsoft.Extensions.Configuration）
>             string json = File.ReadAllText("appsettings.json");
>             var options = JsonSerializer.Deserialize<AppOptions>(json);
>
>             OutputText.Text =
>                 $"设备：{options.Device.Name}  {options.Device.Ip}:{options.Device.Port}\n" +
>                 $"超时：{options.TimeoutMs}ms（反序列化后强类型访问）";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 新 WPF 上位机项目：串口/网口参数、设备地址、报警阈值等集中管理
> ✅ 多产线部署：同一程序不同产线用不同配置文件（或环境变量覆盖）
> ✅ 需要强类型绑定的配置：配置与 `DeviceOptions` 类一一映射，改错名编译期报错
> ✅ 需要热更新的配置：`reloadOnChange` 让报警阈值修改即时生效（见 `配置加密与运行时修改`）
> ❌ 极简小工具：一个常量类就够了，配置文件是多余负担
> ❌ 敏感密钥配置：密码/Token 别明文放配置，用加密或环境变量（见 `配置加密与运行时修改`）

> [!pitfall] 常见踩坑
> 坑 1：**相对路径找不到文件** → 现象：发布后启动报"配置文件不存在" → 原因：`AddJsonFile("appsettings.json")` 用的是当前工作目录，而非程序目录 → 解决：`SetBasePath(AppContext.BaseDirectory)` 指向程序集所在目录
> 
> 坑 2：**JSON 写错/属性名对不上不报错** → 现象：绑定后全是默认值，程序"安静地"用了错误配置 → 原因：`Get<T>` 绑定失败不抛异常 → 解决：`Bind` 后校验必填字段，日志记录配置加载结果（见 `serilog-结构化日志`）；开发期 `optional: false` 强制文件存在
>
> 坑 3：**配置硬编码 + 魔法字符串** → 现象：代码里到处写 `"Com"`、`"BaudRate"` → 原因：没走强类型绑定 → 解决：定义 `DeviceOptions` 类 + `config.GetSection("Device").Get<DeviceOptions>()`，用 `nameof` 引用属性

> [!best] 最佳实践
> - 配置文件按节组织：`Device`、`Alarm`、`Log`、`MES`，节名与绑定类对应，结构一目了然
> - 必填配置启动时校验：加载完检查"空则抛异常/给默认值"，别让程序带病运行
> - 开发/生产环境区分：`appsettings.json` + `appsettings.Production.json`（`AddJsonFile` 环境变量后缀），交付切换方便
> - 配置类只读：绑定后的配置对象只读（`init`/私有 set），防止运行中被随意篡改
> - 结合 DI 注入配置：`IOptions<DeviceOptions>` 或直接注入绑定实例（见第 7 章 `什么是依赖注入`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，修改 `appsettings.json` 里的串口号/阈值，重启程序观察界面显示新值
> **Lv.2 小试牛刀**：新增 `AlarmOptions`（阈值、使能开关）配置节并绑定，界面显示并验证读取正确
> **Lv.3 融会贯通**：加 `SetBasePath` + `optional: false`，把配置文件挪到错误目录验证启动报错提示，再放回正确
> **Lv.4 拆层挑战**：开启 `reloadOnChange`，用 `IOptionsMonitor<DeviceOptions>.OnChange` 实现"改配置不重启即时生效"（见 `配置加密与运行时修改`）

> [!related] 相关知识链接
> - ← 前置知识：`传统-appconfig-方式`（老方案对比）、第 7 章 `什么是依赖注入`（配置注入）
> - → 后续必学：`配置加密与运行时修改`（安全与热更新）
> - ⇄ 关联概念：`单例模式`（配置中心常为单例）、`上位机插件化场景`（插件选择读配置）
> - 📖 官方文档：.NET 配置：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/configuration ；Options 模式：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/options
