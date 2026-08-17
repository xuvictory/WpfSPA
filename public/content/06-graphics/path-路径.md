---
title: Path 路径
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Path 路径

> [!plain] 白话理解
> Path 是 WPF 图形里的"瑞士军刀"——所有画不出来的形状都能用它画：齿轮图标、箭头、弧线、水滴、设备剖面图。它靠一个 `Data` 字符串描述"笔走到哪、画直线还是弧线、贝塞尔拐弯、最后闭合"，配合 Stretch 缩放可以任意放大缩小不变形。学会了它，Shape 家族的"形状天花板"就被打破了。
>
> 类比：前面学的 Shape 是"模具"，形状固定；Path 是"笔"，笔尖轨迹由你写的一串指令决定。

> [!def] 官方定义
> `System.Windows.Shapes.Path` 是 Shape 派生控件，核心属性 `Data`（`System.Windows.Media.Geometry`）描述几何路径，支持 `GeometryGroup`、`EllipseGeometry`、`PathGeometry` 等组合；也可用**路径标记语法（Path Mini-Language）**——由 `M`（MoveTo 起点）、`L`（LineTo 直线）、`C`（CubicBezier 三次贝塞尔）、`A`（Arc 圆弧）、`Z`（闭合）等命令组成的紧凑字符串直接赋值 `Data`。`Stretch` 控制路径在可用区域内如何缩放。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.path

> [!origin] 由来背景
> 现代 UI 对图标、异形控件需求巨大，WPF 因此提供了通用的 Path。它的 `Data` 采用与 PostScript/SVG 同源的"路径指令"思想——M/L/C/A/Z 命令与 SVG 的 path 几乎一一对应，这让设计师的 SVG 图标能直接转成 WPF Data 字符串使用。微软也大量使用 Path 构建系统图标与控件模板（如按钮的 CheckMark），是"矢量图标"路线的基石。

> [!essentials] 核心要点
> - **Data 命令集**：`M` 起点、`L` 直线、`H`/`V` 水平/垂直线、`C` 贝塞尔、`A` 圆弧、`Z` 闭合
> - **大小写敏感**：大写表示绝对坐标，小写表示相对坐标，混用会让图形"飞走"
> - **Stretch 缩放**：`None` 原尺寸、`Uniform` 等比、`Fill` 拉伸，图标常用 Uniform
> - **组合几何**：多段路径用 `GeometryGroup` 合并成一个 Path，减少对象数
> - **SVG 转换**：SVG path 的 d 属性可直接套用为 Data，是图标素材快速导入的捷径

> [!example] 完整示例
> **设备状态图标演示：用 Path 的 Data 属性定义齿轮/箭头等矢量图标，Stretch 控制缩放适应，点击按钮切换图标状态：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="状态图标 - Path" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备状态图标（Path.Data）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- Data 使用路径微语言：M 起点、L 连线、Z 闭合、C 贝塞尔 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Path x:Name="GearIcon" Width="120" Height="120" Stretch="Uniform"
>                   Data="M 60,20 L 72,20 L 78,32 L 92,38 L 104,32 L 112,40 L 106,52 L 112,64 L 104,72 L 92,66 L 78,72 L 72,84 L 60,84 L 54,72 L 40,66 L 28,72 L 20,64 L 26,52 L 20,40 L 28,32 L 40,38 L 54,20 Z"
>                   Fill="#8B949E"/>
>             <TextBlock x:Name="StateText" Text="待机" Foreground="#8B949E" FontSize="18"
>                        HorizontalAlignment="Center" VerticalAlignment="Center"/>
>         </Grid>
>         <Button Grid.Row="2" Content="启动设备" Click="OnStart" Margin="0,12,0,0"
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
>         private bool _running;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             GearIcon.Fill = _running
>                 ? new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36)) // 运行绿色
>                 : new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             StateText.Text = _running ? "运行中" : "待机";
>             StateText.Foreground = _running ? Brushes.LimeGreen : Brushes.Gray;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 图标/标识：齿轮、箭头、电源、信号等矢量图标（可直接用 SVG 素材）
> ✅ 异形控件外观：把按钮模板改成任意形状（配合 ControlTemplate）
> ✅ 仪表盘弧线：用 `A`（Arc）命令画刻度弧、扇形缺口
> ✅ 设备剖面/管道走向：工厂管路图、液位罐剖面
> ✅ 平滑曲线：贝塞尔 `C` 命令画的曲线比折线更光滑
> ❌ 规则多边形：polygon-多边形 更简单
> ❌ 标准椭圆/矩形：ellipse-椭圆 / rectangle-矩形 语义更清晰

> [!pitfall] 常见踩坑
> 坑 1：**大小写命令混用导致图形错乱** → 现象：图形出现奇怪连线或飞离预期位置 → 原因：`M` 是绝对坐标、`m` 是相对坐标，大写小写混用坐标基准错乱 → 解决：同一段 Data 统一使用绝对（大写）或相对（小写）体系
> 
> 坑 2：**Data 写错语法不报错但显示空白** → 现象：Path 区域空白，看不出问题 → 原因：路径命令字符串非法会被忽略或产生空几何，不抛异常 → 解决：把 Data 拆小段逐步调试，或用 Blend/在线工具预览验证
>
> 坑 3：**SVG 图标导入后"消失"** → 现象：贴了 SVG 的 d 属性却看不到 → 原因：SVG 里可能有 `viewBox` 外坐标或不同命令版本，且未设置 Width/Height 时 Stretch 让路径缩没 → 解决：确认 d 用绝对坐标、给 Path 设 Width/Height + `Stretch="Uniform"`

> [!best] 最佳实践
> - 图标统一管理：把常用 Path 做成 `Data` 资源（`<PathGeometry x:Key="...">`），一处定义多处引用
> - 用 SVG 转 Data：网上 SVG path 的 d 属性可直接复制，但要注意补齐缺失的 M 起点
> - 复杂图形在 Expression Blend 或矢量编辑器中绘制导出，手写容易出错
> - 动画图标：对 Path 的 `RenderTransform` 做动画，比直接改 Data 性能好
> - 多个子路径用 `GeometryGroup` 合并为单个 Path，减少渲染对象数量

> [!practice] 上手练习
> **Lv.1 运行体验**：运行设备图标示例，点"启动设备"，观察齿轮图标变绿、文字切换
> **Lv.2 动手改造**：把齿轮 Data 换成自己手写的三角形（M/L/Z），体会绝对坐标绘图，再换成对勾（M 2,6 L 7,11 L 14,2）
> **Lv.3 综合实战**：用 `A` 弧线命令画一个 270° 的仪表盘弧形进度条（背景灰弧 + 前景蓝弧）
> **Lv.4 挑战进阶**：把按钮模板改成心形/星形 Path 外观，验证 Path 作为异形控件的能力

> [!related] 相关知识链接
> - ← 前置知识：polyline-折线 理解点序列；所有-shape-共享属性 掌握 Fill/Stroke
> - → 后续必学：geometry-类型 深入 Geometry 对象模型；路径标记语法 详解每种命令
> - ⇄ 关联概念：rotatetransform-旋转 让图标转动；第 11 章「控件模板-controltemplate」做异形按钮
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.path
