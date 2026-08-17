---
title: 看板 UI 与读写功能
section: 14-projects
parent: 14.2 项目二：Modbus PLC 数据采集看板（进阶级）
---

# 看板 UI 与读写功能

> [!plain] 白话理解
> "看板 UI 与读写功能"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"看板 UI 与读写功能"是一个重要的知识点。把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 看板 UI 与读写功能是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 看板 UI 与读写功能的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"看板 UI 与读写功能"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **Modbus 数据看板演示：每 1 秒轮询模拟 PLC 的 4 路寄存器并在看板卡片上实时刷新，点击"写入 40001"将设定值下发给 PLC，体现看板 UI 的"读展示 + 写控制"一体化设计：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus 数据看板" Height="420" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="PLC 数据看板（实时刷新 + 读写）" Foreground="#58A6FF"
>                    FontSize="14" FontWeight="Bold" Margin="0,0,0,10"/>
>         <!-- 4 路寄存器卡片 -->
>         <UniformGrid Grid.Row="1" Columns="4">
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40001 温度" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg1Text" Text="0" Foreground="#58A6FF" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40002 压力" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg2Text" Text="0" Foreground="#238636" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40003 速度" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg3Text" Text="0" Foreground="#58A6FF" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40004 产量" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg4Text" Text="0" Foreground="#238636" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>         </UniformGrid>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="10" Margin="0,10">
>             <StackPanel>
>                 <TextBlock Text="写入寄存器（设置温度目标值）" Foreground="#58A6FF"
>                            FontWeight="Bold" Margin="0,0,0,6"/>
>                 <StackPanel Orientation="Horizontal">
>                     <TextBox x:Name="WriteBox" Text="25" Width="80" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4"/>
>                     <Button Content="写入 40001" Click="OnWrite" Margin="8,0,0,0" Padding="8"
>                             Background="#21262D" Foreground="White"/>
>                     <TextBlock x:Name="StatusText" Text="就绪" Foreground="#8B949E"
>                                VerticalAlignment="Center" Margin="12,0,0,0"/>
>                 </StackPanel>
>             </StackPanel>
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
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private readonly Random _rand = new Random();
>         private readonly ushort[] _regs = new ushort[4];
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Interval = TimeSpan.FromSeconds(1);
>             _timer.Tick += OnPoll;
>             _timer.Start();
>         }
>
>         // 周期性轮询刷新看板（实际项目：ModbusClient.ReadHoldingRegisters）
>         private void OnPoll(object sender, EventArgs e)
>         {
>             for (int i = 0; i < _regs.Length; i++)
>                 _regs[i] = (ushort)(100 + _rand.Next(900));
>             Reg1Text.Text = _regs[0].ToString();
>             Reg2Text.Text = _regs[1].ToString();
>             Reg3Text.Text = _regs[2].ToString();
>             Reg4Text.Text = _regs[3].ToString();
>             StatusText.Text = $"最近刷新 {DateTime.Now:HH:mm:ss}";
>             StatusText.Foreground = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>         }
>
>         // 写入功能：把输入框设定值下发给 40001，并回显到看板
>         private void OnWrite(object sender, RoutedEventArgs e)
>         {
>             if (!ushort.TryParse(WriteBox.Text, out ushort value)) return;
>             _regs[0] = value;
>             Reg1Text.Text = value.ToString();
>             StatusText.Text = $"已写入 40001 = {value}";
>             StatusText.Foreground = Brushes.LimeGreen;
>         }
>     }
> }
> ```
> 
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"看板 UI 与读写功能"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"看板 UI 与读写功能"
> - → 后续必学：掌握"看板 UI 与读写功能"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
