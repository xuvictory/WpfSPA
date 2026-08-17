---
title: RenderTransform vs LayoutTransform
section: 06-graphics
parent: 6.5 Transform 变换
---

# RenderTransform vs LayoutTransform

> [!plain] 白话理解
> 同一个旋转，放在 `RenderTransform` 和放在 `LayoutTransform` 上效果差别很大：RenderTransform 只改"画出来"的样子，布局占位不动（旁边的按钮不会被挤开）；LayoutTransform 会先变换再布局，占位跟着变（旁边的内容会被挤动）。记住一句话——**纯视觉动效用 RenderTransform，想让布局跟着变用 LayoutTransform**。
>
> 类比：RenderTransform 像"镜子里的倒影"（看着变了，实物没动）；LayoutTransform 像"真的把家具挪了位"（旁边的东西都要让位）。

> [!def] 官方定义
> `UIElement.RenderTransform`（`Transform`）在**渲染阶段**作用于元素，不参与布局测量（Measure/Arrange），因此不影响兄弟元素；`FrameworkElement.LayoutTransform` 在**布局阶段**生效，会改变元素的布局尺寸与占位，影响后续元素排版。RenderTransform 只触发 Render pass（性能好），LayoutTransform 会触发布局失效与重排（开销大）。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/graphics-multimedia/transforms-overview

> [!origin] 由来背景
> 这是 WPF 布局模型（Measure/Arrange/Render 三阶段）带来的必然设计：变换可以作用在"布局结果"上（Layout）或"绘制输出"上（Render）。动画需要高频更新，若走 Layout 会每帧重排整个界面导致卡顿；WPF 因此默认推荐 RenderTransform——它只改合成结果，性能好得多。理解这一区分是"为什么旋转不重排、缩放不挤占"的关键，也是性能优化的分水岭。

> [!essentials] 核心要点
> - **作用阶段不同**：RenderTransform 在渲染阶段、LayoutTransform 在布局阶段
> - **对兄弟影响**：Render 不影响占位；Layout 会挤开兄弟元素
> - **性能差异**：Render 只重绘不重排，高频动画必须用 Render；Layout 触发重排开销大
> - **命中测试**：RenderTransform 的旋转后鼠标命中仍按"变换后"的位置计算（命中有效）
> - **选择原则**：动画/视觉变换用 Render；需要参与布局的固定变换（如整体缩放适配）才用 Layout

