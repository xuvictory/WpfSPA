---
title: TranslateTransform 平移
section: 06-graphics
parent: 6.5 Transform 变换
---

# TranslateTransform 平移

> [!plain] 白话理解
> TranslateTransform 是"把元素从当前位置挪动一段距离"。上位机里**传送带上的物料**、巡检机器人移动、画面平移浏览全靠它。它只改"显示位置"，不动布局——所以每秒挪几十次也不重排界面，丝般顺滑。两个参数：`X`（水平偏移）和 `Y`（垂直偏移），正负号决定方向。
>
> 类比：舞台上的追光灯。灯的位置没变，但光束（视觉输出）可以瞬间扫到舞台任何角落。

> [!def] 官方定义
> `System.Windows.Media.TranslateTransform` 是 `Transform` 派生类，`X`/`Y`（`double`，DIP 逻辑像素）定义水平/垂直位移量。它是所有 Transform 中最简单的仿射变换——只改变位置不改变形状、角度与大小。修改 `X`/`Y` 仅触发渲染层更新，不触发父容器重新布局。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.translatetransform

> [!origin] 由来背景
> 在 WPF 中，想让元素"动起来"，传统做法是改 `Canvas.Left`/`Margin`——但每次修改都触发布局重排，高频移动会卡顿。TranslateTransform 把"位移"从布局中剥离：只作用于渲染输出，不动布局树，因此成为**高频移动动画**（物料输送、机械臂、巡检轨迹）的标准实现。它也是 TransformGroup 里"最后一步定位"的常用成员（先旋转/缩放再平移）。

> [!essentials] 核心要点
> - **X/Y 方向**：X 正向右、Y 正向下（屏幕坐标系），负值反向
> - **高频移动**：DispatcherTimer 每帧改 X/Y，只触发渲染不重排布局，性能优于改 Canvas.Left
> - **边界判断**：移动类动画都要设边界（如 `x > 300 反向`），防止元素"跑出画面"
> - **组合定位**：TransformGroup 中最后一项放 TranslateTransform 做"摆放"，前面放旋转/缩放
> - **与布局区别**：TranslateTransform 不影响实际布局位置（鼠标命中与视觉位置一致，但布局占位不动）

> [!example] 完整示例
> **传送带物料移动演示：用 TranslateTransform 的 X/Y 控制平移距离，让物料方块沿传送带往复移动：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="传送带 - TranslateTransform" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="物料输送演示" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Background="#161B22" Margin="0,10,0,0" ClipToBounds="True">
>             <!-- 传送带轨道 -->
>             <Rectangle Height="14" Fill="#30363D" VerticalAlignment="Center"/>
>             <!-- 物料：通过 TranslateTransform 控制水平位置 -->
>             <Rectangle x:Name="Box" Width="48" Height="34" Fill="#DA3633" RadiusX="4" RadiusY="4"
>                        HorizontalAlignment="Left" VerticalAlignment="Center" Margin="24,0,0,0">
>                 <Rectangle.RenderTransform>
>                     <TranslateTransform x:Name="BoxMove" X="0" Y="0"/>
>                 </Rectangle.RenderTransform>
>             </Rectangle>
>         </Grid>
>         <Button Grid.Row="2" Content="开始输送" Click="OnStart" Margin="0,12,0,0"
>                 Padding="8" Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private bool _forward = true;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Interval = System.TimeSpan.FromMilliseconds(30);
>             _timer.Tick += OnTick;
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             if (_timer.IsEnabled) _timer.Stop(); else _timer.Start();
>         }
>
>         // 每帧更新 X 坐标，触达边界后反向，形成往复运动
>         private void OnTick(object sender, System.EventArgs e)
>         {
>             double x = BoxMove.X;
>             if (_forward) x += 4; else x -= 4;
>             if (x > 300) _forward = false;
>             if (x < 0) _forward = true;
>             BoxMove.X = x;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 传送带/输送线物料移动：物料方块沿轨道往复运动
> ✅ 巡检机器人轨迹：AGV 小车在车间地图上移动
> ✅ 画面漫游：放大后的画面拖拽平移浏览
> ✅ 入场动画：面板/提示框从一侧滑入
> ✅ 滚动画中画：水平滚动提示、跑马灯
> ❌ 需要绕点旋转：用 rotatetransform-旋转
> ❌ 需要改变尺寸：用 scaletransform-缩放

> [!pitfall] 常见踩坑
> 坑 1：**把 X/Y 当"目标位置"用** → 现象：以为设 X=300 元素停在 300，实际是"偏移 300" → 原因：TranslateTransform 的 X/Y 是相对原始位置的位移，不是绝对坐标 → 解决：维护"逻辑位置"变量，位移 = 目标 - 原始；或结合 Canvas.Left 一起管理
> 
> 坑 2：**高频更新但没考虑边界 → 元素飞出画面** → 现象：物料一直右移直到消失 → 原因：没写边界判断 → 解决：`if (x > max) _forward = false;` 触边反向（示例做法），或对 X/Y 做 clamp
>
> 坑 3：**同时用 TranslateTransform 和 Canvas.Left 导致"叠影"错乱** → 现象：元素位置忽左忽右 → 原因：两种定位方式同时作用叠加 → 解决：统一用一套——动态移动用 TranslateTransform，静态布局用 Canvas.Left，不要混着改同一元素

> [!best] 最佳实践
> - 动态移动统一走 TranslateTransform（性能好），静态布局用布局属性，职责清晰
> - 移动状态用"方向标志"（`_forward`）管理，避免每帧重新判断复杂逻辑
> - 画面漫游时把平移与缩放组合（TransformGroup），先缩放再平移（见 transformgroup-变换组合）
> - 物料移动步长与定时器间隔配合控制速度（步长 4 + 30ms ≈ 133px/s），需要可调时抽成变量
> - 移动类动画结束后记得恢复 X/Y=0，避免下次启动从偏移位置开始

> [!practice] 上手练习
> **Lv.1 运行体验**：运行传送带示例，点"开始输送"，观察物料往复移动与轨道边界反转
> **Lv.2 动手改造**：把步长从 4 改成 2 观察速度变化，再给物料加一个 Y 方向小幅上下抖动（模拟振动）
> **Lv.3 综合实战**：做"AGV 小车巡线"——让小车沿 L 形轨迹移动（先横后竖），到点后返回
> **Lv.4 挑战进阶**：结合 scaletransform-缩放 实现"放大画面 + 拖拽平移"——滚轮缩放，鼠标拖动修改 TranslateTransform.X/Y

> [!related] 相关知识链接
> - ← 前置知识：rectangle-矩形 物料方块；wpf-图形渲染概述 理解"渲染层位移"的性能优势
> - → 后续必学：transformgroup-变换组合 位移+旋转组合；storyboard-故事板 平滑移动动画
> - ⇄ 关联概念：2d-绘图综合（输送线综合场景）；第 8 章「线程与调度」DispatcherTimer 驱动
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.translatetransform
