---
title: 二进制资源与 Pack URI
section: 05-core-concepts
parent: 5.6 资源系统
---

# 二进制资源与 Pack URI

> [!plain] 白话理解
> WPF 项目里不只是颜色和样式才算"资源"——图片、图标、字体文件、音频、甚至 .dll 都是资源。这些东西不是 XAML，不能写 `{StaticResource}`，但它们需要跟随程序一起发布。WPF 用 **Build Action（生成操作）** 来决定文件怎么处理（嵌入？复制？），用 **Pack URI** 来统一寻址（无论文件嵌在程序集里还是放在磁盘上）。Pack URI 看起来像 `pack://application:,,,/Images/logo.png`，它告诉 WPF："去应用程序的资源包（pack）里找 `Images/logo.png` 这个文件"。

> [!def] 官方定义
> Pack URI 是 WPF 中统一资源标识符（URI）的一种专用格式，遵循 RFC 2396 规范，前缀为 `pack://`。格式为 `pack://<authority>/<path>`。最常用的三种形式：① `pack://application:,,,/file`（引用当前程序集的嵌入式资源）；② `pack://application:,,,/ReferencedAssembly;component/file`（引用其他程序集的资源）；③ `pack://siteoforigin:,,,/file`（引用可执行文件同目录下的松散文件。WPF 的 Build Action 包括 `Resource`（嵌入程序集，可通过 Pack URI 访问）、`Content`（复制到输出目录，配合 CopyToOutputDirectory）、`EmbeddedResource`（.NET 传统嵌入方式，WPF 不推荐）、`None`（不处理）。

> [!origin] 由来背景
> 桌面应用发布时需要把依赖的图片、字体等文件一起打包。WinForms 用的 `EmbeddedResource` 将文件嵌入 exe/dll，但访问时必须用 `Assembly.GetManifestResourceStream()`，路径格式和文件系统不一致。WPF 推出了 Pack URI 方案：用一种统一的 URI 语法，既可以访问嵌入的资源，也可以访问松散文件。这背后是 `PackWebRequest` 和 `PackWebResponse` 这套 URI 解析机制在支撑。

> [!essentials] 核心要点
> - **pack://application:,,,**：访问嵌入在程序集（exe/dll）中的资源
> - **pack://application:,,,/ReferencedAssembly;component/**：访问其他引用的程序集中的资源
> - **pack://siteoforigin:,,,**：访问与 exe 同级目录下的松散文件
> - **Build Action = Resource**：文件嵌入程序集，通过 pack URI 访问，最常用
> - **Build Action = Content + CopyToOutputDirectory**：文件复制到输出目录，访问时用 siteoforigin
> - **/component 后缀**：引用其他程序集时必须加 `;component/` 前缀

> [!example] 完整示例
>
> 演示上位机中如何引用嵌入的图标和外部配置文件。

