---
title: ScaleTransform 缩放
section: 06-graphics
parent: 6.5 Transform 变换
---

# ScaleTransform 缩放

> [!plain] 白话理解
> ScaleTransform 是"把元素按比例放大或缩小"。上位机画面整体缩放、指示灯"呼吸"（变大变小）、图表局部放大都靠它。它只改显示尺寸不改布局，所以缩放瞬间完成、不重排界面。两个关键：`ScaleX`/`ScaleY`（横竖缩放比）和缩放中心（`RenderTransformOrigin`）——缩放中心决定"往哪个方向长"。
>
> 类比：投影仪焦距。拧大焦距画面变大，但投影幕布不动——内容变大了，位置关系也按比例拉开。

> [!def] 官方定义
> `System.Windows.Media.ScaleTransform` 是 `Transform` 派生类，`ScaleX`/`ScaleY`（`double`，倍数，1=原始、0.5=一半、2=两倍）定义横/纵向缩放比例，`CenterX`/`CenterY` 定义缩放中心（默认 `0,0`）。`ScaleX == ScaleY` 是等比缩放；不等则是拉伸变形。配合 `RenderTransformOrigin="0.5,0.5"` 可实现围绕元素中心的缩放。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.scaletransform

> [!origin] 由来背景
> WPF 的核心特性之一就是"矢量+变换"的渲染管线：任何 `UIElement` 都能被变换矩阵作用，缩放是最常用的仿射变换。把缩放实现为 RenderTransform 意味着**只重绘、不重新布局**，因此大画面整体缩放可以实时响应（鼠标滚轮放大缩小设备图）。这与 WinForms 时代"改尺寸就要重排控件"形成鲜明对比，是工业画面缩放浏览的关键能力。

> [!essentials] 核心要点
> - **ScaleX/ScaleY**：等比缩放设相同值；`ScaleX=2` 时宽翻倍，`ScaleY=0.5` 时高减半
> - **缩放中心**：`RenderTransformOrigin="0.5,0.5"` 为中心缩放（缩放画面最常用）；默认绕左上角
> - **负值镜像**：`ScaleX=-1` 可做水平镜像（配合 visualbrush-可视画刷 做倒影）
> - **范围限制**：示例用 `Math.Min/Max` 限制 0.5~3 倍，防止画面缩没或过大
> - **布局不变**：缩放只影响渲染，不影响父容器布局计算（LayoutTransform 才影响布局）

