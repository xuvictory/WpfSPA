---
title: LinearGradientBrush 线性渐变
section: 06-graphics
parent: 6.4 Brush 画刷
---

# LinearGradientBrush 线性渐变

> [!plain] 白话理解
> LinearGradientBrush 是"让颜色沿着一条线逐渐变化"的画刷：从起点色一路过渡到终点色。上位机里它最常见的效果是——料位条从底部深蓝渐变成顶部亮蓝，比纯色更有"立体感"和"液位感"。你只需要告诉它三个信息：渐变方向（StartPoint/EndPoint）、中间经过哪些颜色（GradientStop）、每种颜色停在什么位置（Offset）。
>
> 类比：喷漆枪从下往上喷，一开始喷深色、越往上喷越浅——喷完就是一排平滑过渡的渐变。

> [!def] 官方定义
> `System.Windows.Media.LinearGradientBrush` 用 `StartPoint`/`EndPoint`（相对坐标，`Point` 0-1）定义渐变方向，`GradientStops`（`GradientStopCollection`）定义颜色断点，每段断点含 `Color` 与 `Offset`（0-1 位置比例）。`MappingMode="Absolute"` 可改为绝对坐标。渐变会跟随图形尺寸自动拉伸。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.lineargradientbrush

> [!origin] 由来背景
> 纯色画刷难以表现"深度、光感、方向感"，WPF 从第一版就提供线性渐变画刷。它的设计要点是"相对坐标"：StartPoint/EndPoint 用 0-1 归一化坐标，图形任意缩放渐变方向不变，这与现代 UI 的渐变设计一致。配合 `GradientStop` 集合，可以做出 2-8 段的多色渐变，成为玻璃质感按钮、液位条、进度条的标配技法。

> [!essentials] 核心要点
> - **方向控制**：`StartPoint="0,1"` `EndPoint="0,0"` 表示从下往上渐变；对角线需 `0,0`→`1,1`
> - **GradientStop 序列**：多个 Stop 按 Offset 递增排列，决定颜色过渡节奏
> - **Offset 归一化**：默认 0-1 相对图形尺寸，图形变化时渐变自动适配
> - **MappingMode**：默认 `RelativeToBoundingBox`；`Absolute` 用像素坐标，图形缩放不影响
> - **动画渐变**：改 GradientStop.Color 可实现颜色流动/闪烁效果（配合 Storyboard）

> [!example] 完整示例
> **料位渐变条演示：用 LinearGradientBrush 定义 StartPoint/EndPoint 方向与 GradientStop 渐变色阶，点击按钮切换液位高低：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="料位条 - LinearGradientBrush" Height="400" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="原料仓料位" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- StartPoint 决定渐变起点，EndPoint 决定方向；Stop 定义颜色断点 -->
>         <StackPanel Grid.Row="1" Orientation="Horizontal" VerticalAlignment="Center">
>             <Border Width="36" Height="240" CornerRadius="4" BorderBrush="#30363D" BorderThickness="1"
>                     Background="#161B22" VerticalAlignment="Center">
>                 <Border x:Name="LevelFill" Height="0" Width="36" VerticalAlignment="Bottom"
>                         CornerRadius="4">
>                     <Border.Background>
>                         <LinearGradientBrush StartPoint="0,1" EndPoint="0,0">
>                             <GradientStop Color="#0D419D" Offset="0"/>
>                             <GradientStop Color="#58A6FF" Offset="1"/>
>                         </LinearGradientBrush>
>                     </Border.Background>
>                 </Border>
>             </Border>
>             <StackPanel Margin="18,0,0,0" VerticalAlignment="Center">
>                 <TextBlock x:Name="LevelText" Text="0 %" Foreground="#8B949E" FontSize="26"/>
>                 <TextBlock Text="当前料位" Foreground="#8B949E" Margin="0,8,0,0"/>
>             </StackPanel>
>         </StackPanel>
>         <Button Grid.Row="2" Content="补料 / 放料" Click="OnToggle" Margin="0,12,0,0"
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
>         private double _level = 20;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             UpdateLevel();
>         }
>
>         private void OnToggle(object sender, RoutedEventArgs e)
>         {
>             _level = _level > 60 ? 20 : 80;   // 在低料位与高料位之间切换
>             UpdateLevel();
>         }
>
>         private void UpdateLevel()
>         {
>             LevelFill.Height = 240 * _level / 100.0;
>             LevelText.Text = $"{_level:F0} %";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 液位/料位条：底部深色 → 顶部亮色的纵向渐变，模拟液体体积感
> ✅ 进度条/温度条：从低温色渐变到高温色（蓝→黄→红）表达量程
> ✅ 按钮质感：玻璃按钮用上亮下暗的渐变模拟立体按钮
> ✅ 背景氛围：窗口/面板用横向渐变做层次，避免大面积纯色呆板
> ✅ 告警渐变条：`LinearGradientBrush` + 颜色动画实现闪烁流动告警
> ❌ 需要中心向外扩散的效果：用 radialgradientbrush-径向渐变
> ❌ 需要图案纹理：用 imagebrush-图像画刷

> [!pitfall] 常见踩坑
> 坑 1：**渐变方向搞反** → 现象：料位条想要"上亮下暗"却相反 → 原因：StartPoint/EndPoint 的方向与直觉相反（`0,1`→`0,0` 是从下往上） → 解决：明确"StartPoint 是渐变起点"，先用两个对比明显的颜色试方向
> 
> 坑 2：**Offset 顺序混乱导致颜色跳变** → 现象：渐变色阶排列异常、出现硬边 → 原因：GradientStop 的 Offset 没有按递增排列，或重复相同 Offset → 解决：Offset 从 0 到 1 单调递增；想硬切就设相邻相同 Offset
>
> 坑 3：**渐变不随图形尺寸变化** → 现象：窗口放大后渐变"停住"不拉伸 → 原因：把 `MappingMode` 设成了 `Absolute` 或忘记默认相对模式 → 解决：默认 `RelativeToBoundingBox`；确需绝对像素坐标才用 Absolute

> [!best] 最佳实践
> - 用 `StartPoint="0,1" EndPoint="0,0"` 做纵向液位条的标准套路，配合 VerticalAlignment 控制填充方向
> - 渐变资源化：液位/进度条渐变定义为 Brush 资源，多处进度条复用同一质感
> - 做"三段渐变色带"（如蓝→黄→红）时先画好色标再填 Offset，0 和 1 的端点色别忘
> - 渐变是 Freezable，静态渐变 `Freeze()` 提升性能
> - 配合动画时只改 GradientStop.Color（颜色插值），避免整体重建画刷

> [!practice] 上手练习
> **Lv.1 运行体验**：运行料位条示例，点"补料/放料"，观察渐变填充高度变化
> **Lv.2 动手改造**：把渐变改成三段（深蓝→天蓝→白），并把 StartPoint/EndPoint 改成水平方向观察效果
> **Lv.3 综合实战**：做一个"温度表"——进度条颜色随数值从蓝渐变到红（用代码动态改 GradientStops）
> **Lv.4 挑战进阶**：用 Storyboard 对渐变最亮 Stop 的 Color 做来回动画，实现"液位闪烁"告警效果

> [!related] 相关知识链接
> - ← 前置知识：solidcolorbrush-纯色画刷 理解 Brush 体系；ellipse-椭圆 等图形是承载者
> - → 后续必学：radialgradientbrush-径向渐变 做球面光效；上位机画刷应用 综合练习
> - ⇄ 关联概念：第 7 章「什么是数据绑定」把数值绑定到渐变；storyboard-故事板 做颜色动画
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.lineargradientbrush