> **项目文件结构（Solution Explorer）**
> ```
> HmiDemo/
> ├── App.xaml
> ├── MainWindow.xaml
> ├── Assets/
> │   ├── Icons/
> │   │   ├── motor.png      ← Build Action: Resource
> │   │   ├── pump.png       ← Build Action: Resource
> │   │   └── alarm.png      ← Build Action: Resource
> │   └── Fonts/
> │       └── Digital.ttf    ← Build Action: Resource
> ├── Configs/
> │   └── plc_settings.json  ← Build Action: Content, Copy if newer
> └── plc_settings.json      ← 编译后出现在 bin/Debug/Configs/
> ```
>
> **App.xaml** — 在应用资源中加载字体
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>     </Application.Resources>
> </Application>
> ```
>
> **MainWindow.xaml** — 使用 pack URI 引用图片资源
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备监控" Height="450" Width="700"
>         WindowStartupLocation="CenterScreen">
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 标题 -->
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <StackPanel Orientation="Horizontal">
>                 <!-- ===== Pack URI 引用图片 ===== -->
>                 <Image Source="pack://application:,,,/Assets/Icons/motor.png"
>                        Width="24" Height="24" Margin="0,0,8,0"/>
>                 <TextBlock Text="设备监控面板"
>                            Foreground="#FF6B35" FontSize="16"
>                            FontWeight="Bold" VerticalAlignment="Center"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- 设备卡片——使用 Pack URI 引用不同设备的图标 -->
>         <WrapPanel Grid.Row="1" Margin="15">
>             
>             <!-- 电机 -->
>             <Border Width="210" Margin="5"
>                     Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="12">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Image Source="/Assets/Icons/motor.png"
>                                Width="30" Height="30"/>
>                         <StackPanel Margin="8,0,0,0">
>                             <TextBlock Text="电机 M-101"
>                                        Foreground="White"
>                                        FontWeight="Bold" FontSize="14"/>
>                             <TextBlock Text="运行中 ●"
>                                        Foreground="#3FB950"
>                                        FontSize="11" Margin="0,4,0,0"/>
>                         </StackPanel>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 水泵 -->
>             <Border Width="210" Margin="5"
>                     Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="12">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <!-- 省略 pack://application:,,, 前缀的简写形式 -->
>                         <Image Source="/Assets/Icons/pump.png"
>                                Width="30" Height="30"/>
>                         <StackPanel Margin="8,0,0,0">
>                             <TextBlock Text="水泵 P-203"
>                                        Foreground="White"
>                                        FontWeight="Bold" FontSize="14"/>
>                             <TextBlock Text="运行中 ●"
>                                        Foreground="#3FB950"
>                                        FontSize="11" Margin="0,4,0,0"/>
>                         </StackPanel>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 报警 -->
>             <Border Width="210" Margin="5"
>                     Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="12"
>                     BorderBrush="#CC2222" BorderThickness="1">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Image Source="/Assets/Icons/alarm.png"
>                                Width="30" Height="30"/>
>                         <StackPanel Margin="8,0,0,0">
>                             <TextBlock Text="变频器 VFD-01"
>                                        Foreground="White"
>                                        FontWeight="Bold" FontSize="14"/>
>                             <TextBlock Text="过载报警 ▲"
>                                        Foreground="#CC2222"
>                                        FontSize="11" Margin="0,4,0,0"/>
>                         </StackPanel>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>             
>         </WrapPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs** — 代码中加载和读取资源
> ```csharp
> using System;
> using System.IO;
> using System.Text.Json;
> using System.Windows;
> using System.Windows.Media.Imaging;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>         Loaded += OnLoaded;
>     }
> 
>     private void OnLoaded(object sender, RoutedEventArgs e)
>     {
>         // === 1. 代码中通过 Pack URI 加载嵌入图片 ===
>         var motorImage = new BitmapImage();
>         motorImage.BeginInit();
>         motorImage.UriSource = new Uri(
>             "pack://application:,,,/Assets/Icons/motor.png",
>             UriKind.Absolute);
>         motorImage.EndInit();
>         // motorImage 现在可以赋值给 Image.Source
> 
>         // === 2. 代码中通过 Stream 读取嵌入的 Resource 文件 ===
>         var streamInfo = Application.GetResourceStream(
>             new Uri("pack://application:,,,/Assets/Icons/alarm.png",
>                     UriKind.Absolute));
>         if (streamInfo != null)
>         {
>             using var stream = streamInfo.Stream;
>             System.Diagnostics.Debug.WriteLine(
>                 $"Alarm icon loaded, size: {stream.Length} bytes");
>         }
> 
>         // === 3. 读取松散文件（Content 类型，siteoforigin） ===
>         var configPath = Path.Combine(
>             AppDomain.CurrentDomain.BaseDirectory, "Configs", "plc_settings.json");
>         if (File.Exists(configPath))
>         {
>             var json = File.ReadAllText(configPath);
>             System.Diagnostics.Debug.WriteLine(
>                 $"Config loaded: {json.Substring(0, Math.Min(50, json.Length))}...");
>         }
>         else
>         {
>             System.Diagnostics.Debug.WriteLine(
>                 "Config file not found at: " + configPath);
>         }
> 
>        // === 4. 通过 siteoforigin Pack URI 访问 ===
>        var configUri = new Uri(
>            "pack://siteoforigin:,,,/Configs/plc_settings.json",
>            UriKind.Absolute);
>        var configStreamInfo = Application.GetResourceStream(configUri);
>        if (configStreamInfo != null)
>        {
>            using var reader = new StreamReader(configStreamInfo.Stream);
>            var content = reader.ReadToEnd();
>            System.Diagnostics.Debug.WriteLine($"SiteOfOrigin: {content}");
>        }
>     }
> }
> ```
>
> **Configs/plc_settings.json**（位于输出目录，独立于 exe）
> ```json
> {
>     "plcAddress": "192.168.1.100",
>     "port": 502,
>     "refreshInterval": 500
> }
> ```
>
> Pack URI 的三种形式总结：
> | 场景 | URI |
> |------|-----|
> | 当前程序集的嵌入资源 | `pack://application:,,,/Assets/Icons/motor.png` |
> | 简写（省略前缀） | `/Assets/Icons/motor.png` |
> | 其他程序集 | `pack://application:,,,/SharedLib;component/Icons/gear.png` |
> | 松散文件（与 exe 同级） | `pack://siteoforigin:,,,/Configs/plc_settings.json` |

