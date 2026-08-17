---
title: 通信管理与 OEE 计算
section: 14-projects
parent: 14.3 项目三：产线设备状态监控平台（进阶级）
---

# 通信管理与 OEE 计算

> [!plain] 白话理解
> "通信管理与 OEE 计算"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"通信管理与 OEE 计算"是一个重要的知识点。把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 通信管理与 OEE 计算是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 通信管理与 OEE 计算的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"通信管理与 OEE 计算"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **OEE 指标计算演示：输入计划运行时间、实际运行时间、理论产量、实际产量、合格产量，点击计算得到可用率、性能率、合格率与综合 OEE，并按色块显示评级：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="通信管理与 OEE 计算" Height="480" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="OEE 综合设备效率计算" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Grid.Row="1" Margin="0,0,0,10">
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="计划运行时间 (h)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="PlanBox" Grid.Column="1" Text="8" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="实际运行时间 (h)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="RunBox" Grid.Column="1" Text="6.5" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="理论产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="TheoBox" Grid.Column="1" Text="800" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="实际产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="OutBox" Grid.Column="1" Text="620" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="合格产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="GoodBox" Grid.Column="1" Text="600" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>         </StackPanel>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="计算结果" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                 <TextBlock x:Name="ResultText" Text="点击下方按钮计算…" Foreground="#8B949E"
>                            FontFamily="Consolas" TextWrapping="Wrap"/>
>                 <Border x:Name="OeeBadge" Background="#21262D" CornerRadius="4" Padding="8,4"
>                         Margin="0,10,0,0" HorizontalAlignment="Left">
>                     <TextBlock x:Name="OeeLevelText" Text="--" Foreground="#8B949E"/>
>                 </Border>
>             </StackPanel>
>         </Border>
>         <Button Grid.Row="3" Content="计算 OEE" Click="OnCalc" Margin="0,12,0,0" Padding="10"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnCalc(object sender, RoutedEventArgs e)
>         {
>             // 输入合法性校验
>             if (!double.TryParse(PlanBox.Text, out double plan) || plan <= 0 ||
>                 !double.TryParse(RunBox.Text, out double run) || run <= 0 ||
>                 !double.TryParse(TheoBox.Text, out double theo) || theo <= 0 ||
>                 !double.TryParse(OutBox.Text, out double output) || output <= 0 ||
>                 !double.TryParse(GoodBox.Text, out double good) || good <= 0)
>             {
>                 ResultText.Text = "请输入合法的正数！";
>                 return;
>             }
>
>             // OEE 三要素：可用率 × 性能率 × 合格率
>             double availability = run / plan;                                  // 可用率
>             double performance = (output / run) / (theo / plan);               // 性能率
>             double quality = good / output;                                    // 合格率
>             double oee = availability * performance * quality;                 // 综合 OEE
>
>             ResultText.Text =
>                 $"可用率 = {availability:P1}\n" +
>                 $"性能率 = {performance:P1}\n" +
>                 $"合格率 = {quality:P1}\n" +
>                 $"OEE   = {oee:P1}";
>
>             // 国际惯例分级：>85% 世界级，70~85% 良好，<70% 需改善
>             if (oee >= 0.85) SetOeeLevel("世界级", Color.FromRgb(0x23, 0x86, 0x36));
>             else if (oee >= 0.70) SetOeeLevel("良好", Color.FromRgb(0x58, 0xA6, 0xFF));
>             else SetOeeLevel("需改善", Color.FromRgb(0xDA, 0x36, 0x33));
>         }
>
>         private void SetOeeLevel(string text, Color color)
>         {
>             OeeLevelText.Text = text;
>             OeeBadge.Background = new SolidColorBrush(color);
>             OeeLevelText.Foreground = Brushes.White;
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"通信管理与 OEE 计算"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"通信管理与 OEE 计算"
> - → 后续必学：掌握"通信管理与 OEE 计算"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
