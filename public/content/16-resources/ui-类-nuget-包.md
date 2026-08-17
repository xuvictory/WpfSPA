---
title: UI 类 NuGet 包
section: 16-resources
parent: 16.6 常用 NuGet 包清单
---

# UI 类 NuGet 包

> [!plain] 白话理解
> WPF 自带控件"能干活，但不好看"：默认按钮灰扑扑的、没有卡片、没有图标。**UI 类 NuGet 包**就是"界面装修包"——控件库（换皮肤 + 补控件）和图表库（画曲线）装上之后，界面立马从"程序员风格"变成"产品级"。选对组合，上位机界面开发能省一半功夫。

> [!def] 官方定义
> **UI 类 NuGet 包**是 WPF 生态中用于**界面增强与数据可视化**的第三方库集合（NuGet 检索：https://www.nuget.org/ ）。常用清单：
> - **HandyControl**（NuGet：`HandyControl`）：国产控件库，80+ 控件、暗色主题、Growl 通知（见 `handycontrol` 篇）
> - **MaterialDesignInXAML**（NuGet：`MaterialDesignThemes`）：Material Design 风格控件库（见 `materialdesigninxaml` 篇）
> - **MahApps.Metro**（NuGet：`MahApps.Metro`）：老牌 Metro 风格控件库，窗口美化与主题切换
> - **LiveCharts2**（NuGet：`LiveChartsCore.SkiaSharpView.WPF`）：SkiaSharp 实时图表（见 `livecharts2` 篇）
> - **OxyPlot**（NuGet：`OxyPlot.Wpf`）：轻量绘图库，科学图表与报表（见 `oxyplot` 篇）
> - **WPF Animated GIF**（NuGet：`WpfAnimatedGif`）：GIF 动图支持（如加载动画、指示图标）
>
> 这些均为**第三方开源库**（非微软官方），微软官方只提供基础控件（https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/ ），美化与可视化全靠生态库补充。

> [!origin] 由来背景
> WPF 发布后，其"控件样式可完全替换"的机制催生了繁荣的控件库生态。**MahApps.Metro**（2011 年前后）最早把 Metro 风格带给 WPF；**MaterialDesignInXAML**（2015 年前后）把 Google Material 设计语言引入；**HandyControl**（2018 年前后）以"控件多 + 中文友好"满足国内工控界面需求。图表方面，OxyPlot 老而稳、LiveCharts2 新而快。上位机行业逐渐形成"**控件库选一套 + 图表库选一套**"的组合惯例，界面开发从"手搓样式"升级为"组合封装"。

> [!essentials] 核心要点
> - **控件库二选一为主**：HandyControl 或 MaterialDesignInXAML 做主题基础，避免两套混用
> - **图表库按场景选**：实时滚动选 LiveCharts2，静态报表/频谱选 OxyPlot
> - **引入方式**：NuGet 安装后，`App.xaml` 合并主题资源字典（如 `pack://.../Themes/SkinDefault.xaml`）
> - **图标补充**：控件库内置图标（HandyControl `hc:IconElement`），不够用加 `FontAwesome.WPF` 等
> - **动效小件**：`WpfAnimatedGif` 支持 GIF 加载动画，指示灯/状态提示更直观
> - **版本兼容**：UI 库对 .NET 版本敏感，装前看 TargetFramework 是否匹配项目

