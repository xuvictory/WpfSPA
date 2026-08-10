---
title: Viewbox 缩放容器
section: 03-layout
parent: 3.8 辅助容器
---

# Viewbox 缩放容器

> [!plain] 白话理解
> 你在一个固定 1920×1080 的设计稿上画好了上位机界面——设备图标、数字、曲线图，位置都完美。但实际部署的电脑可能是 1366×768 的工控机触摸屏，也可能是 4K 分辨率的监控大屏。如果把所有内容包进一个 **Viewbox**，它就会像一个"**智能缩放镜头**"——自动把内容等比缩放，填满你给它的空间，所有元素的位置和比例关系完美保留。

> [!def] 官方定义
> Viewbox 是 WPF 中的一个装饰器控件，继承自 Decorator，用于对单个子元素进行等比缩放以适应可用空间。它提供 `Stretch` 属性（继承自 Viewbox 基类）来控制缩放模式——`Uniform`（等比缩放、保持宽高比，默认）、`UniformToFill`（等比缩放、填满、可能裁切）、`Fill`（非等比拉伸）、`None`（不缩放）；以及 `StretchDirection` 属性控制缩放方向——`UpOnly`（只放大）、`DownOnly`（只缩小）、`Both`（双向，默认）。

> [!origin] 由来背景
> 在 WinForms 时代，做多分辨率适配是上位机开发中最痛苦的事情之一。每个控件的 `Anchor` 和 `Dock` 只能做简单的边距适配，但字体大小、控件间距、图标比例依然需要手动计算和调整。WPF 的 Viewbox 从根本上解决了这个问题：你把整个界面（或一部分）画在一个固定逻辑尺寸的区域内，然后让 Viewbox 自动缩放。这是在 WPF 流式布局（Grid/StackPanel）之外的一种"缩放式适配"方案，特别适合工艺流程图、仪表盘这类需要精确保持比例的场景。

> [!essentials] 核心要点
- **只能包含一个子元素**：和 Border、ScrollViewer 一样；需要多元素时用 Panel 包一层
- **四种缩放模式**：`Uniform`（等比缩放保留宽高比）、`UniformToFill`（等比缩放填满、可能裁切）、`Fill`（拉伸填满、可能变形）、`None`（不缩放）
- **StretchDirection 控制缩放方向**：`Both`（默认双向）、`UpOnly`（内容小于 Viewbox 时放大，大于时不缩小）、`DownOnly`（内容大于时缩小，小于时不放大）
- **缩放是整体操作**：所有子元素（包括字体、图标、间距）都会等比缩放
- **性能**：缩放本身不创建新位图，而是通过 `ScaleTransform` 实现的矢量缩放——所以矢量图形（TextBlock、Shape）缩放后依然清晰
- **与 Canvas 搭配**：Viewbox + Canvas 是实现工艺流程图的"固定设计尺寸 + 自适应显示"的经典组合

