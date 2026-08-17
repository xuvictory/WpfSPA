---
title: ModernWPF
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# ModernWPF

> [!plain] 白话理解
> WPF 原生控件是"功能齐全但长相朴素"的标准件。ModernWPF 相当于给这批标准件**重新开了一套磨具**：合并它的主题资源字典后，所有原生控件（按钮、输入框、下拉框、开关）不用改一行代码，自动换上 Windows 10/11 的 WinUI/Flutter 风格外观——圆角、亚克力、动效全都有。示例里只是普通的 `TextBox`/`ComboBox`/`ToggleButton`，但合并 `Theme/Dark.xaml` + `Theme/Controls.xaml` 后，整个界面瞬间变成现代 Windows 应用的样子，这就是"隐式样式接管全局"的威力。

> [!def] 官方定义
> **ModernWPF** 是开源 WPF 控件库（GitHub: Kinnara/ModernWpf，NuGet 包 `ModernWpf`），目标是让 WPF 应用获得 Windows 10/11 的 Fluent Design / WinUI 风格外观。它通过提供整套 `ControlTemplate` 隐式样式（`Theme/Dark.xaml`、`Theme/Light.xaml`、`Theme/Controls.xaml`）替换原生控件默认外观，并支持在 `App.xaml` 合并资源后自动生效。还提供亚克力背景（`BackdropMaterial`）、波纹效果（`Ripple`）、`ModernWindow` 等扩展。详见官方仓库：https://github.com/Kinnara/ModernWpf 。

> [!origin] 由来背景
> WPF（2006 年随 .NET Framework 3.0 发布）的默认控件外观停留在"经典灰"时代，十几年未变，与 Windows 10/11 的 Fluent Design（2017 年起微软推行）格格不入。社区因此出现多个"给 WPF 换现代皮"的库：**ModernWpf** 是其中影响力较大的一个，由韩国开发者 Kinnara 维护，目标是尽可能忠实地复刻 WinUI 2 的视觉与交互（圆角卡片、亚克力材质、按压动效），同时**不引入新控件类型**——开发者继续用原生控件名，合并主题后外观自动升级。它靠"隐式样式覆盖"机制实现零侵入改造，也是理解"WPF 主题化"这一理念的绝佳案例。

> [!essentials] 核心要点
> - **安装**：NuGet 安装 `ModernWpf`（示例注释已给出 `Install-Package ModernWpf`）
> - **资源合并**：`App.xaml` 的 `MergedDictionaries` 合并 `Theme/Dark.xaml`（或 `Theme/Light.xaml`）+ `Theme/Controls.xaml`
> - **零侵入生效**：合并后原生控件自动应用隐式样式，无需给单个控件改 `Style`
> - **深色/浅色**：`Dark.xaml` 与 `Light.xaml` 两套主题任选其一，切换方式与其他主题库一致（换资源字典）
> - **扩展能力**：`ModernWindow`（带标题栏的现代窗口）、`BackdropMaterial`（亚克力背景）、`Ripple`（点击波纹）
> - **命名空间**：扩展控件与特性使用 `xmlns:ui="http://schemas.modernwpf.com/2019"`