> [!example] 完整示例
> **布局对比演示：同时放置 RenderTransform（渲染变换，不影响布局占位）与 LayoutTransform（布局变换，影响后续排版），观察按钮点击后的差异：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Render vs Layout" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="RenderTransform 与 LayoutTransform 对比" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Margin="0,10,0,0">
>             <Grid.RowDefinitions>
>                 <RowDefinition Height="*"/>
>                 <RowDefinition Height="*"/>
>             </Grid.RowDefinitions>
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <!-- RenderTransform：仅影响渲染，右侧按钮布局不变 -->
>             <StackPanel Grid.Row="0" Grid.Column="0" Margin="10" Background="#161B22">
>                 <TextBlock Text="RenderTransform" Foreground="#8B949E" Margin="8"/>
>                 <Button x:Name="BtnRender" Content="旋转 15°" Click="OnRenderBtn" Margin="8" Padding="8"
>                         Background="#21262D" Foreground="White">
>                     <Button.RenderTransform>
>                         <RotateTransform x:Name="RenderRotate" Angle="0"/>
>                     </Button.RenderTransform>
>                 </Button>
>                 <TextBlock Text="（按钮位置不变）" Foreground="#8B949E" Margin="8"/>
>             </StackPanel>
>             <!-- LayoutTransform：影响布局，占位随变换变化 -->
>             <StackPanel Grid.Row="0" Grid.Column="1" Margin="10" Background="#161B22">
>                 <TextBlock Text="LayoutTransform" Foreground="#8B949E" Margin="8"/>
>                 <Button x:Name="BtnLayout" Content="旋转 15°" Click="OnLayoutBtn" Margin="8" Padding="8"
>                         Background="#21262D" Foreground="White">
>                     <Button.LayoutTransform>
>                         <RotateTransform x:Name="LayoutRotate" Angle="0"/>
>                     </Button.LayoutTransform>
>                 </Button>
>                 <TextBlock Text="（占位随之变化）" Foreground="#8B949E" Margin="8"/>
>             </StackPanel>
>         </Grid>
>         <Button Grid.Row="2" Content="复位" Click="OnReset" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
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
>         private void OnRenderBtn(object sender, RoutedEventArgs e)
>         {
>             RenderRotate.Angle = RenderRotate.Angle == 0 ? 15 : 0;
>         }
>
>         private void OnLayoutBtn(object sender, RoutedEventArgs e)
>         {
>             LayoutRotate.Angle = LayoutRotate.Angle == 0 ? 15 : 0;
>         }
>
>         private void OnReset(object sender, RoutedEventArgs e)
>         {
>             RenderRotate.Angle = 0;
>             LayoutRotate.Angle = 0;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 动画/动效（必须 RenderTransform）：旋转叶片、移动物料、按钮反馈——高频更新不重排
> ✅ 纯视觉装饰：放大镜、倾斜标牌、倒影等不影响布局的效果
> ✅ 布局自适应固定变换：整个面板缩放 200% 且希望撑开布局——用 LayoutTransform
> ✅ 打印/导出：需要元素按变换后的尺寸占据布局——用 LayoutTransform
> ❌ 高频动画放 LayoutTransform：每帧重排，界面卡顿
> ❌ 希望布局稳定（旁边按钮不动）：用 RenderTransform

> [!pitfall] 常见踩坑
> 坑 1：**动画用了 LayoutTransform 导致卡顿** → 现象：旋转动画掉帧、界面抖动 → 原因：LayoutTransform 每帧触发 Measure/Arrange 重排 → 解决：动画一律用 RenderTransform；LayoutTransform 只用于静态布局适配
> 
> 坑 2：**用 RenderTransform 但希望元素"撑开"容器** → 现象：放大后内容溢出被裁剪 → 原因：RenderTransform 不影响布局，容器不知道元素变大了 → 解决：需要占位跟随用 LayoutTransform，或给容器设 ClipToBounds + 留白
>
> 坑 3：**变换后的命中区域与视觉不符** → 现象：旋转后的按钮点击不到 → 原因：RenderTransform 的命中测试按变换后位置计算，若用 LayoutTransform 则命中按布局占位 → 解决：确认交互场景——视觉按钮可点用 Render 正常；若出现错位检查坐标换算与 RenderTransformOrigin

> [!best] 最佳实践
> - 默认选 RenderTransform，除非明确需要"布局占位跟着变"
> - 动画永远走 RenderTransform；LayoutTransform 只用于静态（如整体缩放适配窗口）
> - 判断需求：问"旁边的元素要不要让位？"——要就让 Layout，不要就用 Render
> - 做"整体画面缩放"时，把 RenderTransform 放在内容容器上 + 外层 Border ClipToBounds，兼顾性能与裁剪
> - 性能敏感界面用 RenderTransform 且配合 RenderOptions 检查是否走 GPU

> [!practice] 上手练习
> **Lv.1 运行体验**：运行对比示例，分别点两个"旋转 15°"按钮，观察右侧按钮文字（布局是否让位）的差异
> **Lv.2 动手改造**：把"复位"按钮改成"Layout 复位/不复位"双态，观察切换后占位变化
> **Lv.3 综合实战**：做一个"画面缩放适配"——窗口大小变化时，内容用 LayoutTransform 等比缩放撑满窗口
> **Lv.4 挑战进阶**：给左侧 RenderTransform 按钮做 60fps 连续旋转动画（DispatcherTimer），对比换成 LayoutTransform 后的帧率

> [!related] 相关知识链接
> - ← 前置知识：rotatetransform-旋转 认识变换本身；scaletransform-缩放 做缩放适配
> - → 后续必学：transformgroup-变换组合 组合应用；2d-绘图综合 综合场景
> - ⇄ 关联概念：第 3 章「布局」理解 Measure/Arrange；性能注意事项 了解渲染开销
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/graphics-multimedia/transforms-overview
