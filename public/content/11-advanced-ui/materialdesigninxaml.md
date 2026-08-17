---
title: MaterialDesignInXAML
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# MaterialDesignInXAML

> [!plain] 白话理解
> MaterialDesignInXAML 是把**谷歌 Material Design 设计语言搬进 WPF** 的控件库：卡片式面板、悬浮按钮、波纹点击、浮动标签输入框、对话框、通知条，全是 Material 风格"即插即用"的现成件。装配方式两步：`App.xaml` 里放一个 `BundledTheme`（选深色/浅色 + 主色/辅色），再合并 `MaterialDesign2.Defaults.xaml`（给所有控件装默认样式）；然后窗口里用 `md:Card`、`md:Button` 等直接搭界面。示例右侧的浮动标签输入框（`HintAssist.Hint`）就是 Material 的招牌交互——输入框里始终显示"温度上限"提示，聚焦时才让位。

> [!def] 官方定义
> **MaterialDesignInXAML** 是开源 WPF 控件库（GitHub: MaterialDesignInXAML/MaterialDesignInXAML，NuGet 包 `MaterialDesignThemes`），实现 Google Material Design（2014 年发布的设计语言）的 WPF 控件集与主题系统。启用方式：在 `App.xaml` 的 `MergedDictionaries` 中加入 `materialDesign:BundledTheme`（设置 `BaseTheme`、`PrimaryColor`、`SecondaryColor`）并合并 `MaterialDesign2.Defaults.xaml`。提供 `Card`、`FloatingHintTextBox`、`DialogHost`、`Snackbar`、`PaletteHelper`（运行时改主题色）等控件与 API。详见官方仓库：https://github.com/MaterialDesignInXAML/MaterialDesignInXAML 。

> [!origin] 由来背景
> Google 2014 年发布 Material Design，确立了"纸片层级、阴影、波纹、动效"的设计语言，安卓/iOS/Web 都迅速跟进。WPF 社区也想用这套语言，于是 2014 年前后 MaterialDesignInXAML 项目启动：把 Material 规范逐项实现为 WPF 控件与主题资源（沿用 2006 年 WPF 的资源字典 + `ControlTemplate` 机制）。经过多年迭代，它成为 WPF 世界最流行的 Material 风格库之一，支持 Material Design 2 规范，提供 `BundledTheme` 一条配置完成主题装配。上位机用它做"现代感"界面（卡片化设备面板、悬浮操作按钮、Snackbar 提示）非常顺手，代价是 Material 风格偏消费级、信息密度相对低。

> [!essentials] 核心要点
> - **安装**：NuGet 安装 `MaterialDesignThemes`（示例注释已给出）
> - **主题装配**：`BundledTheme`（`BaseTheme="Dark/Light"` + `PrimaryColor`/`SecondaryColor`）+ `MaterialDesign2.Defaults.xaml`，缺一不可（示例 App.xaml）
> - **命名空间**：`xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"`，控件前缀 `materialDesign:`（示例 `materialDesign:Card`）
> - **常用控件**：`Card`（卡片）、`Button`（`MaterialDesignRaisedButton`/`MaterialDesignOutlinedButton` 等按钮样式）、`DialogHost`（对话框）、`Snackbar`（消息条）
> - **浮动标签**：`materialDesign:HintAssist.Hint` 给输入框加浮动提示（示例）
> - **运行时换色**：`PaletteHelper` 的 `SetTheme`/`ReplacePrimaryColor` 实现主题色动态调整

