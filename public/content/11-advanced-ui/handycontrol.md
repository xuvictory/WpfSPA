---
title: HandyControl
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# HandyControl

> [!plain] 白话理解
> HandyControl 是国内用得最广的 WPF 开源控件库之一，专门给桌面软件（尤其是工控/上位机）提供"**好看又好用**"的现成控件：仪表盘、进度条、标签、步骤条、通知弹层、导航抽屉一应俱全。用它的流程和别的库一样：`App.xaml` 合并 `SkinDefault.xaml`（皮肤）+ `Theme.xaml`（主题），然后窗口里用 `hc:Gauge`、`hc:Tag`、`hc:StepBar` 直接搭。示例的看板就是工控味十足的搭配：仪表盘显示温度、Tag 显示在线状态、步骤条展示启动流程，报警时 `Growl.Warning(...)` 弹出右上角全局消息——操作员一眼就能抓住重点。

> [!def] 官方定义
> **HandyControl** 是国产开源 WPF 控件库（GitHub: HandyOrg/HandyControl，NuGet 包 `HandyControl`），提供 60+ 控件与完整主题皮肤系统。启用方式：在 `App.xaml` 的 `MergedDictionaries` 中合并 `Themes/SkinDefault.xaml` 与 `Themes/Theme.xaml`（缺一不可），XAML 声明 `xmlns:hc="https://handyorg.github.io/handycontrol"`。特色控件包括 `Gauge`（仪表盘）、`ProgressBar`、`Card`、`Growl`（全局消息）、`StepBar`（步骤条）、`Tag`（标签）、`RangeSlider`、`Drawer`（抽屉）等；皮肤切换用 `HandyControl.Themes.SkinManager`（`Default`/`Dark`/`Violet` 等）。官方文档（中文）：https://handyorg.github.io/handycontrol/ 。

> [!origin] 由来背景
> WPF 原生控件（2006 年随 .NET Framework 3.0 发布）的默认外观"素"，而上位机/桌面软件想要"工控感"（仪表、状态、清晰的信息密度）往往得自己写一堆控件模板。**HandyControl** 由中国开发者（HandyOrg 团队，主创者 NaBian/顾振宇）于 2017 年前后发起，目标正是补上这块短板：把桌面开发里高频使用的控件做精致并打包，同时提供可换肤的主题系统。因其文档为中文、控件贴合国内工控/办公软件习惯（Gauge、Growl、Drawer、StepBar 等），推出后迅速成为国内 WPF 生态最流行的开源控件库之一，广泛用于上位机、MES、数据监控等项目。

> [!essentials] 核心要点
> - **安装**：NuGet 安装 `HandyControl`（示例注释已给出 `Install-Package HandyControl`）
> - **资源装配**：`SkinDefault.xaml` + `Theme.xaml` 成对合并，缺一不可（示例 App.xaml）
> - **命名空间**：`xmlns:hc="https://handyorg.github.io/handycontrol"`，控件前缀 `hc:`（示例 `hc:Gauge`）
> - **常用控件**：`Gauge`（仪表盘，`Value`/`MinValue`/`MaxValue`/`Header`）、`ProgressBar`、`Tag`、`StepBar`（`ItemCount`/`SelectedIndex`）、`Growl`（静态方法弹全局消息）、`Card`、`Drawer`
> - **皮肤切换**：`SkinManager.Current.Skin` 切换 `Default`/`Dark`/`Violet`，`SkinManager.Current.SetSkin(...)` 运行时换肤
> - **消息通知**：`Growl.Success/Info/Warning/Error("文本")`，右上角弹出，无需额外容器（示例 `Growl.Warning`）