> [!scene] 适用场景
> - ✅ **嵌入 Resource**（Build Action = Resource）：图标、Logo、字体、默认占位图——跟着程序走，不会丢
> - ✅ **Content + CopyToOutputDirectory**：用户可编辑的配置文件、可替换的图片素材
> - ✅ **ReferencedAssembly**：公共 UI 库中的图标/样式/模板
> - ✅ **siteoforigin**：插件文件、用户上传的图片、外部数据文件
> - ❌ 大文件（几 MB 以上）用 Resource 嵌入——会使 exe/dll 体积膨胀，影响启动速度

> [!pitfall] 常见踩坑
> - **坑1：Build Action 设成 None 但 XAML 中用 Pack URI 引用**。None 类型的文件不会嵌入程序集，也不会复制到输出目录，XAML 中引用会报"找不到资源"。解决方案：确认 Build Action 为 `Resource`（嵌入）或 `Content + CopyToOutputDirectory`（复制）。
> - **坑2：引用其他程序集的资源忘了加 `;component/`**。格式应该是 `pack://application:,,,/AssemblyName;component/Path/File.png`。漏了 `;component/` 会导致运行时 UriFormatException。解决方案：熟记格式，或使用 `Resources` 设计器自动生成正确 URI。
> - **坑3：siteoforigin URI 在放开目录权限的部署场景下失效**。如果应用安装在 Program Files，默认没有写入权限，siteoforigin 引用的文件路径也受限于权限。解决方案：用户可修改的文件放在 `%APPDATA%` 目录而非 exe 同目录。

> [!best] 最佳实践
> - 项目中的图标统一放在 `Assets/Icons/` 目录，字体放在 `Assets/Fonts/`，配置文件放在独立的 `Resources/Config/` 目录
> - 默认 Build Action 设置：图片/图标/字体 = `Resource`；用户可改的配置文件 = `Content + Copy if newer`
> - XAML 中引用嵌入资源推荐用短格式 `/Assets/Icons/motor.png`（省略 pack://application:,,, 前缀），更简洁且 IDE 有智能提示
> - 对需要动态切换的图片（如设备状态图标），用代码中构造 `BitmapImage` 的方式赋值，而非在 XAML 中写死
> - 上位机中 PLC 配置文件应放在安装目录外的用户数据目录，方便维护人员修改——而非用 Resource 嵌入

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：在项目中创建 `Assets/Icons/` 文件夹，放入 3 张自定义图标（motor/pump/sensor），设置为 Resource，在 XAML 中用 Pack URI 引用它们显示在按钮和图片上
> - **Lv.2 小试牛刀**：实现一个"设备图标自动匹配"功能——代码中根据设备类型（Motor/Pump/Valve）动态构造对应的 Pack URI 并加载图标到 Image 控件，而不是在 XAML 中硬编码
> - **Lv.3 融会贯通**：设计一个外部资源加载系统——允许用户把自定义图标放在 exe 同级的 `CustomIcons/` 目录中，程序启动时先检查 siteoforigin 是否有同名图片，有则优先使用外部图片，没有才用嵌入的默认图标

> [!related] 相关知识链接
> - ← 前置：资源字典 — XAML 资源的组织方式
> - → 后续：什么是样式？— Style 资源也是通过资源字典管理
> - ⇄ 关联：应用程序打包与部署 — Pack URI 和 WPF 应用部署模型密切相关
> - ⇄ 关联：资源定义与引用 — 非对象资源的二进制文件管理
> - 📖 官方文档：[Pack URIs in WPF](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/app-development/pack-uris-in-wpf)
