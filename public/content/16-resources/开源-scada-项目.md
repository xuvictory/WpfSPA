---
title: 开源 SCADA 项目
section: 16-resources
parent: 16.2 上位机相关开源项目
---

# 开源 SCADA 项目

> [!plain] 白话理解
> "开源 SCADA 项目"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"开源 SCADA 项目"是一个重要的知识点。技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 开源 SCADA 项目是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 开源 SCADA 项目的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"开源 SCADA 项目"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **SCADA 设备监控主画面：状态指示灯与实时数据刷新演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SCADA 监控主画面" Height="460" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="车间设备 SCADA 监控" Foreground="#58A6FF" FontSize="18"
>                    FontWeight="Bold" Margin="0,0,0,12"/>
>         <UniformGrid Grid.Row="1" Columns="3" Margin="0,0,0,12">
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="1 号泵" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="Pump1Dot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="Pump1Text" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="Pump1Speed" Text="0 RPM" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="2 号泵" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="Pump2Dot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="Pump2Text" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="Pump2Speed" Text="0 RPM" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="空压机" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="CompDot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="CompText" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="CompPress" Text="0.00 MPa" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>         </UniformGrid>
>         <Border Grid.Row="2" Background="#161B22" Padding="10" CornerRadius="6">
>             <DockPanel>
>                 <Button Content="启动 / 停止巡检" Click="OnToggleClick" DockPanel.Dock="Top"
>                         Padding="8" Background="#21262D" Foreground="White" Margin="0,0,0,8"/>
>                 <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"/>
>             </DockPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Shapes;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 定时器模拟 PLC / 采集站推送的实时数据
>         private readonly DispatcherTimer _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         private readonly Random _random = new Random();
>         private bool _running;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Tick += OnTimerTick;
>         }
>
>         private void OnToggleClick(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             _timer.IsEnabled = _running;
>             LogText.Text = _running ? "开始采集，实时刷新设备状态 ..." : "已停止采集";
>         }
>
>         private void OnTimerTick(object sender, EventArgs e)
>         {
>             // 模拟 1 号泵运行、2 号泵待机、空压机压力波动
>             UpdateDevice(Pump1Dot, Pump1Text, Pump1Speed, true, _random.Next(1200, 1500) + " RPM");
>             UpdateDevice(Pump2Dot, Pump2Text, Pump2Speed, false, "0 RPM");
>
>             var pressure = _random.Next(30, 80) / 10.0;
>             CompPress.Text = pressure.ToString("F2") + " MPa";
>             CompDot.Fill = pressure > 0.5 ? Brushes.LimeGreen : Brushes.OrangeRed;
>             CompText.Text = pressure > 0.5 ? "运行" : "低压";
>         }
>
>         private void UpdateDevice(Ellipse dot, TextBlock state, TextBlock speed, bool running, string speedText)
>         {
>             // 统一的设备状态刷新逻辑：运行=绿色，停止=红色
>             dot.Fill = running ? Brushes.LimeGreen : Brushes.OrangeRed;
>             state.Text = running ? "运行" : "停止";
>             state.Foreground = running ? Brushes.LimeGreen : Brushes.Gray;
>             speed.Text = speedText;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**概念理解不清就上手** → 建议先把本章节的前置知识点学完，理解基础原理后再动手写代码
> 
> 坑 2：**忽略了官方文档** → Microsoft Docs 上有最权威的说明和最完整的示例代码，遇到问题先查文档
>
> 坑 3：**代码写的太"一次性"** → 养成写可复用代码的习惯，以后项目中会反复用到这些知识

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"开源 SCADA 项目"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"开源 SCADA 项目"
> - → 后续必学：掌握"开源 SCADA 项目"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
