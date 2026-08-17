---
title: Polygon 多边形
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Polygon 多边形

> [!plain] 白话理解
> Polygon 是"把首尾相接的一串点围成一个封闭区域"。你给它一串顶点坐标，它自动把最后一个点和第一个点连起来，并填充整个区域。上位机里它最擅长画"不规则区域"：厂区地图上的危险区、仓库堆垛区、机械臂工作范围、防撞区。相比 Rectangle/Ellipse 只有固定形状，Polygon 想画几边形就画几边形。
>
> 类比：在地上钉一圈桩子，再用绳子把相邻桩子连起来、最后把首尾也连上——圈出来的那块地就是 Polygon。

> [!def] 官方定义
> `System.Windows.Shapes.Polygon` 是 Shape 派生控件，用 `Points`（`PointCollection`）按顺序定义顶点，渲染时自动闭合首尾顶点并填充 `Fill` 区域。`FillRule` 决定自相交区域如何判定填充（`EvenOdd` 奇偶规则 / `Nonzero` 非零环绕规则）。`Stroke` 沿多边轮廓描边。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.polygon

> [!origin] 由来背景
> 多边形是矢量图形的基本图元。在 GDI 时代画多边形要手动管理点数组并调用 `FillPolygon`，且每次重绘都要重画一遍；WPF 把 Polygon 做成持久化对象，`Points` 是依赖属性，数据一变自动重绘。`FillRule` 让自相交多边形（五角星、镂空图形）也能正确填充，省去人工拆分的麻烦——这在绘制危险区域、安全围栏等复杂轮廓时非常有用。

> [!essentials] 核心要点
> - **Points 顶点序列**：格式 "x,y x,y …"，顶点按顺序连线，最后自动闭合
> - **自动闭合**：无需自己补最后一个顶点，Polygon 保证区域封闭
> - **FillRule**：`EvenOdd` 适合自相交图形，`Nonzero` 适合复杂路径填充，理解后才不会出现"填错区域"
> - **与 Polyline 区别**：Polyline 不闭合不填充，Polygon 闭合且填充
> - **命中测试**：鼠标点击可通过 `Fill` 区域精确判断（即使 Fill 半透明），常用于圈选/点击区域

> [!example] 完整示例
> **危险区域标识演示：用 Polygon 的 Points 定义菱形/三角形警示区，点击按钮切换报警状态（闭合区域自动填充）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="危险区域 - Polygon" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="厂区危险区域监控" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- Points 按顺序定义顶点，多边形自动闭合填充 -->
>         <Canvas Grid.Row="1" Background="#161B22" Margin="0,10,0,0">
>             <!-- 菱形警戒区：4 个顶点 -->
>             <Polygon x:Name="DangerZone" Points="100,40 180,120 100,200 20,120"
>                      Fill="#8B949E" Stroke="#DA3633" StrokeThickness="3"/>
>             <!-- 三角形设备标记 -->
>             <Polygon Points="300,150 360,80 420,150"
>                      Fill="#21262D" Stroke="#58A6FF" StrokeThickness="2"/>
>             <TextBlock Canvas.Left="70" Canvas.Top="210" Text="A 区（报警）" Foreground="#8B949E"/>
>             <TextBlock Canvas.Left="290" Canvas.Top="160" Text="B 区（正常）" Foreground="#8B949E"/>
>         </Canvas>
>         <Button Grid.Row="2" Content="模拟报警" Click="OnAlarm" Margin="0,12,0,0"
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
>         private bool _alarm;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 切换报警状态：报警时填充红色半透明，正常时恢复灰色
>         private void OnAlarm(object sender, RoutedEventArgs e)
>         {
>             _alarm = !_alarm;
>             DangerZone.Fill = _alarm
>                 ? new SolidColorBrush(Color.FromArgb(0x66, 0xDA, 0x36, 0x33)) // 半透明红
>                 : new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             DangerZone.StrokeThickness = _alarm ? 5 : 3;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 厂区/车间地图：圈出危险区、防撞区、仓库堆垛等任意形状区域
> ✅ 三角形/箭头指示：设备状态指示、流动方向、工位指向
> ✅ 机械臂/机器人工作范围示意：按关节角度动态计算顶点位置
> ✅ 自相交图形：五角星、镂空标志（配合 FillRule）
> ❌ 只需要一条开口线（不填充）：用 polyline-折线
> ❌ 标准圆形/矩形：ellipse-椭圆 / rectangle-矩形 更简单高效

> [!pitfall] 常见踩坑
> 坑 1：**顶点顺序搞反导致形状"翻转"或交叉** → 现象：多边形看起来像打结的线条 → 原因：顶点按逆时针/顺时针的顺序不一致，或坐标算错 → 解决：先在纸上画草图标注顶点序号，再按顺序写入 Points
> 
> 坑 2：**自相交区域填充诡异** → 现象：五角星中间出现空洞或填充成奇怪形状 → 原因：默认 `FillRule` 不适合该图形 → 解决：根据图形选择 `EvenOdd` 或 `Nonzero`，两个都试一下看效果
>
> 坑 3：**把 Polygon 当 Polyline 用** → 现象：只想画折线却莫名多了一条闭合边 → 原因：Polygon 会自动闭合首尾 → 解决：不闭合就改用 polyline-折线

> [!best] 最佳实践
> - 动态多边形（如机械臂工作范围）把顶点计算封装成方法，输入参数输出 `PointCollection`，便于复用
> - 区域填充用半透明画刷（如 `Color.FromArgb(0x66,...)`），既能看清区域又不会遮挡底图
> - 安全/告警区域统一用红系描边 + 红色半透明填充，与正常区域视觉区分
> - 大量顶点时一次构建完整 Points 再赋值，避免循环内逐个 Add 触发多次重绘
> - 与 `Path` 相比，多边形顶点规则变化少时用 Polygon 更直观；顶点路径复杂（弧线边）用 path-路径

> [!practice] 上手练习
> **Lv.1 运行体验**：运行危险区域示例，点"模拟报警"，观察菱形区域变半透明红并加粗边框
> **Lv.2 动手改造**：把 B 区三角形改成五边形（自己算 5 个顶点坐标），并把填充改为半透明蓝色
> **Lv.3 综合实战**：给 Polygon 加 `MouseDown` 事件，点击 A 区弹出"A 区已报警"提示（注意 Canvas 坐标换算）
> **Lv.4 挑战进阶**：做一个"机械臂工作范围"示例——用一个 Polygon 表示机械臂可达范围，按钮让范围随臂长参数缩放/变形

> [!related] 相关知识链接
> - ← 前置知识：line-直线 掌握坐标体系；wpf-图形渲染概述 理解填充机制
> - → 后续必学：path-路径 画带弧线的复杂区域；所有-shape-共享属性 统一样式
> - ⇄ 关联概念：polyline-折线（不闭合版本）；solidcolorbrush-纯色画刷 控制填充色；第 7 章「什么是数据绑定」驱动顶点
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.polygon
