---
title: Storyboard 故事板
section: 06-graphics
parent: 6.10 动画
---

# Storyboard 故事板

> [!plain] 白话理解
> Storyboard 是"动画导演"：单个动画只管一个属性，Storyboard 把多个动画编成一组，统一"开始→暂停→停止"。就像排练节目，每个演员（动画）有自己的台词（目标属性），导演（Storyboard）喊开始大家才一起动。工控里"开机自检动画"就是一组动画齐步走：进度条变宽 + 指示灯闪烁 + 文字更新，全部由同一个导演调度。

> [!def] 官方定义
> `System.Windows.Media.Animation.Storyboard` 继承自 `Timeline`，通过 `Children` 集合容纳多个 `AnimationTimeline`。`Storyboard.SetTarget(animation, targetObject)` 与 `Storyboard.SetTargetProperty(animation, new PropertyPath(...))` 为每个动画指定目标对象与目标属性；`Begin(FrameworkElement)`、`Pause`、`Resume`、`Stop`、`Seek` 统一控制整组动画。`FillBehavior`（HoldEnd/Stop）决定动画结束后属性是否保留终值。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.animation.storyboard

> [!origin] 由来背景
> 多个动画需要"同步启停 + 统一时钟"，否则各自为战难以协调。WPF 提供 Storyboard 作为时间线容器（动画"场景"）：XAML 里可用 `<Storyboard>` 标签声明，配合 EventTrigger/Trigger 纯 XAML 触发；代码里也可组装。工控的开机自检、报警联动、界面切换过渡，本质都是一组属性的协同动画，Storyboard 让它们"同生共死"。

> [!essentials] 核心要点
> - **组装两步**：`Children.Add(anim)` 加入动画，再 `SetTarget` + `SetTargetProperty` 绑定目标对象与属性路径
> - **统一控制**：`Begin(this)`/`Pause`/`Resume`/`Stop`/`Seek` 作用于整组动画
> - **XAML 声明**：`EventTrigger` + `BeginStoryboard` 可实现纯 XAML 触发动画（无需后台代码）
> - **停止行为**：`Stop()` 把属性还原为初始值；需保留终值用 `FillBehavior=HoldEnd`
> - **与 BeginAnimation 分工**：Storyboard 适合多动画协同，单属性动画用 BeginAnimation 更轻量

