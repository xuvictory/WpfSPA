---
title: 所有 Shape 共享属性
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# 所有 Shape 共享属性

> [!plain] 白话理解
> Line、Rectangle、Ellipse、Polygon、Path……它们看起来各干各的，其实同属 `Shape` 家族，共享一套"外貌属性"：`Fill` 管里面、`Stroke` 管轮廓、`StrokeThickness` 管轮廓粗细、`Stretch` 管怎么占空间、`Opacity` 管透明度。学会了这套公共属性，任何一个新 Shape 都能立刻上手——这就是"一套配置，全部图形通用"。
>
> 类比：不同型号的设备外壳各不相同，但都有相同的"涂装规范"——颜色、边框、透明度，涂装规则只学一次。

> [!def] 官方定义
> `System.Windows.Shapes.Shape` 是所有几何图形的抽象基类（`Line`、`Rectangle`、`Ellipse`、`Polygon`、`Polyline`、`Path` 均派生自它）。共享属性包括：`Fill`（填充画刷，`Brush`）、`Stroke`（描边画刷）、`StrokeThickness`（描边宽度）、`StrokeDashArray`（虚线样式）、`StrokeLineCap`（端点形状）、`Stretch`（`Stretch` 枚举：None/Uniform/UniformToFill/Fill）、`Opacity`（透明度 0-1）等。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.shape

> [!origin] 由来背景
> 面向对象设计让 WPF 把图形的"公共外观能力"抽取到 `Shape` 基类：所有具体图形只提供"如何描述形状"（端点、顶点、几何），而填充、描边、拉伸、透明度等通用渲染能力由基类统一实现。这样开发者在 XAML 中面对任何 Shape 都有一致的属性心智模型，也便于用 Style 一次统一样式——工控项目里几十种状态图形共用一套配色正是靠这个继承体系。

> [!essentials] 核心要点
> - **Fill 与 Stroke**：Fill 是内填充、Stroke 是轮廓，可分别设颜色/画刷（含渐变、图像）
> - **Stroke 家族**：`StrokeThickness` 粗细、`StrokeDashArray` 虚线（"4,2"=画4空2）、`StrokeLineCap` 端点
> - **Stretch 四态**：`None` 原尺寸 / `Fill` 拉伸变形 / `Uniform` 等比留白 / `UniformToFill` 等比裁剪
> - **Opacity 与渲染**：透明度影响合成开销，频繁改透明动画比改颜色更耗性能
> - **Freezable 优化**：Brush/Pen 可 `Freeze()` 冻结，多图形共享同一画刷时显著降低内存

> [!example] 完整示例
> **监控面板综合演示：集中展示 Shape 共享属性——Fill 填充、Stroke 描边、StrokeThickness 线宽、Stretch 拉伸、Opacity 透明度、RenderTransform 变换：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="监控面板 - Shape 共享属性" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="共享属性一览" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <StackPanel Grid.Row="1" Margin="0,10,0,0">
>             <!-- Fill + Stroke + StrokeThickness + 虚线 StrokeDashArray -->
>             <Rectangle Width="420" Height="36" Fill="#21262D" Stroke="#58A6FF"
>                        StrokeThickness="2" StrokeDashArray="4,2" RadiusX="4" RadiusY="4"/>
>             <!-- Opacity 半透明叠加 -->
>             <Ellipse Width="120" Height="60" Fill="#238636" Opacity="0.6" Margin="10,10,0,0"
>                      HorizontalAlignment="Left"/>
>             <!-- Stretch 拉伸变形 -->
>             <Path Data="M 0,0 L 30,0 L 15,26 Z" Fill="#DA3633" Stretch="Fill"
>                   Width="160" Height="44" Margin="10,10,0,0" HorizontalAlignment="Left"/>
>             <!-- RenderTransform 旋转 + 缩放 -->
>             <Line X1="0" Y1="0" X2="120" Y2="0" Stroke="#8B949E" StrokeThickness="4"
>                   Margin="10,20,0,0" HorizontalAlignment="Left">
>                 <Line.RenderTransform>
>                     <TransformGroup>
>                         <RotateTransform Angle="-15"/>
>                         <ScaleTransform ScaleX="0.9" ScaleY="0.9"/>
>                     </TransformGroup>
>                 </Line.RenderTransform>
>             </Line>
>         </StackPanel>
>         <TextBlock Grid.Row="2" Foreground="#8B949E" Margin="0,12,0,0"
>                    Text="提示：Fill 决定内部填充，Stroke 决定轮廓，StrokeThickness 控制轮廓粗细"/>
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
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 统一图标风格：给所有状态图形套用同一套 Fill/Stroke/StrokeThickness 规范
> ✅ 面板/卡片视觉层次：用 Stroke 描边 + 不同透明度区分"激活/禁用/告警"
> ✅ 虚线标识：`StrokeDashArray` 画巡检路线、规划路径、待建区域
> ✅ 半透明覆盖层：`Opacity` 让告警区域叠加在底图上不遮挡
> ✅ 响应式缩放：`Stretch` 让图形随容器自动适配
> ❌ 需要精确到像素的 1px 线：注意 `StrokeThickness` 居中描边会把 1px 分成两半
> ❌ 需要文字内容：Shape 不能放子元素，用 Border/TextBlock