> [!example] 完整示例
> **ModernWPF 风格化上位机演示：NuGet 安装 ModernWpf 后，App.xaml 合并其主题资源，控件自动获得 WinUI 风格的深色外观，无需逐个改样式：**
>
> **说明：先通过 NuGet 安装 `Install-Package ModernWpf`。**
>
> **App.xaml：**
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <ResourceDictionary>
>             <ResourceDictionary.MergedDictionaries>
>                 <!-- ModernWpf 暗色主题：合并后所有原生控件自动换装 -->
>                 <ResourceDictionary Source="pack://application:,,,/ModernWpf;component/Theme/Dark.xaml"/>
>                 <ResourceDictionary Source="pack://application:,,,/ModernWpf;component/Theme/Controls.xaml"/>
>             </ResourceDictionary.MergedDictionaries>
>         </ResourceDictionary>
>     </Application.Resources>
> </Application>
> ```
>
> **MainWindow.xaml —— 原生控件自动获得 Modern 风格：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ModernWPF 上位机界面" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="ModernWPF 控件库（NuGet：ModernWpf，自动替换原生控件外观）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold" TextWrapping="Wrap"/>
>         <Grid Grid.Row="1" Margin="0,12,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <StackPanel Margin="0,0,6,0">
>                 <TextBlock Text="设备参数" Foreground="#8B949E" Margin="0,0,0,8"/>
>                 <TextBox Text="注塑机 3# " Margin="0,0,0,10" Padding="8"/>
>                 <ComboBox SelectedIndex="0" Margin="0,0,0,10" Padding="8">
>                     <ComboBoxItem Content="自动模式"/>
>                     <ComboBoxItem Content="手动模式"/>
>                 </ComboBox>
>                 <CheckBox Content="启用实时监控" IsChecked="True" Margin="0,0,0,10"/>
>                 <ToggleButton Content="报警静音" Margin="0,0,0,10" Padding="8"/>
>             </StackPanel>
>             <Border Grid.Column="1" Background="#161B22" BorderBrush="#21262D"
>                     BorderThickness="1" CornerRadius="6" Margin="6,0,0,0" Padding="12">
>                 <StackPanel>
>                     <TextBlock Text="操作日志" Foreground="#58A6FF" FontWeight="Bold"/>
>                     <TextBox x:Name="LogBox" Margin="0,10,0,0" Height="220" IsReadOnly="True"
>                              TextWrapping="Wrap" VerticalScrollBarVisibility="Auto"
>                              Background="#0D1117"/>
>                     <Button Content="写入测试日志" Click="OnWriteLog" Margin="0,12,0,0"
>                             HorizontalAlignment="Left" Padding="12,6"/>
>                 </StackPanel>
>             </Border>
>         </Grid>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnWriteLog(object sender, RoutedEventArgs e)
>         {
>             LogBox.AppendText($"[{DateTime.Now:HH:mm:ss}] 测试日志写入（ModernWpf 主题下按钮为 WinUI 风格）\n");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 想快速获得 Windows 10/11 现代外观的上位机（合并主题即完成整体换装）
> ✅ 对 WinUI/Fluent 风格有偏好的监控界面（圆角、亚克力、简洁）
> ✅ 不想引入"新控件类型"、只想换皮的项目（继续写原生控件名）
> ✅ 新项目的起点皮肤：ModernWpf 提供干净的基础再叠加业务配色
> ❌ 需要工业感强、按钮密集的传统工控界面（Modern 风格偏"消费级"，信息密度低）
> ❌ 需要与其他全局主题库混用的项目（多个库的隐式样式会互相覆盖）

> [!pitfall] 常见踩坑
> 坑 1：**合并资源后部分控件没变** → 现象：按钮是新的，但 `TextBox` 还是老的 → 原因：`Controls.xaml` 没合并，或该控件显式写了 `Style` 覆盖了隐式样式 → 解决：`Dark.xaml` 与 `Controls.xaml` 必须成对合并；显式 `Style` 的地方用 `BasedOn` 继承库默认样式
> 
> 坑 2：**深色/浅色切换不生效** → 现象：换了 `Light.xaml` 但界面还是深色 → 原因：两套主题都合并了，后合并的覆盖先合并的；或窗口背景写死了深色 → 解决：只合并一套主题，窗口背景用库的 `DynamicResource` 主题色
>
> 坑 3：**与自定义样式库冲突** → 现象：按钮一会儿是自己的样式一会儿是 Modern → 原因：ModernWpf 的隐式样式与自定义隐式样式存在优先级竞争 → 解决：自定义样式统一用 `BasedOn` 基于 Modern 默认样式扩展，或显式指定 `Style` 归属

> [!best] 最佳实践
> - 主题合并放 `App.xaml` 最前，一套深色或浅色二选一，不要同时合并两套
> - 业务自定义样式用 `BasedOn` 继承 ModernWpf 默认样式，保证视觉体系一致
> - 需要亚克力/波纹时引入 `ui:` 命名空间按需使用，避免全局开启影响性能
> - 更新库版本前先看 Changelog，`Theme/` 资源路径偶有调整（升级后回归一遍关键界面）
> - 混用第三方库时以 ModernWpf 为主样式库，其他库控件显式指定样式（见 `materialdesigninxaml-与-handycontrol-主题定制`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：NuGet 安装 `ModernWpf`，按示例合并两套资源运行，对比"合并不合并"的外观差异
> **Lv.2 小试牛刀**：把 `Theme/Dark.xaml` 换成 `Theme/Light.xaml` 观察浅色外观；给 `ToggleButton` 加一个 `ui:Ripple` 波纹效果
> **Lv.3 融会贯通**：用 `ModernWindow` 替换普通 `Window`（自定义标题栏），并把窗口背景改为亚克力（`BackdropMaterial`），体验 Fluent 风格
> **Lv.4 拆层挑战**：实现 ModernWpf 的深/浅主题运行时切换（替换 `MergedDictionaries`），并验证业务自定义样式通过 `BasedOn` 随主题联动

> [!related] 相关知识链接
> - ← 前置知识：`资源字典组织主题`（ModernWpf 本质是整套资源字典）、「第 5 章·什么是样式」「什么是样式」（隐式样式机制）
> - → 后续必学：`livecharts2-图表`（与 Modern 风格搭配的图表）、`dynamicresourc`（主题色引用）
> - ⇄ 关联概念：`动态切换主题`（深/浅主题切换的通用做法）、`materialdesigninxaml-与-handycontrol-主题定制`（同类的其他主题库）
> - 📖 官方文档：ModernWpf GitHub：https://github.com/Kinnara/ModernWpf ；NuGet：https://www.nuget.org/packages/ModernWpf ；ModernWpf 文档：https://github.com/Kinnara/ModernWpf/wiki
