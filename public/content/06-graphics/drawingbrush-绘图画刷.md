---
title: DrawingBrush 绘图画刷
section: 06-graphics
parent: 6.4 Brush 画刷
---

# DrawingBrush 绘图画刷

> [!plain] 白话理解
> "DrawingBrush 绘图画刷"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"DrawingBrush 绘图画刷"是一个重要的知识点。上位机的仪表盘、实时曲线、设备图——这些视觉元素都离不开图形编程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> DrawingBrush 绘图画刷是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> DrawingBrush 绘图画刷的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：上位机的仪表盘、实时曲线、设备图——这些视觉元素都离不开图形编程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"DrawingBrush 绘图画刷"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **水印纹路演示：用 DrawingBrush 以 GeometryDrawing 绘制网格/斜纹作为背景纹路，TileMode 平铺铺满区域，Viewport 控制单元大小：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="背景纹路 - DrawingBrush" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="操作台背景纹路（DrawingBrush）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- DrawingBrush 使用矢量图元做平铺纹路 -->
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" BorderBrush="#30363D" BorderThickness="1">
>             <Border.Background>
>                 <DrawingBrush Viewport="0,0,30,30" ViewportUnits="Absolute" TileMode="Tile">
>                     <DrawingBrush.Drawing>
>                         <GeometryDrawing>
>                             <GeometryDrawing.Geometry>
>                                 <GeometryGroup>
>                                     <!-- 对角斜纹 -->
>                                     <LineGeometry StartPoint="0,30" EndPoint="30,0"/>
>                                     <!-- 边框方块 -->
>                                     <RectangleGeometry Rect="0,0,30,30"/>
>                                 </GeometryGroup>
>                             </GeometryDrawing.Geometry>
>                             <GeometryDrawing.Pen>
>                                 <Pen Brush="#2D333A" Thickness="1"/>
>                             </GeometryDrawing.Pen>
>                         </GeometryDrawing>
>                     </DrawingBrush.Drawing>
>                 </DrawingBrush>
>             </Border.Background>
>             <TextBlock Text="设备参数面板" Foreground="#8B949E" FontSize="24"
>                        HorizontalAlignment="Center" VerticalAlignment="Center"/>
>         </Border>
>         <Button Grid.Row="2" Content="切换纹路" Click="OnSwitch" Margin="0,12,0,0"
>                 Padding="8" Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
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
>         private bool _dot;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 在斜纹与圆点纹路之间切换（动态构造 DrawingBrush）
>         private void OnSwitch(object sender, RoutedEventArgs e)
>         {
>             _dot = !_dot;
>             var brush = new DrawingBrush
>             {
>                 Viewport = new Rect(0, 0, 30, 30),
>                 ViewportUnits = BrushMappingMode.Absolute,
>                 TileMode = TileMode.Tile
>             };
>             if (_dot)
>             {
>                 brush.Drawing = new GeometryDrawing
>                 {
>                     Geometry = new EllipseGeometry(new Point(15, 15), 4, 4),
>                     Pen = new Pen(new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF)), 1)
>                 };
>             }
>             else
>             {
>                 brush.Drawing = new GeometryDrawing
>                 {
>                     Geometry = new LineGeometry(new Point(0, 30), new Point(30, 0)),
>                     Pen = new Pen(new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E)), 1)
>                 };
>             }
>             (sender as System.Windows.Controls.Button).Tag = brush;
>             // 重新赋值背景触发重绘
>             (Parent as Grid).Background = brush;
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"DrawingBrush 绘图画刷"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"DrawingBrush 绘图画刷"
> - → 后续必学：掌握"DrawingBrush 绘图画刷"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