> [!example] 完整示例
> **MaterialDesignInXAML 上位机面板演示：NuGet 安装 MaterialDesignThemes 后，在 App.xaml 合并 BundledTheme 与默认样式，窗口用 md: 命名空间下的卡片、按钮、对话框等控件搭建设备控制面板：**
>
> **说明：先通过 NuGet 安装 `Install-Package MaterialDesignThemes`。**
>
> **App.xaml：**
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <ResourceDictionary>
>             <ResourceDictionary.MergedDictionaries>
>                 <!-- 深色主题 + 品牌色 -->
>                 <materialDesign:BundledTheme BaseTheme="Dark"
>                                               PrimaryColor="Blue"
>                                               SecondaryColor="Lime"/>
>                 <!-- 组件默认样式必须合并，否则控件无样式 -->
>                 <ResourceDictionary Source="pack://application:,,,/MaterialDesignThemes.Wpf;component/Themes/MaterialDesign2.Defaults.xaml"/>
>             </ResourceDictionary.MergedDictionaries>
>         </ResourceDictionary>
>     </Application.Resources>
> </Application>
> ```
>
> **MainWindow.xaml —— MaterialDesign 风格控件：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"
>         Title="MaterialDesignInXAML 上位机面板" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="MaterialDesignInXAML 控件库（NuGet：MaterialDesignThemes）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Margin="0,12,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <!-- MaterialDesign 卡片 -->
>             <materialDesign:Card Padding="16" Margin="0,0,6,0" UniformCornerRadius="6">
>                 <StackPanel>
>                     <TextBlock Text="设备启停" Foreground="White" FontWeight="Bold" FontSize="15"/>
>                     <TextBlock Text="状态：运行中" x:Name="StateText" Foreground="#238636"
>                                Margin="0,8,0,0"/>
>                     <Button Style="{StaticResource MaterialDesignRaisedButton}"
>                             Content="启动设备" Margin="0,14,0,0" Click="OnStart"/>
>                     <Button Style="{StaticResource MaterialDesignOutlinedButton}"
>                             Content="停止设备" Margin="0,10,0,0" Click="OnStop"/>
>                 </StackPanel>
>             </materialDesign:Card>
>             <!-- MaterialDesign 浮动输入框 + 滑动条 -->
>             <materialDesign:Card Grid.Column="1" Padding="16" Margin="6,0,0,0"
>                                  UniformCornerRadius="6">
>                 <StackPanel>
>                     <TextBlock Text="参数设置" Foreground="White" FontWeight="Bold" FontSize="15"/>
>                     <materialDesign:HintAssist.Hint>
>                         <TextBlock Text="输入温度上限"/>
>                     </materialDesign:HintAssist.Hint>
>                     <TextBox materialDesign:HintAssist.Hint="输入温度上限（℃）"
>                              Text="80" Margin="0,12,0,0" Foreground="White"/>
>                     <TextBlock Text="目标转速" Foreground="#8B949E" Margin="0,16,0,4"/>
>                     <Slider Minimum="0" Maximum="3000" Value="1200" Foreground="#58A6FF"/>
>                 </StackPanel>
>             </materialDesign:Card>
>         </Grid>
>     </Grid>
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
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "状态：运行中";
>             StateText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "状态：已停止";
>             StateText.Foreground = new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 想要"卡片化 + 现代感"的设备控制面板（示例场景）
> ✅ 操作界面需要清晰视觉层级：卡片分区、悬浮按钮、浮动标签输入
> ✅ 需要现成对话框/消息条组件（`DialogHost`/`Snackbar`）快速搭建交互
> ✅ 品牌色统一：`BundledTheme` 一处配置主色/辅色，全界面跟随
> ❌ 传统密集工控界面（Material 风格留白多、信息密度低，不适合大量表格仪表）
> ❌ 对启动体积/渲染性能敏感的低配工控机（主题资源较庞大）

> [!pitfall] 常见踩坑
> 坑 1：**只加 `BundledTheme` 忘了合并 `Defaults.xaml`** → 现象：`md:` 控件能编译但运行时无样式、或报"找不到资源" → 原因：主题色只是画刷，控件默认样式在 `MaterialDesign2.Defaults.xaml` 里 → 解决：两段资源必须成对合并（示例 App.xaml）
> 
> 坑 2：**`Button` 用了通用样式后无 Material 外观** → 现象：按钮还是原生样子 → 原因：直接 `Style` 覆盖了库的隐式样式，或没引用库按钮样式 → 解决：用库提供的 `MaterialDesignRaisedButton`/`MaterialDesignOutlinedButton` 等命名样式（示例）
>
> 坑 3：**运行时改主题色不生效** → 现象：`PaletteHelper` 改了主色但界面没变 → 原因：控件里写死颜色或用了 `StaticResource` 引用主题画刷 → 解决：界面颜色统一引用库主题资源（`MaterialDesign.*`），改动后 `PaletteHelper.SetTheme` 全链路刷新

> [!best] 最佳实践
> - 装配顺序固定：`BundledTheme` 在前、`MaterialDesign2.Defaults.xaml` 在后，App 级合并
> - 界面用库的命名样式（`MaterialDesignRaisedButton` 等）而非裸 `Style`，保持视觉体系一致
> - 输入控件用 `HintAssist.Hint` 做浮动标签，减少界面上额外的标签文字控件
> - 主题色统一走 `PaletteHelper` 调整（主色/辅色/深浅），不要在业务代码里直接 new 画刷
> - 与其他库混用时以 Material 为主样式库，冲突控件显式指定样式（见 `materialdesigninxaml-与-handycontrol-主题定制`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：NuGet 安装 `MaterialDesignThemes`，按示例装配运行；把 `BaseTheme` 改为 `Light`、`PrimaryColor` 改为 `Teal` 观察整体变化
> **Lv.2 小试牛刀**：给窗口加一个 `materialDesign:Snackbar`，启动/停止设备时弹出提示条；再用 `DialogHost` 做一个"确认停机"对话框
> **Lv.3 融会贯通**：用 `PaletteHelper` 实现运行时主色切换（下拉框选色），验证主题色全界面联动（配合 `动态切换主题`）
> **Lv.4 拆层挑战**：把示例改造成 MVVM：按钮绑定 `RelayCommand`，`StateText` 绑定 VM 状态属性，`HintAssist` 输入框绑定参数属性，验证第三方控件库与命令/绑定的兼容性

> [!related] 相关知识链接
> - ← 前置知识：`资源字典组织主题`（`BundledTheme`/`Defaults.xaml` 就是资源字典装配）、「第 5 章·什么是样式」「什么是样式」（库隐式样式机制）
> - → 后续必学：`materialdesigninxaml-与-handycontrol-主题定制`（Material 与 Handy 混用主题定制）、`livecharts2-图表`（Material 风格图表搭配）
> - ⇄ 关联概念：`动态切换主题`（主题色运行时切换）、`modernwpf`（同类的另一风格库）
> - 📖 官方文档：MaterialDesignInXAML GitHub：https://github.com/MaterialDesignInXAML/MaterialDesignInXAML ；NuGet：https://www.nuget.org/packages/MaterialDesignThemes ；官方 Wiki：https://github.com/MaterialDesignInXAML/MaterialDesignInXAML/wiki
