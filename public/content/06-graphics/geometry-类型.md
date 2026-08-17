---
title: Geometry 类型
section: 06-graphics
parent: 6.3 Path 与 Geometry
---

# Geometry 类型

> [!plain] 白话理解
> Geometry 是"形状的数据"本身，Path 只是"展示形状的画框"。前面学的罐体、液面、图标，本质都是几段几何数据：矩形、椭圆、组合、交集。Geometry 的好处是"数据与显示分离"——同一份几何既能填充、又能描边、还能做裁剪，甚至能计算面积。就像一张工程图纸，可以拿去印刷、投影、裁剪，图纸本身不变。
>
> 类比：Geometry 是"模具"，Path/Shape 是"成品"。一个模具能压出无数个成品，改模具数据，所有成品一起变。

> [!def] 官方定义
> `System.Windows.Media.Geometry` 是描述二维几何形状的抽象基类。常用派生类型：`RectangleGeometry`（矩形）、`EllipseGeometry`（椭圆）、`LineGeometry`（直线）、`PathGeometry`（任意路径）、`GeometryGroup`（多个几何组合，`FillRule` 控制填充规则）、`CombinedGeometry`（布尔运算：并集 Union/交集 Intersect/差集 Exclude/Xor）。Geometry 是 `Freezable`，可冻结后跨线程共享。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.geometry

> [!origin] 由来背景
> 传统 UI 把"形状"与"绘制方式"绑死在一起。WPF 引入"几何数据"这一抽象层：Geometry 只描述坐标空间中的形状，不关心用什么画笔、画在哪个控件里。这一设计继承自图形学的"数据-操作分离"思想，使同一几何可以同时用于 `Path.Data`、`DrawingBrush`、`Geometry.Clip`（裁剪）和命中测试，也便于用代码动态生成设备轮廓，成为 WPF 矢量图形体系的基石。

> [!essentials] 核心要点
> - **派生家族**：矩形/椭圆/直线用属性式几何（Rect/Center），复杂形状用 PathGeometry
> - **GeometryGroup**：多段几何合并为一个对象，共用 FillRule 控制自相交填充
> - **CombinedGeometry**：布尔运算造型（并/交/差/异或），可做"打孔""相交高亮"
> - **Freezable 冻结**：静态几何 `Freeze()` 后性能更好，且可在多个线程安全共享
> - **几何运算**：`GetArea()` 算面积、`FillContains(Point)` 命中测试、`Transform` 几何变换

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
> ✅ 罐体/设备剖面：GeometryGroup 组合矩形、椭圆拼出罐体、管道等不规则轮廓
> ✅ 组合造型：CombinedGeometry 求交集/并集做"打孔""相交高亮"等视觉效果
> ✅ 动态液位/料位：用代码改 RectangleGeometry 的 Rect 高度，比改 XAML 更灵活
> ✅ 命中测试与裁剪：`Geometry.Clip` 裁剪图片，`FillContains` 判断点是否在区域内
> ❌ 只需显示固定形状：直接用 rectangle-矩形 等 Shape 更直观
> ❌ 字符串画法更简洁的场景：固定图标优先用路径标记语法

> [!pitfall] 常见踩坑
> 坑 1：**GeometryGroup 填充出现镂空** → 现象：组合图形中间出现空洞 → 原因：默认 `FillRule`（EvenOdd）对重叠区域判定不一致 → 解决：按图形选择 `FillRule="Nonzero"`，或把重叠子几何拆开
> 
> 坑 2：**CombinedGeometry 运算结果"没变"** → 现象：Union/Intersect 后图形看不出变化 → 原因：两个几何位置没重叠，布尔运算自然无效果 → 解决：先确认坐标系与位置重叠，再用半透明 Fill 临时观察
>
> 坑 3：**几何频繁重建导致内存碎片** → 现象：动态液位拖动滑块时卡顿 → 原因：每帧 new 新的 Geometry，旧对象未释放 → 解决：复用对象、及时 `Freeze()`，或只改 RectangleGeometry 的参数而非整体重建

> [!best] 最佳实践
> - 静态几何定义后 `Freeze()`，冻结对象可跨线程共享且渲染更快
> - 把常用几何（罐体轮廓、设备图标）做成资源/静态字段，避免重复构建
> - 动态变化的几何只改参数（如 Rect），不要整对象替换
> - 用 `GetArea()` 等几何运算做辅助计算时注意单位是"逻辑平方像素"
> - 复杂造型先拆成简单子几何组合，逐步验证，不要一步到位写大 PathGeometry

> [!practice] 上手练习
> **Lv.1 运行体验**：运行液位罐示例，拖动滑块观察液面升降——注意 C# 中矩形 Rect 高度与 Y 坐标同步调整
> **Lv.2 动手改造**：把液面从"圆头罐形"改成简单矩形，观察填充差异，再给罐体加一个进水口小矩形
> **Lv.3 综合实战**：用 CombinedGeometry 把两个相交矩形做"并集"生成一个十字形区域，并验证填充正确
> **Lv.4 挑战进阶**：实现"料位百分比显示"——用 `GetArea()` 计算液面面积占总罐面积的比例并显示在界面上

> [!related] 相关知识链接
> - ← 前置知识：path-路径 认识 Data；路径标记语法 掌握 Data 字符串写法
> - → 后续必学：drawingbrush-绘图画刷 用 Geometry 平铺纹理；2d-绘图综合 综合运用
> - ⇄ 关联概念：wpf-图形渲染概述（保留模式）；第 7 章「什么是数据绑定」把滑块值绑定到几何参数
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.geometry
