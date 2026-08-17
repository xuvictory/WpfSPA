---
title: Polyline 折线
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Polyline 折线

> [!plain] 白话理解
> Polyline 可以看作"一捆 Line"：用一个 `Points` 集合一次管理几十上百个点，相邻点之间自动连线，但**不闭合、不填充**，只画线。上位机里它就是"整段波形"的容器——PLC 采完一批数据，把几千个采样点一次性塞进 Points，一条折线就把整段波形画出来了。
>
> 类比：Line 是一根面条，Polyline 是一整碗连着摆好的面条——夹起来是一根根，但数据是同一个盘子里的。

> [!def] 官方定义
> `System.Windows.Shapes.Polyline` 是 Shape 派生控件，用 `Points`（`PointCollection`）定义折线顶点，按顺序连接形成折线。与 Polygon 不同，Polyline 不闭合首尾、不填充内部；描边由 `Stroke` 控制。修改 `Points` 集合（依赖属性）会自动重绘整条线。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.polyline

> [!origin] 由来背景
> 在数据可视化需求驱动下，WPF 为"一次绘制大量点"的场景提供了 Polyline。用 Line 逐段画曲线时，N 个点需要 N-1 个独立 UIElement，性能差；Polyline 把整条折线折叠成**一个** Shape/Visual，N 个点只占一个对象，绘制与命中测试开销大幅降低。这是"采集一批 → 整体刷新"的波形图、趋势图的性能关键。

> [!essentials] 核心要点
> - **Points 一次性赋值**：批量采集完成后整批写入，比逐点 Add 更高效
> - **不闭合不填充**：Polyline 只画线，若要封闭区域用 polygon-多边形
> - **单 Visual 优势**：几千个点也只是一个 Shape，拖动缩放不会因对象数量爆卡
> - **刷新策略**：整帧替换 Points（`new PointCollection(...)`）而非逐点修改，减少失效次数
> - **与 Line 组合**：坐标轴、网格用几条 Line 固定声明，波形用 Polyline 动态替换，职责分明

> [!example] 完整示例
> **PLC 波形捕获演示：用 Polyline 一次性绘制整段采集波形，Points 存放全部采样点，点击按钮刷新新一批数据：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="PLC 波形 - Polyline" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="伺服位移波形（Polyline）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Canvas Grid.Row="1" Background="#161B22" Margin="0,10,0,0">
>             <!-- 坐标轴 -->
>             <Line X1="20" Y1="20" X2="20" Y2="240" Stroke="#30363D" StrokeThickness="1"/>
>             <Line X1="20" Y1="240" X2="440" Y2="240" Stroke="#30363D" StrokeThickness="1"/>
>             <!-- 波形折线：Points 由后台代码填充 -->
>             <Polyline x:Name="Wave" Stroke="#58A6FF" StrokeThickness="2"
>                       StrokeStartLineCap="PenLineCap.Round" StrokeEndLineCap="PenLineCap.Round"/>
>         </Canvas>
>         <Button Grid.Row="2" Content="重新采集" Click="OnCapture" Margin="0,12,0,0"
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
>         private readonly Random _rnd = new Random();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             OnCapture(this, new RoutedEventArgs());
>         }
>
>         // 模拟 PLC 一次采集 40 个采样点，全部写入 Points 属性
>         private void OnCapture(object sender, RoutedEventArgs e)
>         {
>             Wave.Points = new PointCollection();
>             for (int i = 0; i < 40; i++)
>             {
>                 double x = 20 + i * 10;                         // 每点间隔 10px
>                 double y = 40 + _rnd.NextDouble() * 180;        // 随机位移
>                 Wave.Points.Add(new Point(x, y));
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 波形/趋势整帧显示：PLC 或采集卡一次上传整批数据，Polyline 一次画完
> ✅ 走势历史回放：载入历史曲线文件后整帧渲染
> ✅ 折线统计图：柱状图旁的折线辅助线、趋势连线
> ✅ 任意开口路径：轨道、传送带走向示意
> ❌ 逐点实时追加（每秒只来几个点）：用 line-直线 逐条追加更灵活
> ❌ 需要填充区域：用 polygon-多边形

> [!pitfall] 常见踩坑
> 坑 1：**点数多时逐点 Add 导致闪烁/卡顿** → 现象：大量 Add 时波形"一跳一跳" → 原因：每次 Add 都触发 PointCollection 变化与重绘 → 解决：一次性 `Wave.Points = new PointCollection(points)` 整批替换
> 
> 坑 2：**忘记坐标换算，波形超出画布** → 现象：曲线跑到画布外或贴边 → 原因：原始数据范围没映射到画布像素范围 → 解决：先做 min/max 归一化再乘画布尺寸（`x = 左 + i*step`、`y = 顶部 + (1-归一化值)*高度`）
>
> 坑 3：**把 Polyline 当 Polygon 期待封闭填充** → 现象：曲线下方没有填充 → 原因：Polyline 不闭合不填充 → 解决：需要面积填充时用 Polygon（首尾补到 x 轴），或 path-路径 绘制闭合区域

> [!best] 最佳实践
> - 波形数据管理用 `List<Point>`，绘制时一次转成 `PointCollection`，采集与绘制解耦
> - 画布尺寸变化（窗口缩放）时重算坐标映射，把映射函数抽成 `Point ToCanvas(double v)` 
> - 波形线加 `StrokeLineCap="Round"` 减少端点突兀；多条曲线用不同颜色 + 图例
> - 固定坐标轴/网格用 Line 声明一次，波形用 Polyline 动态替换，避免重复创建静态元素
> - 几千点以上优先 Polyline；十万级再考虑 writeablebitmap-可写入位图 直绘

> [!practice] 上手练习
> **Lv.1 运行体验**：运行 PLC 波形示例，反复点"重新采集"，观察每次随机波形整体刷新
> **Lv.2 动手改造**：把采样点数从 40 改成 200（步长相应改小），观察线条更平滑还是更拥挤
> **Lv.3 综合实战**：把随机波形换成正弦波（`y = 中心 + 幅度*sin(i/周期)`），并给波形加一条虚线阈值
> **Lv.4 挑战进阶**：实现"滚动波形"——用 Polyline 显示最近 200 个点，新点到来时整体左移，模拟示波器效果

> [!related] 相关知识链接
> - ← 前置知识：line-直线 理解线段与坐标；wpf-图形渲染概述 理解批量重绘
> - → 后续必学：path-路径 用贝塞尔画平滑曲线；writeablebitmap-可写入位图 应对更高频数据
> - ⇄ 关联概念：polygon-多边形（闭合填充版）；所有-shape-共享属性（线型样式）；第 8 章线程「Dispatcher」驱动刷新
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.polyline