> [!example] 完整示例
> **UI 类库快速选型：按场景推荐控件库组合演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="UI 类库选型" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="UI 类库快速选型" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="HandyControl" Foreground="#238636" FontWeight="Bold"/>
>                 <TextBlock Text="侧重：常用控件补充、扁平暗色主题" Foreground="#8B949E" Margin="0,4,0,0"/>
>             </StackPanel>
>         </Border>
>         <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="MaterialDesignInXaml" Foreground="#238636" FontWeight="Bold"/>
>                 <TextBlock Text="侧重：Material 设计语言、动效与提示" Foreground="#8B949E" Margin="0,4,0,0"/>
>             </StackPanel>
>         </Border>
>         <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="LiveCharts2 / OxyPlot" Foreground="#238636" FontWeight="Bold"/>
>                 <TextBlock Text="侧重：实时曲线与数据可视化" Foreground="#8B949E" Margin="0,4,0,0"/>
>             </StackPanel>
>         </Border>
>         <ComboBox x:Name="LibBox" Margin="0,0,0,8" Background="#161B22" Foreground="White"
>                   BorderBrush="#21262D"/>
>         <Button Content="推荐组合" Click="OnSuggestClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             LibBox.Items.Add("实时数据监控上位机");
>             LibBox.Items.Add("产线看板大屏");
>             LibBox.Items.Add("简单工具软件");
>             LibBox.SelectedIndex = 0;
>         }
>
>         private void OnSuggestClick(object sender, RoutedEventArgs e)
>         {
>             switch (LibBox.SelectedIndex)
>             {
>                 case 0:  // 实时数据监控
>                     StatusText.Text = "推荐：HandyControl（界面）+ LiveCharts2（曲线）+ MQTTnet（通信）";
>                     break;
>                 case 1:  // 产线看板大屏
>                     StatusText.Text = "推荐：MaterialDesignInXaml（大屏风格）+ OxyPlot（趋势）+ Serilog（日志）";
>                     break;
>                 default: // 简单工具软件
>                     StatusText.Text = "推荐：纯 WPF 自带控件即可，按需引入 HandyControl 增强体验";
>                     break;
>             }
>             StatusText.Foreground = Brushes.LimeGreen;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 上位机界面美化与控件增强（卡片、通知、主题）
> ✅ 实时曲线、趋势图、频谱图可视化
> ✅ 大屏看板快速搭建
> ✅ 加载动画、状态指示灯等细节增强
> ❌ 纯后台/无界面项目（引入 UI 库增加体积与依赖）
> ❌ 已有成熟自定义设计系统的大型项目（用自研样式更可控）

> [!pitfall] 常见踩坑
> 坑 1：**两套控件库混用样式冲突** → 现象：HandyControl 与 MaterialDesign 同时合并主题，控件样式互相覆盖 → 原因：两库都全局替换默认样式 → 解决：一个项目只选一套做主主题，另一套仅用于个别控件或干脆不用
>
> 坑 2：**控件库版本与 .NET 版本不匹配** → 现象：装包后编译报 `TargetFramework` 不支持 → 原因：老版本控件库不支持新 .NET → 解决：装最新版（支持 .NET 6+），或选与项目匹配的版本；查库的 GitHub Releases
>
> 坑 3：**图标字体缺失显示方块** → 现象：图标控件显示为 □ → 原因：字体资源未随包加载或未设 `FontFamily` → 解决：确认合并主题/资源字典，图标控件显式设置对应字体族（如 `FontAwesome`）

> [!best] 最佳实践
> - 主主题库"只选一套"：HandyControl（控件全）或 MaterialDesignInXAML（风格统一）
> - 图表按"实时/报表"选：实时 LiveCharts2、报表 OxyPlot，别在一处堆两套
> - 主题资源统一在 `App.xaml` 合并，禁止各窗口零散引用
> - 版本升级前看库的 Breaking Changes（GitHub Releases），老项目锁版本
> - 用 `工控看板模板项目` 的布局思路 + 控件库组合，界面开发效率最高

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把"简单工具软件"的推荐文案改成你自己常用的组合
> **Lv.2 小试牛刀**：给项目安装 HandyControl，把默认按钮换成 `hc:Card` 卡片布局
> **Lv.3 融会贯通**：用 LiveCharts2 给监控页面加实时曲线，与控件库主题风格统一
> **Lv.4 拆层挑战**：做一个"UI 选型决策表"（场景 × 控件库 × 图表库），并按它完成一个完整监控页面的选型落地

> [!related] 相关知识链接
> - ← 前置知识：[`handycontrol`](handycontrol)、[`materialdesigninxaml`](materialdesigninxaml)（控件库详解）
> - → 后续必学：[`livecharts2`](livecharts2)、[`oxyplot`](oxyplot)（图表库详解）
> - ⇄ 关联概念：[`数据类-nuget-包`](数据类-nuget-包)、[`mvvm-与通信类-nuget-包`](mvvm-与通信类-nuget-包)
> - 📖 官方文档：WPF 控件库 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/ ；NuGet：https://www.nuget.org/
