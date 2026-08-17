---
title: WPF 图形渲染概述
section: 06-graphics
parent: 6.1 图形渲染概述
---

# WPF 图形渲染概述

> [!plain] 白话理解
> 想象厂房中控室的大屏：要同时显示设备状态、实时曲线和告警灯。传统 GDI 画图像是"手绘"——数据一变，得用橡皮擦掉旧的再一笔笔重画；而 WPF 是"建模型"——你把画面上要有什么"声明"出来（一个圆、一条线、一个按钮），渲染系统记住了整棵场景树。数据一变，它自己算出哪里变了、只重绘受影响的部分，这就是**保留模式渲染**。你永远不用操心"哪里脏了、要不要重画"，只管改数据。
>
> 类比：纸质海报 vs 全息投影。海报改一行字要重新打印整张；全息投影只是底层模型的某个参数变了，画面自动更新。

> [!def] 官方定义
> WPF 使用**保留模式渲染（Retained Mode Rendering）**：应用程序不把像素直接画到屏幕（那是立即模式），而是维护一棵由 `Visual` 对象组成的场景树，由渲染引擎（`System.Windows.Media` 命名空间，底层为 Media Integration Layer）负责合成到屏幕。任何依赖属性变化都会使对应视觉节点失效并自动重绘。
>
> 关键 API 归属：`System.Windows.Media.Visual`（视觉基类）、`System.Windows.UIElement`（布局与输入）、`System.Windows.Media.DrawingVisual`（自绘）、`System.Windows.Media.RenderOptions`（渲染选项）。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/graphics-multimedia/ （WPF 图形与多媒体总览）

> [!origin] 由来背景
> WPF（开发代号 Avalon）2006 年随 .NET Framework 3.0 发布，是微软为 Windows 客户端制定的统一 UI 框架。当时的 WinForms 基于 GDI+ 立即模式渲染，界面代码与绘制过程耦合，数据一变就得手动 `Invalidate` 重绘，复杂动态界面难以维护。微软在设计 WPF 时引入"保留模式 + 矢量图形 + GPU 硬件加速"的组合，把"如何画"完全交给引擎，开发者只负责描述"画什么"——这也是后来现代前端框架普遍采用的思路。

> [!essentials] 核心要点
> - **矢量图形**：Shape/Path 基于几何描述，缩放拉伸不失真，天然适配高分屏与缩放布局
> - **保留模式**：改依赖属性即自动失效并重绘，无需手动 Invalidate/Repaint
> - **硬件加速**：命中 GPU 合成路径时性能好，被强制为软件渲染时性能骤降
> - **布局与渲染分离**：改大小触发 Measure/Arrange（布局），改颜色只触发 Render（绘制），开销不同
> - **命中测试**：`VisualTreeHelper.HitTest` 可按几何精确判断鼠标落在哪个图形上

