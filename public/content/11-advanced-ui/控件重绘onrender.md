---
title: 控件重绘（OnRender）
section: 11-advanced-ui
parent: 11.1 自定义控件深度开发
---

# 控件重绘（OnRender）

> [!plain] 白话理解
> "控件重绘（OnRender）"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"控件重绘（OnRender）"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 控件重绘（OnRender）是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 控件重绘（OnRender）的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"控件重绘（OnRender）"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **实时温度曲线演示：自定义 TrendChart 控件重写 OnRender，用 DrawingContext 绘制网格与折线，点击按钮追加数据点并调用 InvalidateVisual 触发重绘：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="控件重绘 - 实时温度曲线" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="采集温度曲线（OnRender + DrawingContext 自绘）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <!-- 自定义自绘控件：所有画面都由 OnRender 画出 -->
>         <local:TrendChart x:Name="Chart" Grid.Row="1" Margin="0,12,0,0"/>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="追加一个数据点" Click="OnAddPoint" Margin="0,0,10,0"
>                     Padding="10,6" Background="#21262D" Foreground="White"/>
>             <Button Content="清空曲线" Click="OnClear" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与自定义自绘控件：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 自绘控件：重写 OnRender，用 DrawingContext 一次性绘制网格和折线
>     public class TrendChart : FrameworkElement
>     {
>         private readonly List<double> _points = new List<double>();
>         private readonly Random _random = new Random();
>
>         // 追加数据并请求重绘（自绘惯用法：改数据 → InvalidateVisual）
>         public void AddPoint()
>         {
>             _points.Add(60 + _random.NextDouble() * 40); // 模拟 60~100℃ 温度
>             if (_points.Count > 60) _points.RemoveAt(0); // 滚动窗口，只保留最近 60 个点
>             InvalidateVisual();
>         }
>
>         public void Clear()
>         {
>             _points.Clear();
>             InvalidateVisual();
>         }
>
>         // 渲染入口：WPF 在需要重绘时自动调用，把全部画面画进 DrawingContext
>         protected override void OnRender(DrawingContext dc)
>         {
>             var bg = new SolidColorBrush(Color.FromRgb(0x16, 0x1B, 0x22));
>             var gridPen = new Pen(new SolidColorBrush(Color.FromRgb(0x21, 0x26, 0x2D)), 1);
>             var linePen = new Pen(new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF)), 2);
>
>             // 背景 + 水平网格线（每格 25% 高度）
>             dc.DrawRectangle(bg, null, new Rect(0, 0, ActualWidth, ActualHeight));
>             for (int i = 0; i <= 4; i++)
>             {
>                 double y = ActualHeight * i / 4;
>                 dc.DrawLine(gridPen, new Point(0, y), new Point(ActualWidth, y));
>             }
>
>             // 把温度值映射为坐标并连成折线
>             if (_points.Count > 1)
>             {
>                 double step = ActualWidth / Math.Max(_points.Count - 1, 1);
>                 for (int i = 1; i < _points.Count; i++)
>                 {
>                     var p1 = new Point(step * (i - 1), MapY(_points[i - 1]));
>                     var p2 = new Point(step * i, MapY(_points[i]));
>                     dc.DrawLine(linePen, p1, p2);
>                 }
>             }
>         }
>
>         // 温度 60~100℃ 线性映射到控件高度
>         private double MapY(double v) => ActualHeight - (v - 60) / 40 * ActualHeight;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 启动时预置几个数据点，让曲线一打开就有内容
>             for (int i = 0; i < 10; i++) Chart.AddPoint();
>         }
>
>         private void OnAddPoint(object sender, RoutedEventArgs e) => Chart.AddPoint();
>         private void OnClear(object sender, RoutedEventArgs e) => Chart.Clear();
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"控件重绘（OnRender）"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"控件重绘（OnRender）"
> - → 后续必学：掌握"控件重绘（OnRender）"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