> [!example] 完整示例
> **开机自检动画演示：用 Storyboard 集中编排多个动画（颜色、尺寸、透明度），Begin/Stop/Pause 统一控制，模拟设备开机自检流程：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="开机自检 - Storyboard" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备开机自检（Storyboard）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <StackPanel Grid.Row="1" VerticalAlignment="Center">
>             <!-- 自检条：宽度变化 -->
>             <Border x:Name="ProgressBar" Width="60" Height="16" CornerRadius="8"
>                     HorizontalAlignment="Left" Background="#238636"/>
>             <TextBlock x:Name="ProgressText" Text="自检中…" Foreground="#8B949E" Margin="0,8,0,0"/>
>             <!-- 指示灯：颜色闪烁 -->
>             <Ellipse x:Name="Led" Width="34" Height="34" Fill="#21262D" Margin="0,20,0,0"
>                      HorizontalAlignment="Left"/>
>         </StackPanel>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="开始自检" Click="OnBegin" Padding="10" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="暂停" Click="OnPause" Padding="10" Background="#21262D"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="重置" Click="OnReset" Padding="10" Background="#DA3633"
>                     Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Media.Animation;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly Storyboard _board = new Storyboard();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             BuildStoryboard();
>         }
>
>         // 把多个动画编排进同一 Storyboard
>         private void BuildStoryboard()
>         {
>             var widthAnim = new DoubleAnimation(320, new Duration(System.TimeSpan.FromSeconds(2)))
>             {
>                 RepeatBehavior = RepeatBehavior.Forever
>             };
>             Storyboard.SetTarget(widthAnim, ProgressBar);
>             Storyboard.SetTargetProperty(widthAnim, new PropertyPath(FrameworkElement.WidthProperty));
>
>             var colorAnim = new ColorAnimation(
>                 Color.FromRgb(0x21, 0x26, 0x2D), Color.FromRgb(0xDA, 0x36, 0x33),
>                 new Duration(System.TimeSpan.FromMilliseconds(400)))
>             {
>                 AutoReverse = true,
>                 RepeatBehavior = RepeatBehavior.Forever
>             };
>             var ledBrush = new SolidColorBrush();
>             Led.Fill = ledBrush;
>             Storyboard.SetTarget(colorAnim, ledBrush);
>             Storyboard.SetTargetProperty(colorAnim, new PropertyPath(SolidColorBrush.ColorProperty));
>
>             _board.Children.Add(widthAnim);
>             _board.Children.Add(colorAnim);
>         }
>
>         private void OnBegin(object sender, RoutedEventArgs e)
>         {
>             _board.Begin(this);          // 启动整组动画
>             ProgressText.Text = "自检中…";
>         }
>
>         private void OnPause(object sender, RoutedEventArgs e)
>         {
>             _board.Pause(this);
>             ProgressText.Text = "已暂停";
>         }
>
>         private void OnReset(object sender, RoutedEventArgs e)
>         {
>             _board.Stop(this);           // 停止并回到初始值
>             ProgressText.Text = "等待自检";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 开机自检/启动动画：进度条、指示灯、文字多元素齐步走
> ✅ 报警联动动画组：灯闪 + 文字抖动 + 弹窗浮现一起触发
> ✅ 界面切换过渡：页面/面板切换时的淡入、位移组合
> ✅ 多元素协同动画：一组物料同时流动
> ❌ 单属性简单动画：用 BeginAnimation 更轻量
> ❌ 需要精确控制单个动画（暂停/定位单个）：用 Clock 或直接管理动画时间线

> [!pitfall] 常见踩坑
> 坑 1：**运行时报"无法解析目标"** → 现象：Begin 时报 InvalidOperationException，目标属性找不到 → 原因：`SetTarget`/`SetTargetProperty` 没配对，或目标对象不在作用域内 → 解决：逐一核对 SetTarget(动画, 对象) 与 SetTargetProperty(动画, 新 PropertyPath(...))，属性路径与类型一致
> 
> 坑 2：**Stop 后状态回退** → 现象：自检完成后所有元素跳回初始值 → 原因：`Storyboard.Stop()` 会把属性还原为动画前状态 → 解决：需要保留终值就设 `FillBehavior=HoldEnd`，或在动画完成后不 Stop
>
> 坑 3：**反复 Begin 动画叠加/卡顿** → 现象：多次点开始后动画越跑越乱、界面变卡 → 原因：每次 Begin 创建新时钟，旧时钟未释放 → 解决：Begin 前先 `Stop()`，或复用同一个 Storyboard 实例

> [!best] 最佳实践
> - 动画编排集中在一个 `BuildStoryboard()` 方法中，目标与属性路径显式声明，便于维护
> - 颜色动画目标用独立画刷实例（`new SolidColorBrush()` 赋给元素），避免改元素 Fill 导致引用丢失
> - 整组控制统一走 Storyboard（Begin/Pause/Stop），不要和 BeginAnimation 混用
> - XAML 场景用 `EventTrigger` + `BeginStoryboard` 纯声明触发，代码场景用代码组装
> - 多动画错峰：用各动画的 `BeginTime` 错开起始时刻（如进度条先动、文字后出）

> [!practice] 上手练习
> **Lv.1 运行体验**：运行示例，点"开始自检"看进度条、指示灯、文字三动画齐步走
> **Lv.2 动手改造**：在 Storyboard 里加第四个动画（透明度淡入），复用现有控制方式
> **Lv.3 综合实战**：用 BeginTime 错峰编排三阶段：进度条(0s) → 指示灯(1s) → 文字(1.5s)，模拟自检节奏
> **Lv.4 挑战进阶**：用 XAML `EventTrigger` + `BeginStoryboard` 重写，实现纯 XAML 触发，后台零代码

> [!related] 相关知识链接
> - ← 前置知识：基础动画类型 各类动画；动画基础概念 时间线机制
> - → 后续必学：动画在上位机的应用 综合监控看板
> - ⇄ 关联概念：第 7 章「命令与路由事件」事件触发动画；第 5 章「什么是样式」视觉统一
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.animation.storyboard
