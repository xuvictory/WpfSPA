---
title: DrawingBrush 绘图画刷
section: 06-graphics
parent: 6.4 Brush 画刷
---

# DrawingBrush 绘图画刷

> [!plain] 白话理解
> DrawingBrush 是"用矢量图形当涂料"：把线条、圆、矩形等绘图指令打包成一个 Drawing，像壁纸一样平铺或拉伸到任意区域。和 imagebrush-图像画刷 的区别是——它不是贴"位图照片"，而是贴"矢量画"，放大永远清晰、占内存极小。上位机里它最适合做**操作台背景纹路**：网格、斜纹、圆点、警示斜线，一个 30×30 的小单元平铺全屏。
>
> 类比：DrawingBrush 是"壁纸模板"，图样是一张矢量图纸，打印到墙上（图形区域）可以无限重复。

> [!def] 官方定义
> `System.Windows.Media.DrawingBrush` 继承自 `TileBrush`，`Drawing` 属性（`System.Windows.Media.Drawing`）指定绘图内容，具体有 `GeometryDrawing`（几何+画笔）、`ImageDrawing`（图片）、`GlyphRunDrawing`（文字）、`VideoDrawing`（视频）等类型。配合 `Viewport`/`ViewportUnits`/`TileMode` 控制平铺，`Stretch` 控制缩放。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.drawingbrush

> [!origin] 由来背景
> UI 背景纹路如果用位图会放大模糊、换主题要重新导图；用纯色又太单调。WPF 提供 DrawingBrush：把纹路单元写成矢量（GeometryDrawing），`TileMode="Tile"` 无缝平铺，放大不失真、可编程切换。这与 CSS 的"渐变+平铺"背景、矢量引擎的 pattern 填充同源，是"轻量级纹理"的正规解决方案，也是本系列"操作台背景纹路"示例的设计动机。

> [!essentials] 核心要点
> - **Drawing 类型**：GeometryDrawing（几何+Pen/Brush）最常用；ImageDrawing/GlyphRunDrawing 可混搭
> - **TileMode 平铺**：`Tile` 无缝平铺；`FlipXY` 等镜像平铺可省一半绘制
> - **Viewport 单元**：`Viewport="0,0,30,30"` + `ViewportUnits="Absolute"` 定义纹路单元尺寸
> - **矢量优势**：放大不失真、内存开销小，适合大面积背景
> - **动态切换**：代码里换 `Drawing` 即可整体换纹路（如斜纹↔圆点）

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
>         <Border x:Name="PatternHost" Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" BorderBrush="#30363D" BorderThickness="1">
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
>             // 重新赋值 Border 背景触发重绘
>             PatternHost.Background = brush;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 操作台/面板背景纹路：网格、斜纹、圆点、警示斜线平铺铺满
> ✅ 设备分区底纹：不同区域用不同纹路（如料区网格、危险区斜纹）
> ✅ 大面积纹理背景：不需要真实图片时的轻量矢量纹理
> ✅ 边框装饰：用 DrawingBrush 平铺做异形边框纹理
> ❌ 需要照片/实景：用 imagebrush-图像画刷 或 image-控件
> ❌ 需要带交互的重复元素：用 ItemsControl 数据绑定更合适

> [!pitfall] 常见踩坑
> 坑 1：**纹路没有平铺而是被拉伸成一张** → 现象：一个菱形纹路被拉成大格 → 原因：忘了设 `TileMode="Tile"` 或 Viewport 太大 → 解决：`TileMode="Tile"` + `Viewport="0,0,30,30"` + `ViewportUnits="Absolute"` 三件套缺一不可
> 
> 坑 2：**纹路单元错位/接缝不齐** → 现象：相邻单元的对角线对不齐 → 原因：几何坐标超出 Viewport 边界（如 0,30→30,0 写成了 0,32→32,0） → 解决：几何严格落在 Viewport 范围内，且首尾对称（如斜线起点(0,30)终点(30,0)）
>
> 坑 3：**动态切换纹路时新画刷不显示** → 现象：点了"切换纹路"没反应 → 原因：代码构造的 DrawingBrush 没赋给正确目标，或赋给了不可见容器 → 解决：确保目标元素有 x:Name 并直接赋 Background（如示例的 PatternHost）

> [!best] 最佳实践
> - 纹路单元尽量小（20-40px），几何坐标对称设计，保证无缝平铺
> - 纹路用半透明/低饱和颜色（如 #2D333A），作为背景不抢内容
> - 静态纹路在 XAML 声明；可切换纹路在代码动态构造，两者都符合"数据驱动"原则
> - 用 GeometryDrawing.Pen 统一描边粗细，多个子几何共享样式
> - 大面积使用注意性能：纹路越简单越好，复杂纹路用 Freeze 冻结画刷

> [!practice] 上手练习
> **Lv.1 运行体验**：运行背景纹路示例，点"切换纹路"，观察斜纹与圆点无缝平铺切换
> **Lv.2 动手改造**：把 XAML 里的纹路改成"井字格"（两条交叉竖线+横线），并调整 Viewport 为 40 观察疏密
> **Lv.3 综合实战**：在代码里新增第三种纹路"警示斜纹"（加粗对角斜线 + 红色），三态循环切换
> **Lv.4 挑战进阶**：做一个"分区面板"——上方操作区用斜纹、下方参数区用圆点，两个 Border 各自用不同 DrawingBrush

> [!related] 相关知识链接
> - ← 前置知识：geometry-类型（LineGeometry/RectangleGeometry 组成纹路单元）、imagebrush-图像画刷（平铺思路同源）
> - → 后续必学：visualbrush-可视画刷 对比"界面元素当画刷"；上位机画刷应用 综合运用
> - ⇄ 关联概念：所有-shape-共享属性（Pen/Brush 样式）；第 5 章「什么是样式」把纹路定义为资源
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.drawingbrush