> [!example] 完整示例
>
> 下面是一个上位机中的**仪表盘总览页面**：用 Viewbox 包裹一个固定尺寸的 Canvas，实现任何屏幕上的等比缩放。
>
> **MainWindow.xaml** — Viewbox 缩放仪表盘
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="产线仪表盘总览" Height="550" Width="900"
>         WindowStartupLocation="CenterScreen"
>         WindowState="Maximized">
>     
>     <!-- 全窗口使用 Viewbox，让内容自适应窗口大小 -->
>     <Viewbox Stretch="Uniform" StretchDirection="Both">
>         <!-- 
>             设计基准画布：800×450
>             所有位置和大小都基于这个基准设计，
>             Viewbox 会自动等比缩放到实际窗口尺寸
>         -->
>         <Canvas Width="800" Height="450" Background="#0D1117">
>             
>             <!-- 标题 -->
>             <Border Canvas.Left="20" Canvas.Top="15"
>                     Width="760" Height="40"
>                     Background="#161B22" CornerRadius="4"
>                     BorderBrush="#FF6B35" BorderThickness="1">
>                 <StackPanel Orientation="Horizontal"
>                             HorizontalAlignment="Center"
>                             VerticalAlignment="Center">
>                     <TextBlock Text="产线仪表盘总览"
>                                Foreground="#FF6B35" FontSize="18"
>                                FontWeight="Bold"/>
>                     <TextBlock Text=" | 1号线 | 运行中"
>                                Foreground="#3FB950" FontSize="13"
>                                Margin="15,0,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片1：温度 (左上) -->
>             <Border Canvas.Left="20" Canvas.Top="70"
>                     Width="240" Height="170"
>                     Background="#161B22" CornerRadius="6"
>                     BorderBrush="#2A4A6C" BorderThickness="1"
>                     Padding="15">
>                 <StackPanel>
>                     <TextBlock Text="🌡 温度监控"
>                                Foreground="#FF6B35" FontSize="15"
>                                FontWeight="Bold"/>
>                     <TextBlock Text="45.2 °C"
>                                Foreground="#3FB950" FontSize="48"
>                                FontWeight="Bold"
>                                HorizontalAlignment="Center"
>                                Margin="0,20,0,0"/>
>                     <TextBlock Text="设定范围: 20 ~ 60 °C"
>                                Foreground="#999" FontSize="11"
>                                HorizontalAlignment="Center"
>                                Margin="0,8,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片2：压力 (中上) -->
>             <Border Canvas.Left="280" Canvas.Top="70"
>                     Width="240" Height="170"
>                     Background="#161B22" CornerRadius="6"
>                     BorderBrush="#CC2222" BorderThickness="1.5"
>                     Padding="15">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#CC2222"
>                                  VerticalAlignment="Center"/>
>                         <TextBlock Text=" 压力异常"
>                                    Foreground="#CC2222" FontSize="15"
>                                    FontWeight="Bold"
>                                    VerticalAlignment="Center"
>                                    Margin="5,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Text="3.8 MPa"
>                                Foreground="#CC2222" FontSize="48"
>                                FontWeight="Bold"
>                                HorizontalAlignment="Center"
>                                Margin="0,20,0,0"/>
>                     <TextBlock Text="上限: 2.5 MPa  ⚠ 超限"
>                                Foreground="#CC2222" FontSize="11"
>                                HorizontalAlignment="Center"
>                                Margin="0,8,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片3：产量 (右上) -->
>             <Border Canvas.Left="540" Canvas.Top="70"
>                     Width="240" Height="170"
>                     Background="#161B22" CornerRadius="6"
>                     BorderBrush="#2A4A6C" BorderThickness="1"
>                     Padding="15">
>                 <StackPanel>
>                     <TextBlock Text="📦 当日产量"
>                                Foreground="#FF6B35" FontSize="15"
>                                FontWeight="Bold"/>
>                     <TextBlock Text="12,847"
>                                Foreground="White" FontSize="48"
>                                FontWeight="Bold"
>                                HorizontalAlignment="Center"
>                                Margin="0,20,0,0"/>
>                     <StackPanel Orientation="Horizontal"
>                                 HorizontalAlignment="Center"
>                                 Margin="0,8,0,0">
>                         <TextBlock Text="目标: 15,000"
>                                    Foreground="#999" FontSize="11"/>
>                         <TextBlock Text=" | 达成率: 85.6%"
>                                    Foreground="#FF6B35" FontSize="11"
>                                    Margin="5,0,0,0"/>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 底部大卡片：趋势图区域 -->
>             <Border Canvas.Left="20" Canvas.Top="255"
>                     Width="760" Height="175"
>                     Background="#161B22" CornerRadius="6"
>                     BorderBrush="#2A4A6C" BorderThickness="1"
>                     Padding="15">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Grid.Row="0"
>                                Text="📈 24小时温度趋势"
>                                Foreground="#FF6B35" FontSize="14"
>                                FontWeight="Bold"
>                                Margin="0,0,0,10"/>
>                     <!-- 趋势图占位（实际项目用图表控件） -->
>                     <Border Grid.Row="1" Background="#0D1117"
>                             CornerRadius="4" Padding="10">
>                         <StackPanel VerticalAlignment="Center"
>                                     HorizontalAlignment="Center">
>                             <TextBlock Text="[ 趋势图表区域 ]"
>                                        Foreground="#555" FontSize="16"/>
>                             <TextBlock Text="实际项目中使用 LiveChart / OxyPlot / SciChart"
>                                        Foreground="#444" FontSize="11"
>                                        HorizontalAlignment="Center"
>                                        Margin="0,5,0,0"/>
>                         </StackPanel>
>                     </Border>
>                 </Grid>
>             </Border>
>         </Canvas>
>     </Viewbox>
> </Window>
> ```

> **MainWindow.xaml.cs**
> ```csharp
> using System.Windows;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>     }
> }
> ```
>
> 这个示例演示了 Viewbox 的核心设计理念：
> 1. **固定设计基准**：Canvas 设为 800×450，所有元素基于这个尺寸绝对定位
> 2. **Viewbox 自动适配**：窗口最大化时，内容等比缩放；窗口缩小时，内容等比缩小
> 3. **搭配 DockPanel 不行**：这里用 Canvas 而非 DockPanel 是因为 Viewbox 要做整体等比缩放——如果用 DockPanel 内部自适应布局，缩放后比例会乱
>
> [!scene] 适用场景
> - ✅ 仪表盘总览页面——固定设计尺寸，适配各种屏幕分辨率
> - ✅ 工艺流程图（P&ID）——需要整体缩放查看，保持拓扑关系不变
> - ✅ 大屏展示页面（LED 看板、Andon 系统）——内容固定但屏幕尺寸多变
> - ✅ 图像/图标预览——需要缩略图或放大查看的 SVG/矢量图
> - ✅ 打印预览——在预览窗口中按比例显示打印内容
> - ❌ 文本密集型界面（大量 TextBox、TextBlock）——缩放后字体大小变化可能导致阅读不适
> - ❌ 需要独立滚动的内容——Viewbox 会把内容整体缩放到可见区域内，不会出滚动条
> - ❌ 需要鼠标精确交互的界面——缩放后点击位置需要换算

> [!pitfall] 常见踩坑
> - **坑1：Viewbox + Canvas 后文本缩放变形**。Viewbox 等比缩放会使字体跟着缩放，如果窗口比例和设计基准不一致，可能出现文字过小或过大。解决方案：要么确保设计基准比例与实际屏幕一致（16:9），要么在 Viewbox 中使用 `Stretch="Uniform"` 保持比例。
> - **坑2：Viewbox 内控件的鼠标坐标需要换算**。Viewbox 缩放后，`MouseEventArgs.GetPosition()` 返回的是缩放后的坐标，不是设计基准坐标。解决方案：用 `Viewbox` 的 `ContainerFromElement` 做逆变换，或直接在设计基准 Canvas 上获取坐标（Canvas 的 `ActualWidth/Height` 不变）。
> - **坑3：`Stretch="Fill"` 导致比例失真**。为填满空间而拉伸导致圆形变椭圆。解决方案：除非确定宽高比一致，否则坚持用 `Stretch="Uniform"`。

> [!best] 最佳实践
> - 设计时先确定基准分辨率（如 1920×1080 或 1280×720），所有布局和字体都按这个基准设计
> - 基准分辨率应选择目标设备中最常见的比例（上位机通常是 16:9）
> - Viewbox 适合"固定排版"的展示类内容，不适合"内容驱动"的编辑类界面
> - 可以在 Viewbox 外层嵌套 Grid，在 Viewbox 之外放固定尺寸的元素（如标题栏、菜单栏），实现"部分缩放+部分固定"
> - `StretchDirection="DownOnly"` 适合只在大屏上缩小的场景——在小屏上按原尺寸显示（滚动了事），在大屏上缩小适配

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：将上面的仪表盘示例改为 6 个卡片（2 行 × 3 列），新增"湿度 67%"、"流量 2.3 L/min"、"振动 1.2 mm/s"三张卡片
> - **Lv.2 小试牛刀**：实现"Viewbox + ScrollViewer"组合——当 `Stretch="None"` 时，内容超出窗口则出现滚动条；当 `Stretch="Uniform"` 时，滚动条消失、内容缩放
> - **Lv.3 融会贯通**：做一个"缩放级别选择器"——在下拉列表中选择 25% / 50% / 75% / 100% / 125% / 150%，动态修改 Viewbox 内部 Canvas 的大小，并用 `Slider` 实现连续缩放

> [!related] 相关知识链接
> - ← 前置：ScrollViewer 滚动容器
> - → 后续：布局容器选择指南
> - ⇄ 关联：Viewbox + Canvas — 固定设计尺寸 + 自适应显示的黄金组合
> - ⇄ 关联：RenderTransform.ScaleTransform — 如果不需要 Viewbox 的自动布局，可以用 ScaleTransform 手动缩放
> - 📖 官方文档：[Viewbox Class (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.viewbox)