> [!example] 完整示例
> **画面缩放演示：用 ScaleTransform 的 ScaleX/ScaleY 控制缩放比例、ScaleCenterX/ScaleCenterY 控制缩放中心，实现画面整体放大缩小：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="画面缩放 - ScaleTransform" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备画面缩放" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 缩放中心取面板中心，保证缩放时居中 -->
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <Canvas x:Name="Canvas" RenderTransformOrigin="0.5,0.5" ClipToBounds="True">
>                 <Canvas.RenderTransform>
>                     <ScaleTransform x:Name="CanvasScale" ScaleX="1" ScaleY="1"/>
>                 </Canvas.RenderTransform>
>                 <!-- 被缩放内容 -->
>                 <Rectangle Width="180" Height="120" Canvas.Left="40" Canvas.Top="40" Fill="#21262D"
>                            Stroke="#8B949E" StrokeThickness="2" RadiusX="6" RadiusY="6"/>
>                 <Ellipse Width="40" Height="40" Canvas.Left="110" Canvas.Top="80" Fill="#DA3633"/>
>                 <Line X1="40" Y1="200" X2="220" Y2="200" Stroke="#58A6FF" StrokeThickness="3"/>
>             </Canvas>
>         </Border>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="放大" Click="OnZoomIn" Padding="10" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="缩小" Click="OnZoomOut" Padding="10" Background="#DA3633"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="复位" Click="OnReset" Padding="10" Background="#21262D"
>                     Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
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
>         private void OnZoomIn(object sender, RoutedEventArgs e)
>         {
>             CanvasScale.ScaleX = CanvasScale.ScaleY = System.Math.Min(3, CanvasScale.ScaleX + 0.2);
>         }
>
>         private void OnZoomOut(object sender, RoutedEventArgs e)
>         {
>             CanvasScale.ScaleX = CanvasScale.ScaleY = System.Math.Max(0.5, CanvasScale.ScaleX - 0.2);
>         }
>
>         private void OnReset(object sender, RoutedEventArgs e)
>         {
>             CanvasScale.ScaleX = CanvasScale.ScaleY = 1;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备画面整体缩放：滚轮/按钮放大缩小工艺画面浏览细节
> ✅ 指示灯"呼吸"：ScaleTransform + 动画让状态灯呼吸闪烁
> ✅ 图表自适应：曲线图随容器缩放（等比或拉伸）
> ✅ 镜像/倒影：`ScaleY=-1` 做翻转，配合 visualbrush-可视画刷
> ✅ 画面适配多分辨率屏：缩放让固定画布适配不同分辨率
> ❌ 布局需要跟着变大（控件重排）：用 LayoutTransform 或改尺寸
> ❌ 逐像素级缩放精度：注意像素对齐问题（缩放后线条可能虚）

> [!pitfall] 常见踩坑
> 坑 1：**缩放中心在左上角，放大后内容"跑"掉** → 现象：放大后想看的内容跑到画面外 → 原因：默认绕 `0,0`（左上角）缩放 → 解决：设 `RenderTransformOrigin="0.5,0.5"` 让画面以中心为轴缩放，或按鼠标位置计算缩放中心
> 
> 坑 2：**ScaleX 和 ScaleY 不同导致画面变形** → 现象：正方形变长方形、圆变椭圆 → 原因：只改了 ScaleX 或两边不等 → 解决：等比缩放用 `ScaleX = ScaleY = 统一值`；确需拉伸才分开设
>
> 坑 3：**缩放到极限后无法复原或越界** → 现象：缩小到看不见、放大到飞出窗口 → 原因：没有上下限约束 → 解决：用 `Math.Min(3, ...)`/`Math.Max(0.5, ...)` 限制范围，并保留"复位"按钮（Scale=1）

> [!best] 最佳实践
> - 缩放对象用 `ClipToBounds="True"` 的 Border 包住，越界内容不外溢
> - 缩放范围建议 0.5~3.0 之间，视觉合理且性能可控
> - 滚轮缩放时结合鼠标位置计算 Center，体验更自然（进阶再实现）
> - "呼吸灯"用 Storyboard 对 ScaleX/ScaleY 做来回动画，比 Timer 更平滑
> - 缩放后的线条出现锯齿时考虑 `UseLayoutRounding`/`SnapsToDevicePixels`（矢量图形一般无此问题）

> [!practice] 上手练习
> **Lv.1 运行体验**：运行画面缩放示例，点"放大/缩小/复位"，观察 Canvas 内容整体缩放且居中
> **Lv.2 动手改造**：把 Canvas 里的红色圆改成绿灯（绿色 Ellipse），并把放大步长从 0.2 改成 0.3
> **Lv.3 综合实战**：给"放大"按钮换成滚轮缩放——在 Canvas 上挂 `MouseWheel` 事件，滚轮上下调节 ScaleX/Y
> **Lv.4 挑战进阶**：实现"以鼠标位置为中心缩放"——先取鼠标在 Canvas 内的相对坐标，缩放时同步调整 RenderTransformOrigin

> [!related] 相关知识链接
> - ← 前置知识：rotatetransform-旋转 认识 RenderTransform 体系；所有-shape-共享属性 的 Stretch
> - → 后续必学：translatetransform-平移 配合做画面漫游；transformgroup-变换组合 叠加缩放与位移
> - ⇄ 关联概念：visualbrush-可视画刷（镜像倒影用 ScaleY=-1）；storyboard-故事板（呼吸动画）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.scaletransform
