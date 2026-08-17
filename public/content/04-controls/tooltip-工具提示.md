---
title: ToolTip 工具提示
section: 04-controls
parent: 4.6 日期与信息显示控件
---

# ToolTip 工具提示

> [!plain] 白话理解
> ToolTip 就是「鼠标悬停提示」：把鼠标停在某个按钮或图标上一两秒，旁边浮出一个小面板，解释这个按钮是干什么的。上位机界面上全是图标按钮，操作工不一定认得出每个图标——ToolTip 就是给图标配的「无声说明书」，不占界面空间，需要时才出现。

> [!def] 官方定义
> `ToolTip`（全限定名 `System.Windows.Controls.ToolTip`）是显示在控件旁的小型信息浮层，通过任意 `FrameworkElement.ToolTip` 属性挂载：鼠标悬停一段时间后自动出现，移开自动消失。内容可为字符串或任意元素，`Placement` 控制出现位置，`Open()` / `Close()` 方法可代码控制。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.tooltip

> [!origin] 由来背景
> ToolTip 是 1990 年代图形界面「提示式帮助」的产物：早期 Windows 工具条只有图标没有文字，用户不认识图标，于是微软在 Win32 中加入「气球提示」——悬停几秒后浮现按钮名称。WPF 在 .NET Framework 3.0 中把 ToolTip 升级为内容容器，可以放图片、表格、状态数据等富内容，成为上位机「图标按钮 + 信息卡」的标准搭配。

> [!essentials] 核心要点
> - 挂载方式：`ToolTip="字符串"` 或 `<Button.ToolTip><ToolTip>…</ToolTip></Button.ToolTip>`
> - 富内容：ToolTip 内容可放任意元素（Border + StackPanel + 多行 TextBlock）
> - `Placement`：`Top` / `Bottom` / `Left` / `Right` 等，默认跟随鼠标附近
> - 代码动态设置：`控件.ToolTip = new ToolTip { ... }`
> - 悬停自动出现、移开自动关闭，无需事件处理

