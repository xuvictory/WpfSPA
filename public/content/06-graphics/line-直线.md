---
title: Line 直线
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Line 直线

> [!plain] 白话理解
> Line 是 WPF 里最"朴素"的图形：只有两个端点，把 (X1,Y1) 和 (X2,Y2) 连成一条线段。就像在坐标纸上用直尺连接两个点——它不关心两点之间有什么，只负责画直线本身。上位机里的温度曲线、液位趋势、坐标网格，本质都是"把相邻两个数据点用线段连起来"，一条条 Line 首尾相接就成了曲线。
>
> 类比：示波器屏幕上的波形不是一条完整的曲线，而是成千上万条极短的线段拼出来的，Line 就是那"一条线段"。

> [!def] 官方定义
> `System.Windows.Shapes.Line` 是 WPF 提供的一个 Shape 派生控件，用 `X1`、`Y1`、`X2`、`Y2`（`System.Double` 属性，单位 DIP）定义起点与终点，`Stroke` 定义线段颜色、`StrokeThickness` 定义线宽。它没有 `Fill` 概念（线条无填充区域），但支持 `StrokeDashArray`、`StrokeLineCap` 等画笔扩展。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.line

> [!origin] 由来背景
> Shape 系列控件是 WPF 从诞生起就内置的基础绘图元素。Line 作为其中最简单的一员，继承了 WPF 的矢量理念：坐标系使用逻辑像素（DIP），缩放时由渲染引擎重新光栅化，保证曲线在不同分辨率下都清晰。相比 GDI 的 `DrawLine` 一次性绘制，Line 是持久化对象——属性变化即自动重绘，这为"逐点追加的实时曲线"提供了天然基础：每来一个数据点，往 Canvas 里加一条新 Line 即可。

> [!essentials] 核心要点
> - **四个坐标属性**：`X1`/`Y1`（起点）、`X2`/`Y2`（终点），单位是相对父容器的逻辑像素
> - **Stroke 必填**：不设置 Stroke 时线条不可见（默认 null），这是新手最常见的"看不见线"原因
> - **StrokeThickness**：线宽，配合 `StrokeLineCap`（Round/Square）控制端点形状
> - **与 Border 的区别**：Border 是布局控件、负责描"容器边"，Line 是纯图形、不能放内容
> - **Canvas 定位**：常在 Canvas 中配合 `Canvas.Left`/`Canvas.Top` 使用，坐标直观

> [!example] 完整示例
> **温度实时趋势演示：用多条 Line 拼接折线，X1/Y1/X2/Y2 定义端点，点击按钮逐点追加采集数据：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="温度趋势 - Line" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="温度实时曲线（Line 拼接）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Canvas x:Name="PlotArea" Grid.Row="1" Background="#161B22" Margin="0,10,0,0">
>             <!-- 坐标轴基线 -->
>             <Line X1="0" Y1="180" X2="420" Y2="180" Stroke="#30363D" StrokeThickness="1"/>
>             <!-- 趋势线段容器：后续由代码追加 Line -->
>         </Canvas>
>         <Button Grid.Row="2" Content="采集数据" Click="OnSample" Margin="0,12,0,0"
>                 Padding="8" Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Shapes;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private int _count;                    // 已采集的点数
>         private double _lastY;                 // 上一帧数据的 Y 坐标
>         private readonly Random _rnd = new Random();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnSample(object sender, RoutedEventArgs e)
>         {
>             if (_count >= 20) return;                       // 画满 20 点后停止
>             double newY = 20 + _rnd.NextDouble() * 140;     // 随机温度值 20~160
>             double x = 20 * _count;                         // X 方向每个点间隔 20px
>             // 用一条新 Line 连接上一数据点与当前数据点
>             var seg = new Line
>             {
>                 X1 = _count == 0 ? 0 : 20 * (_count - 1),
>                 Y1 = _count == 0 ? newY : _lastY,
>                 X2 = x,
>                 Y2 = newY,
>                 Stroke = new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF)),
>                 StrokeThickness = 2,
>                 StrokeStartLineCap = PenLineCap.Round,      // 圆头端点更平滑
>                 StrokeEndLineCap = PenLineCap.Round
>             };
>             PlotArea.Children.Add(seg);
>             _lastY = newY;
>             _count++;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 实时曲线/趋势图：温度、压力、流量等过程量按时间逐点连线
> ✅ 坐标网格与参考线：用细 Line 画刻度线、基准线，配合 StrokeDashArray 画虚线告警阈值
> ✅ 简单的箭头/指引：Line + 端点 LineCap 或叠加 Polygon 拼箭头
> ❌ 需要大面积填充的区域：用 rectangle-矩形 或 polygon-多边形
> ❌ 曲线点数超过几千个：逐 Line 追加会产生大量 Visual，改用 polyline-折线 或 writeablebitmap-可写入位图

> [!pitfall] 常见踩坑
> 坑 1：**忘了设置 Stroke，线条不显示** → 现象：XAML 写了 Line 但运行时看不见 → 原因：`Stroke` 默认为 null，只有描边没有填充 → 解决：务必设置 `Stroke` 颜色，Debug 时先用显眼颜色定位
> 
> 坑 2：**坐标单位混淆** → 现象：线条出现在意料之外的位置或尺寸 → 原因：在 Canvas 里同时混用 `Canvas.Left` 与 Line 自身的 X1/Y1，坐标系理解错误 → 解决：明确 Line 的 X1/Y1 是"Canvas 内的绝对坐标"，而非相对自身
>
> 坑 3：**用 Line 逐条画大数据量曲线导致界面卡顿** → 现象：追加几百条后拖动窗口明显掉帧 → 原因：每个 Line 都是一个独立的 UIElement/Visual → 解决：点数多时改用 polyline-折线 一次性设置 Points，或 WriteableBitmap 直绘

> [!best] 最佳实践
> - 曲线数据用"差值 → 追加一条 Line"的写法时，把上一数据点存为字段（如 `_lastY`），不要每次遍历集合
> - 网格线与参考线固定不变，直接在 XAML 声明，避免运行时重复创建
> - 需要平滑曲线时用 `StrokeLineCap="Round"` 减少折点突兀感，或后续学 Path 的贝塞尔
> - 颜色用主题色统一管理（如示例的 `#58A6FF`），曲线颜色与告警阈值线用不同线型区分
> - 数据点坐标统一从"采集值 → 画布坐标"映射函数换算，一处修改全局生效

> [!practice] 上手练习
> **Lv.1 运行体验**：运行温度趋势示例，连点几次"采集数据"，观察逐段出现的折线
> **Lv.2 动手改造**：把曲线颜色改成红色，并给 X 方向间距从 20 改成 30，观察曲线疏密变化
> **Lv.3 综合实战**：给示例加上一条虚线告警线（StrokeDashArray="4 2"），当温度超过阈值时曲线变红
> **Lv.4 挑战进阶**：改用 DispatcherTimer 自动采集 50 个点，并思考如何"滚动窗口"——当点满后整体左移，而不是无限增加 Line 数量

> [!related] 相关知识链接
> - ← 前置知识：wpf-图形渲染概述 讲清保留模式；Canvas 布局见第 3 章「布局概述」
> - → 后续必学：polyline-折线 一次管理多个点；path-路径 绘制任意曲线；scale 缩放配合做曲线自适应
> - ⇄ 关联概念：所有-shape-共享属性（Stroke 线型的完整用法）；writeablebitmap-可写入位图（高频曲线绘制）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.line
