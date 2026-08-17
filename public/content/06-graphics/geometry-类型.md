---
title: Geometry 类型
section: 06-graphics
parent: 6.3 Path 与 Geometry
---

# Geometry 类型

> [!plain] 白话理解
> "Geometry 类型"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"Geometry 类型"是一个重要的知识点。上位机的仪表盘、实时曲线、设备图——这些视觉元素都离不开图形编程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> Geometry 类型是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> Geometry 类型的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：上位机的仪表盘、实时曲线、设备图——这些视觉元素都离不开图形编程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"Geometry 类型"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **液位罐体图演示：用 GeometryGroup 组合矩形罐体与椭圆液面，CombinedGeometry 取交集/并集造型，体现 Geometry 的复用与组合：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="罐体液位 - Geometry" Height="440" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="储罐液位监控（Geometry 组合）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Canvas Grid.Row="1" Background="#161B22" Margin="0,10,0,0">
>             <!-- GeometryGroup：矩形 + 两侧半圆组成罐体轮廓 -->
>             <Path Canvas.Left="40" Canvas.Top="40" Stroke="#58A6FF" StrokeThickness="3" Fill="Transparent">
>                 <Path.Data>
>                     <GeometryGroup>
>                         <RectangleGeometry Rect="60,40 220,200" RadiusX="8" RadiusY="8"/>
>                         <EllipseGeometry Center="80,140" RadiusX="20" RadiusY="100"/>
>                         <EllipseGeometry Center="260,140" RadiusX="20" RadiusY="100"/>
>                     </GeometryGroup>
>                 </Path.Data>
>             </Path>
>             <!-- 液面：EllipseGeometry + RectangleGeometry 并集 -->
>             <Path x:Name="Liquid" Canvas.Left="40" Canvas.Top="40" Fill="#238636" Opacity="0.7">
>                 <Path.Data>
>                     <GeometryGroup>
>                         <RectangleGeometry Rect="64,140 192,96" RadiusX="6" RadiusY="6"/>
>                         <EllipseGeometry Center="80,140" RadiusX="16" RadiusY="90"/>
>                         <EllipseGeometry Center="256,140" RadiusX="16" RadiusY="90"/>
>                     </GeometryGroup>
>                 </Path.Data>
>             </Path>
>             <TextBlock Canvas.Left="140" Canvas.Top="250" Text="液位 55%" Foreground="#8B949E"/>
>         </Canvas>
>         <Slider x:Name="LevelSlider" Grid.Row="2" Minimum="0" Maximum="100" Value="55"
>                 Margin="0,12,0,0" ValueChanged="OnLevelChanged"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
> using System.Windows.Shapes;
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
>         // 拖动滑块改变液面高度（GeometryGroup 内矩形高度随之变化）
>         private void OnLevelChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             double level = LevelSlider.Value;
>             var rect = new RectangleGeometry(new Rect(64, 236 - level * 1.7, 192, level * 1.7))
>             {
>                 RadiusX = 6,
>                 RadiusY = 6
>             };
>             var group = new GeometryGroup();
>             group.Children.Add(rect);
>             group.Children.Add(new EllipseGeometry(new Point(80, 236 - level * 1.7), 16, 16));
>             group.Children.Add(new EllipseGeometry(new Point(256, 236 - level * 1.7), 16, 16));
>             Liquid.Data = group;
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"Geometry 类型"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Geometry 类型"
> - → 后续必学：掌握"Geometry 类型"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