> [!pitfall] 常见踩坑
> 坑 1：**1px 线条看起来发虚** → 现象：StrokeThickness=1 的线模糊/被截断一半 → 原因：描边居中，像素落在半像素位置 → 解决：在 Canvas 中用 `SnapsToDevicePixels` 或让坐标落在 0.5 像素，或 `RenderOptions.EdgeMode` 处理
> 
> 坑 2：**StrokeDashArray 数字理解错误** → 现象：虚线画出来不是想要的样子 → 原因：`"4,2"` 是"画4空2"，单位是 StrokeThickness 的倍数而非像素 → 解决：先理解比例关系，实际间距 = 值 × StrokeThickness
>
> 坑 3：**Stretch 与 Width/Height 冲突导致图形变形** → 现象：设置了 Width/Height 却仍被拉伸 → 原因：`Stretch="Fill"` 会忽略宽高比铺满容器 → 解决：固定尺寸用 `Stretch="None"`，等比缩放用 `Uniform`

> [!best] 最佳实践
> - 把 Shape 公共属性集中成 Style（`<Style TargetType="Shape">`），所有图形统一外观，改动一处全站生效
> - 状态颜色用资源（Brush 资源）统一管理，不要散落在各 XAML 里写死色值
> - 固定不变的画刷用 `Freeze()` 冻结（`brush.Freeze()`），提升渲染与内存性能
> - 用 `Opacity` 而非改 Alpha 通道做整体淡入淡出，语义更清晰
> - 高 DPI 屏幕优先用矢量 + 逻辑像素，避免像素级硬编码

> [!practice] 上手练习
> **Lv.1 运行体验**：运行监控面板示例，逐个修改 Fill/Stroke/StrokeThickness/Opacity 观察每个图形变化
> **Lv.2 动手改造**：把虚线矩形的 StrokeDashArray 改成 "8,4"，体会虚线比例，再试试给线条加 StrokeLineCap
> **Lv.3 综合实战**：把示例中所有图形的 Fill/Stroke 抽成 Style 资源，让改动一个资源就改变全部图形
> **Lv.4 挑战进阶**：做一个"状态图例"——5 种状态（运行/停止/告警/检修/离线）各用一个 Shape 示例，用 Style + Brush 资源统一管理配色

> [!related] 相关知识链接
> - ← 前置知识：line-直线、rectangle-矩形、ellipse-椭圆、polygon-多边形、path-路径 各图形的基础
> - → 后续必学：solidcolorbrush-纯色画刷 深入 Fill 的画刷体系；rotatetransform-旋转 等变换
> - ⇄ 关联概念：第 5 章「什么是样式」「资源定义与引用」把共享属性提升为资源；第 7 章「什么是数据绑定」数据驱动外观
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.shape
