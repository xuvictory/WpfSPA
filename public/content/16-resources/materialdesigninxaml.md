---
title: MaterialDesignInXAML
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# MaterialDesignInXAML

> [!plain] 白话理解
> 如果说原生 WPF 控件像"毛坯房"，那么 **MaterialDesignInXAML** 就是一支"装修队"——它把 Google 的 Material Design 设计语言（卡片、阴影、圆角、动效）整体搬进 WPF，让上位机界面从灰白单调变得现代美观，**不需要手写任何复杂样式**。对整天和仪表盘、参数面板打交道的上位机开发来说，它是提升软件"颜值"和客户观感的最快途径。

> [!def] 官方定义
> **MaterialDesignInXAML** 是一个**社区开源**的 WPF 控件库，不是微软官方产物。它用纯 XAML + C# 实现了 Google Material Design 设计规范，提供主题资源（`MaterialDesignTheme`）、矢量图标（`PackIcon`）、对话框（`DialogHost`）、卡片（`Card`）等一整套控件与样式。项目托管在 GitHub（https://github.com/MaterialDesignInXAML/MaterialDesignInXamlToolkit ），通过 NuGet 包 **`MaterialDesignThemes`** 安装使用，支持 .NET Framework 4.5.2+ 与 .NET Core/.NET 5+。

> [!origin] 由来背景
> 2014 年 Google 在 I/O 大会上正式发布 **Material Design** 设计语言，以纸张质感、层叠阴影、灵动色彩与动效著称。由于 WPF 的 XAML 天生适合声明式 UI，社区开发者自发将其移植到 WPF，2015 年启动 **MaterialDesignInXAML** 项目并持续迭代至今。它精准解决了 WPF 原生控件"功能够用但不好看"的痛点，成为 WPF 生态中 Star 数最高的第三方控件库之一。

> [!essentials] 核心要点
> - **引入主题资源**：在 `App.xaml` 中合并 `MaterialDesignTheme.Light.xaml` 与 `MaterialDesignTheme.Defaults.xaml`，全局生效
> - **PackIcon 图标**：`<materialDesign:PackIcon Kind="Cog"/>` 即可用矢量图标，无需准备图片资源
> - **HintAssist 提示**：`materialDesign:HintAssist.Hint="设备名称"` 让 TextBox 拥有浮动占位提示
> - **DialogHost 对话框**：用 `DialogHost` 包裹内容，通过 `DialogHost.Show(obj)` 即可弹出确认框、输入框
> - **Card 卡片控件**：`<materialDesign:Card>` 自带圆角与阴影，天然适合做设备状态卡片
> - **深浅色主题**：切换 `MaterialDesignTheme.Light/Dark.xaml` 即可一键换肤

> [!example] 完整示例
> **MaterialDesignInXaml 主题控件：提示输入与保存操作演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"
>         Title="MaterialDesign 演示" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="MaterialDesignInXaml 主题控件" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <TextBox x:Name="DeviceBox" Text="写入设备名称" Margin="0,0,0,10" Padding="6"
>                  materialDesign:HintAssist.Hint="设备名称"
>                  Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         <Button Content="保存设备信息" Click="OnSaveClick" Margin="0,0,0,10" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" TextWrapping="Wrap"/>
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
>         // 需通过 NuGet 安装 MaterialDesignThemes 包，并在 App.xaml 合并主题资源
>         public MainWindow() => InitializeComponent();
>
>         private void OnSaveClick(object sender, RoutedEventArgs e)
>         {
>             var name = DeviceBox.Text.Trim();
>             if (string.IsNullOrEmpty(name))
>             {
>                 StatusText.Text = "设备名称不能为空";
>                 StatusText.Foreground = Brushes.OrangeRed;
>             }
>             else
>             {
>                 StatusText.Text = "已保存设备：" + name;
>                 StatusText.Foreground = Brushes.LimeGreen;
>             }
>         }
>     }
> }
> ```
>

> [!scene] 适用场景
> ✅ 上位机监控主界面美化（设备卡片、数据看板）
> ✅ 参数设置、配方管理等表单密集型页面
> ✅ 需要与现代感 UI 提升产品档次的交付项目
> ✅ 与 LiveCharts2 曲线库搭配做工业数据可视化
> ❌ 要求与老款工控机原生 Windows 风格完全一致的场景
> ❌ 团队已有成熟自有 UI 规范、不想引入第三方主题的项目

> [!pitfall] 常见踩坑
> 坑 1：**主题资源没合并就报"找不到资源"异常** → 只装了 NuGet 包却忘记在 `App.xaml` 合并 `MaterialDesignTheme.*.xaml`，运行即崩溃；解决：在 `App.xaml` 中依次合并 `MaterialDesignTheme.Light.xaml` 和 `MaterialDesignTheme.Defaults.xaml`
>
> 坑 2：**深浅色切换"一半是黑的一半是白的"** → 只切换了主题资源，却给控件硬编码了 `Background="#FFFFFF"`；解决：尽量使用主题提供的 `DynamicResource` 色板（如 `MaterialDesign.Brush.Background`），避免硬编码颜色
>
> 坑 3：**版本兼容问题** → MaterialDesignThemes 新版要求 .NET 8 或更高，老项目升级包后编译报错；解决：升级前先确认目标框架版本，必要时锁定旧版包或同步升级 .NET

> [!best] 最佳实践
> - 在 `App.xaml` 统一引入主题资源，不要在单个窗口里零散引入
> - 图标优先用 `PackIcon` 矢量图标，避免为每个图标准备 PNG
> - 用 `DialogHost` 统一管理确认/输入弹窗，而不是反复用 `MessageBox`
> - 设备状态用 `Card` + 状态色（绿/红/黄）组合，一眼可读
> - 升级包版本前先看 GitHub Releases 的 Breaking Changes 说明

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把主色从绿色改为蓝色，观察整站换色效果
> **Lv.2 小试牛刀**：给示例页面加一个 `PackIcon` 设备图标，并用 `HintAssist.Hint` 优化输入框
> **Lv.3 融会贯通**：用 `DialogHost.Show` 实现"删除设备二次确认"弹窗，替换原来的 `MessageBox`
> **Lv.4 拆层挑战**：独立搭建一个 4 张设备卡片 + 1 个实时状态区域的监控看板页面，全部用 MaterialDesign 控件完成

> [!related] 相关知识链接
> - ← 前置知识：[`什么是样式`](什么是样式)、[`资源字典`](资源字典)（05-core-concepts）
> - → 后续必学：[`handycontrol`](handycontrol)（同类的国产控件库，控件更全）
> - ⇄ 关联概念：`什么是-wpf-资源`、[`livecharts2`](livecharts2)（曲线可视化搭配使用）
> - 📖 官方文档：https://github.com/MaterialDesignInXAML/MaterialDesignInXamlToolkit