> [!example] 完整示例
> **设备状态提示演示：字符串 ToolTip、富内容 ToolTip（含图片/面板）、代码动态修改提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="工具提示 - ToolTip" Height="320" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Width="420">
>         <!-- 1. 简单字符串提示 -->
>         <Button Content="启动设备（悬停看提示）" Padding="10" Margin="0,0,0,12"
>                 HorizontalContentAlignment="Left" Background="#21262D"
>                 Foreground="White"
>                 ToolTip="点击后启动设备 M-101，耗时约 3 秒"/>
>
>         <!-- 2. 富内容 ToolTip：自定义面板 -->
>         <Button x:Name="btnDetail" Content="查看设备详情（悬停看富提示）" Padding="10"
>                 HorizontalContentAlignment="Left" Background="#21262D"
>                 Foreground="White">
>             <Button.ToolTip>
>                 <ToolTip Placement="Right">
>                     <Border Background="#161B22" BorderBrush="#2A4A6C"
>                             BorderThickness="1" Padding="10" MinWidth="200">
>                         <StackPanel>
>                             <TextBlock Text="电机 M-101" FontWeight="Bold" Foreground="White"/>
>                             <TextBlock Text="转速：1500 RPM" Foreground="#8B949E" Margin="0,4,0,0"/>
>                             <TextBlock Text="温度：65 ℃（正常）" Foreground="#3FB950"/>
>                         </StackPanel>
>                     </Border>
>                 </ToolTip>
>             </Button.ToolTip>
>         </Button>
>
>         <!-- 3. 代码动态设置 ToolTip -->
>         <Button x:Name="btnDynamic" Content="动态提示按钮" Padding="10" Margin="0,12,0,0"
>                 Click="OnUpdateTip" HorizontalContentAlignment="Left"
>                 Background="#21262D" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnUpdateTip(object sender, RoutedEventArgs e)
>         {
>             // 代码中动态构造富内容提示
>             btnDynamic.ToolTip = new ToolTip
>             {
>                 Content = new StackPanel
>                 {
>                     Children =
>                     {
>                         new TextBlock
>                         {
>                             Text = "运行统计",
>                             FontWeight = FontWeights.Bold,
>                             Foreground = Brushes.White
>                         },
>                         new TextBlock
>                         {
>                             Text = "今日运行 7.5 小时",
>                             Foreground = Brushes.LightGreen
>                         }
>                     }
>                 }
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 图标按钮 / 工具栏按钮的「功能说明」文字
> ✅ 鼠标悬停设备列表条目时显示设备详情卡片
> ✅ 监控数值显示完整单位、量程、报警阈值等补充信息
> ✅ 输入框提示格式要求（如「波特率：9600 / 19200 / 38400」）
> ❌ 需要用户交互（点击按钮、输入内容）时（改用 [popup-弹出层](popup-弹出层)）
> ❌ 信息量大、需要长时间阅读时（放常规布局或 [expander-折叠面板](expander-折叠面板)）

> [!pitfall] 常见踩坑
> 坑 1：**ToolTip 富内容里绑定不显示** → 现象：自定义 ToolTip 面板中的 `{Binding}` 是空白。原因：ToolTip 不在可视化树中，`DataContext` 不继承宿主。解决：给 ToolTip 显式设置 `DataContext`（如绑定 `PlacementTarget`），或只用静态文本。
> 
> 坑 2：**悬停提示一闪而过或延迟太短** → 现象：鼠标刚移上去提示立刻消失，来不及读。原因：系统默认的显示 / 消失延迟不适合富内容提示。解决：用 `ToolTipService.InitialShowDelay` / `ShowDuration`（如 500ms 后显示、5000ms 后消失）调整时长。
>
> 坑 3：**深色主题下 ToolTip 白底刺眼** → 现象：富内容面板设置了深色，但 ToolTip 默认边框和阴影还是系统浅色。原因：未自定义 ToolTip 的 `Background` / `BorderBrush` 与内容不一致。解决：在 ToolTip 上设置 `Background="#161B22"`、`Foreground="White"`、`BorderBrush="#2A4A6C"`，与主界面风格统一。

> [!best] 最佳实践
> - ToolTip 文本简洁：一句话说清「这个控件做什么」，避免冗长
> - 图标按钮全部配置 ToolTip，这是上位机可操作性的基本要求
> - 富内容提示（设备状态卡）用 `ToolTipService.ShowDuration` 延长显示时间
> - 深色主题项目为 ToolTip 定义统一 `Style`（背景、前景、边框、内边距）
> - 提示内容来自数据时（如设备温度）用代码或绑定动态更新，别写死静态文本

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，悬停三个按钮观察字符串提示、富内容提示、动态提示的区别
> **Lv.2 小试牛刀**：给「启动设备」按钮的 ToolTip 加上第二行文本（换行）；把「查看设备详情」的富提示 `Placement` 改为 `Top`
> **Lv.3 融会贯通**：给一个 ListBox 的条目设置 ItemTemplate，每行显示设备名，悬停时 ToolTip 显示该行设备完整信息（通过绑定）
> **Lv.4 挑战进阶**：实现「动态 ToolTip」：按钮悬停时提示「当前转速：1500 RPM」，数值每 2 秒刷新（用定时器更新 ToolTip 内容），验证动态富内容提示

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[button-按钮](button-按钮)」与「[toolbar-工具栏](toolbar-工具栏)」，图标按钮需要 ToolTip 说明
> - → 后续必学：本章「[popup-弹出层](popup-弹出层)」对比可交互浮层
> - ⇄ 关联概念：信息展示基础见「[textblock-轻量文本](textblock-轻量文本)」，需确认的弹窗用第 4.10 章「[messagebox-消息弹窗](messagebox-消息弹窗)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.tooltip