> [!example] 完整示例
> **HandyControl 工控仪表盘演示：NuGet 安装 HandyControl 后，App.xaml 合并皮肤与主题资源，窗口用 hc: 命名空间的仪表盘（Gauge）、步骤条（StepBar）、标签（Tag）搭建设备监控看板，配合 Growl 全局消息提示：**
>
> **说明：先通过 NuGet 安装 `Install-Package HandyControl`。**
>
> **App.xaml：**
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              xmlns:hc="https://handyorg.github.io/handycontrol"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <ResourceDictionary>
>             <ResourceDictionary.MergedDictionaries>
>                 <!-- HandyControl 皮肤与主题，缺一不可 -->
>                 <ResourceDictionary Source="pack://application:,,,/HandyControl;component/Themes/SkinDefault.xaml"/>
>                 <ResourceDictionary Source="pack://application:,,,/HandyControl;component/Themes/Theme.xaml"/>
>             </ResourceDictionary.MergedDictionaries>
>         </ResourceDictionary>
>     </Application.Resources>
> </Application>
> ```
>
> **MainWindow.xaml —— HandyControl 控件：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:hc="https://handyorg.github.io/handycontrol"
>         Title="HandyControl 工控看板" Height="460" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="HandyControl 控件库（NuGet：HandyControl）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Margin="0,12,0,0">
>             <Grid.RowDefinitions>
>                 <RowDefinition Height="*"/>
>                 <RowDefinition Height="Auto"/>
>             </Grid.RowDefinitions>
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="*"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <!-- hc:Gauge 仪表盘：实时显示温度 -->
>                 <hc:Gauge x:Name="TempGauge" Value="76" MinValue="0" MaxValue="100"
>                           Header="车间温度（℃）" Margin="0,0,6,0" Foreground="#58A6FF"/>
>                 <!-- hc:ProgressBar 与状态标签 -->
>                 <StackPanel Grid.Column="1" Margin="6,0,0,0">
>                     <StackPanel Orientation="Horizontal" Margin="0,30,0,10">
>                         <hc:Tag Content="在线" Background="#238636" Foreground="White"/>
>                         <hc:Tag Content="稳定" Background="#21262D" Foreground="#8B949E" Margin="6,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Text="电机负载" Foreground="#8B949E" Margin="0,20,0,4"/>
>                     <hc:ProgressBar x:Name="LoadBar" Value="62" Foreground="#238636" Height="10"/>
>                 </StackPanel>
>             </Grid>
>             <!-- hc:StepBar 步骤条：展示设备启动流程 -->
>             <StackPanel Grid.Row="1" Margin="0,16,0,0">
>                 <TextBlock Text="设备启动流程" Foreground="#8B949E" Margin="0,0,0,6"/>
>                 <hc:StepBar x:Name="StartStep" ItemCount="4" SelectedIndex="2" Margin="0,0,0,10"/>
>                 <Button Content="模拟收到报警并提示" Click="OnAlarm" Padding="12,6"
>                         HorizontalAlignment="Left" Background="#DA3633" Foreground="White"/>
>             </StackPanel>
>         </Grid>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using HandyControl.Controls; // Growl 消息提示所在的命名空间
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
>         // 点击报警按钮：仪表盘指向最高值，并用 Growl 弹出全局消息
>         private void OnAlarm(object sender, RoutedEventArgs e)
>         {
>             TempGauge.Value = 98;
>             LoadBar.Value = 95;
>             Growl.Warning("1# 设备温度接近上限，请检查冷却系统！");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机监控看板：仪表盘、进度条、状态标签、步骤条（示例场景）
> ✅ 需要全局消息通知的界面（`Growl` 替代自写弹窗）
> ✅ 需要抽屉/侧边导航、卡片布局的现代桌面软件
> ✅ 想要一键换肤（`SkinManager` 深色/浅色/紫罗兰）的成品项目
> ❌ 需要极轻量包体的小工具（HandyControl 资源较全，包体相对大）
> ❌ 与其他全局主题库混用时需注意隐式样式冲突（见 `materialdesigninxaml-与-handycontrol-主题定制`）

> [!pitfall] 常见踩坑
> 坑 1：**只合并了 `SkinDefault.xaml` 或 `Theme.xaml` 其中一个** → 现象：`hc:` 控件无样式或运行时报资源找不到 → 原因：皮肤（颜色）与主题（控件模板）是两个文件，缺一不可 → 解决：成对合并（示例 App.xaml 两行）
> 
> 坑 2：**`Growl` 没有显示在窗口上** → 现象：调 `Growl.Warning` 没反应或消息出现在别的窗口 → 原因：`Growl` 默认挂在 `Application.MainWindow` 上，或 `App` 没合并资源 → 解决：确认资源已合并；多窗口时用 `Growl` 指定 `Panel` 或确认主窗口存在
>
> 坑 3：**皮肤切换后部分控件颜色不对** → 现象：`SkinManager` 切了深色，但某控件还是浅色 → 原因：业务代码写死了颜色，或用了 `StaticResource` 引用皮肤画刷 → 解决：界面颜色用库的 `DynamicResource` 主题资源，避免写死（配合 `动态切换主题`）

> [!best] 最佳实践
> - 装配顺序固定：`SkinDefault.xaml` 在前、`Theme.xaml` 在后，App 级合并
> - 工控界面优先用 `hc:Gauge`/`hc:ProgressBar`/`hc:Tag` 组合，信息密度高且符合操作员习惯
> - 全局消息统一用 `Growl.Success/Info/Warning/Error`，按严重级别配色，别自写弹窗
> - 皮肤切换统一走 `SkinManager`，业务代码不直接改颜色；多窗口注意 `Growl` 挂载窗口
> - 与 Material/Modern 混用时以 Handy 为主样式库，冲突控件显式指定样式归属

> [!practice] 上手练习
> **Lv.1 照猫画虎**：NuGet 安装 `HandyControl`，按示例装配运行；点"模拟收到报警"观察 Gauge 跳变、LoadBar 上升与 Growl 消息
> **Lv.2 小试牛刀**：给 `StartStep` 加"上一步/下一步"按钮联动 `SelectedIndex`；再用 `hc:Drawer` 做一个参数设置抽屉
> **Lv.3 融会贯通**：用 `SkinManager.Current.SetSkin(Skin.Dark)` 与 `Skin.Default` 做深/浅皮肤切换按钮，观察全界面联动
> **Lv.4 拆层挑战**：把看板改造成 MVVM：`TempGauge.Value` 绑定 VM 属性（模拟温度采集），`Growl` 在 VM 通过事件/服务触发，验证第三方控件库融入 MVVM 架构

> [!related] 相关知识链接
> - ← 前置知识：`资源字典组织主题`（`SkinDefault`/`Theme` 就是资源字典装配）、「第 5 章·什么是样式」「什么是样式」
> - → 后续必学：`materialdesigninxaml-与-handycontrol-主题定制`（与 Material 混用时的主题定制）、`livecharts2-图表`（数据可视化图表搭配）
> - ⇄ 关联概念：`动态切换主题`（`SkinManager` 底层就是换资源字典）、`modernwpf`（同类的另一风格库）
> - 📖 官方文档：HandyControl GitHub：https://github.com/HandyOrg/HandyControl ；中文文档：https://handyorg.github.io/handycontrol/ ；NuGet：https://www.nuget.org/packages/HandyControl
