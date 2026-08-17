---
title: Manipulation 事件
section: 11-advanced-ui
parent: 11.10 触控与手势
---

# Manipulation 事件

> [!plain] 白话理解
> "Manipulation 事件"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"Manipulation 事件"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> Manipulation 事件是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> Manipulation 事件的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"Manipulation 事件"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **触控面板拖移演示：给方块设置 IsManipulationEnabled，订阅 ManipulationStarting / ManipulationDelta / ManipulationCompleted，用 TranslateTransform 实现手指拖动（注意：Canvas.Left 在非 Canvas 容器中不生效，故用变换实现）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Manipulation 事件 - 触控拖移" Height="440" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="触控拖移：在方块上按住并拖动（Manipulation 事件）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold" TextWrapping="Wrap"/>
>         <!-- 触控区域 -->
>         <Border Grid.Row="1" Margin="0,12,0,0" Background="#161B22"
>                 BorderBrush="#21262D" BorderThickness="1" CornerRadius="6" ClipToBounds="True">
>             <Grid>
>                 <!-- 可拖动的设备图标方块：IsManipulationEnabled 是触控手势的前提 -->
>                 <Border x:Name="DeviceBlock" Width="110" Height="70"
>                         Background="#1F3A5F" BorderBrush="#58A6FF" BorderThickness="1"
>                         CornerRadius="8" HorizontalAlignment="Left" VerticalAlignment="Top"
>                         RenderTransformOrigin="0.5,0.5"
>                         IsManipulationEnabled="True"
>                         ManipulationStarting="OnManipStarting"
>                         ManipulationDelta="OnManipDelta"
>                         ManipulationCompleted="OnManipCompleted">
>                     <Border.RenderTransform>
>                         <!-- 用变换记录位置：Canvas.Left/Top 只在 Canvas 里有效 -->
>                         <TranslateTransform x:Name="BlockMove"/>
>                     </Border.RenderTransform>
>                     <StackPanel HorizontalAlignment="Center" VerticalAlignment="Center">
>                         <TextBlock Text="1# 泵" Foreground="White" FontSize="16"
>                                    FontWeight="Bold" HorizontalAlignment="Center"/>
>                         <TextBlock Text="拖动我" Foreground="#8B949E" FontSize="11"
>                                    HorizontalAlignment="Center"/>
>                     </StackPanel>
>                 </Border>
>             </Grid>
>         </Border>
>         <TextBlock x:Name="StatusText" Grid.Row="2" Foreground="#8B949E" Margin="0,10,0,0"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Input;
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
>         // 手势开始：把当前位移量作为累加的起始基准，避免跳变
>         private void OnManipStarting(object sender, ManipulationStartingEventArgs e)
>         {
>             e.ManipulationContainer = this;
>             e.Handled = true;
>         }
>
>         // 手势进行中：把累计位移写入 TranslateTransform，实现跟随手指移动
>         private void OnManipDelta(object sender, ManipulationDeltaEventArgs e)
>         {
>             BlockMove.X += e.DeltaManipulation.Translation.X;
>             BlockMove.Y += e.DeltaManipulation.Translation.Y;
>
>             // 边界约束：把方块限制在触控区域内
>             double maxX = ((FrameworkElement)((Border)sender).Parent).ActualWidth - ((Border)sender).ActualWidth;
>             double maxY = ((FrameworkElement)((Border)sender).Parent).ActualHeight - ((Border)sender).ActualHeight;
>             BlockMove.X = System.Math.Max(0, System.Math.Min(BlockMove.X, maxX));
>             BlockMove.Y = System.Math.Max(0, System.Math.Min(BlockMove.Y, maxY));
>
>             StatusText.Text = $"位置：({BlockMove.X:F0}, {BlockMove.Y:F0})";
>             e.Handled = true;
>         }
>
>         // 手势结束
>         private void OnManipCompleted(object sender, ManipulationCompletedEventArgs e)
>         {
>             StatusText.Text = $"拖移结束，落点：({BlockMove.X:F0}, {BlockMove.Y:F0})";
>             e.Handled = true;
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"Manipulation 事件"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Manipulation 事件"
> - → 后续必学：掌握"Manipulation 事件"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