> [!example] 完整示例
> **上位机设备看板演示：用 Shape 矢量图形组合搭建看板，点击按钮动态刷新颜色与尺寸，体现 WPF 保留模式渲染（改属性即自动重绘）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="图形渲染概述 - 设备看板" Height="400" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备看板（矢量图形）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 矢量图形组合：矩形机柜 + 椭圆指示灯 + 直线分隔 + Path 状态箭头 -->
>         <Canvas Grid.Row="1" Background="#161B22" ClipToBounds="True" Margin="0,10,0,0">
>             <Rectangle x:Name="Cabinet" Width="160" Height="120" Canvas.Left="30" Canvas.Top="30"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2" RadiusX="6" RadiusY="6"/>
>             <Ellipse x:Name="Lamp" Width="28" Height="28" Canvas.Left="150" Canvas.Top="60" Fill="#DA3633"/>
>             <Line X1="30" Y1="190" X2="190" Y2="190" Stroke="#58A6FF" StrokeThickness="2"/>
>             <Path Data="M 210,60 L 250,60 L 250,45 L 280,70 L 250,95 L 250,80 L 210,80 Z" Fill="#238636"/>
>             <TextBlock Canvas.Left="210" Canvas.Top="30" Text="运行" Foreground="#8B949E"/>
>         </Canvas>
>         <Button Grid.Row="2" Content="切换运行状态" Click="OnSwitch" Margin="0,12,0,0"
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
>         // 保留模式渲染：无需手动重绘，直接修改依赖属性即可自动刷新画面
>         private void OnSwitch(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             if (_running)
>             {
>                 Lamp.Fill = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36)); // 运行绿灯
>                 Cabinet.Fill = new SolidColorBrush(Color.FromRgb(0x21, 0x26, 0x2D));
>             }
>             else
>             {
>                 Lamp.Fill = new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33)); // 停止红灯
>                 Cabinet.Fill = new SolidColorBrush(Color.FromRgb(0x2D, 0x33, 0x3A));
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备看板/仪表盘：图形数量适中（几百个以内），需要随时改颜色、大小、位置
> ✅ 界面缩放与高 DPI 屏幕：矢量图形缩放依然清晰
> ✅ 配合 Storyboard 做状态灯闪烁、进度条等动态效果
> ❌ 高频大数据量绘制：每秒刷新上万点的曲线时，改用 writeablebitmap-可写入位图 逐像素绘制更合适
> ❌ 逐像素图像处理（如机器视觉 ROI 分析）：交给 WriteableBitmap 或独立图像管线

> [!pitfall] 常见踩坑
> 坑 1：**在 UI 线程循环里密集改渲染属性导致卡顿** → 现象：拖动窗口时图形拖影、点击无响应 → 原因：每次属性变化都触发重新合成 → 解决：批量更新完再让引擎合成，或用动画/WriteableBitmap，低频刷新用 DispatcherTimer
> 
> 坑 2：**期待矢量图放大到任意倍数都清晰** → 现象：图标放大后边缘出现锯齿 → 原因：只有纯几何无限清晰，文本与位图内容仍按像素渲染 → 解决：理解矢量边界，配合 `SnapsToDevicePixels`/`UseLayoutRounding` 处理像素对齐
>
> 坑 3：**在后台线程修改 UI 元素的渲染属性** → 现象：抛 `InvalidOperationException`"调用线程无法访问此对象" → 原因：DependencyObject 有线程亲和性，渲染属性只能在 UI 线程改 → 解决：用 Dispatcher 封送到 UI 线程

> [!best] 最佳实践
> - 能写进 XAML 的用 XAML 声明，后台代码只做数据驱动的动态修改，界面与逻辑分层
> - 动画优先用 Storyboard 而非手动循环改属性，交给引擎的时钟与合成器处理
> - 一次性修改多个属性时先全部改完，避免中间态闪烁
> - 做命中测试时先换算到目标元素局部坐标系，避免坐标错位
> - 大屏/多屏项目在 `Window_Loaded` 后做一次渲染冒烟测试，确认硬件加速生效

> [!practice] 上手练习
> **Lv.1 运行体验**：运行本节示例，点击"切换运行状态"，观察指示灯颜色与机柜背景变化——体会"改属性即重绘"
> **Lv.2 动手改造**：在 Canvas 里再加一个 Ellipse 作为第二台设备灯，让它显示相反状态，体会多图形同步刷新
> **Lv.3 综合实战**：用 DispatcherTimer 每 500ms 自动翻转运行状态，模拟 PLC 周期刷新，并把按钮改为"暂停/继续"
> **Lv.4 挑战进阶**：把图形数量增加到 500 个并定时随机变色，实测帧率，再对比 writeablebitmap-可写入位图 的同量级刷新性能

> [!related] 相关知识链接
> - ← 前置知识：第 1 章「wpf-的工作原理」「通过-xaml-添加控件」讲清了 WPF 架构与 XAML 声明方式
> - → 后续必学：从 line-直线 开始逐个掌握 Shape 图形；想画任意图形学 path-路径
> - ⇄ 关联概念：writeablebitmap-可写入位图（大数据量绘制的另一条路）；第 7 章「什么是数据绑定」让图形属性由数据驱动
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/graphics-multimedia/
