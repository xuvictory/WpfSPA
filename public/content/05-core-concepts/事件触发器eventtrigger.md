---
title: 事件触发器 EventTrigger
section: 05-core-concepts
parent: 5.9 触发器
---

# 事件触发器 EventTrigger

> [!plain] 白话理解
> 前面讲的 Trigger/DataTrigger 都是"值匹配"触发——属性等于某值或数据等于某值。但还有一类需求是"事件驱动"的——比如"按钮点击时播放一个弹出动画""鼠标进入时播放淡入动画"。**EventTrigger** 就是专为动画设计的触发器——它监听控件的**路由事件**（如 `MouseEnter`、`Loaded`、`Click`），当事件发生时，启动一个 `Storyboard`（动画剧本）来执行动画。EventTrigger 不能设 Setter 改属性——它只能启动/停止/暂停动画。

> [!def] 官方定义
> `EventTrigger` 继承自 `TriggerBase`，用于在指定路由事件（RoutedEvent）触发时执行一组动作（`TriggerAction` 集合）。最常用的动作是 `BeginStoryboard`（启动动画）和 `StopStoryboard`（停止动画）。EventTrigger 不能包含 `Setter`——它只能包含动作类。EventTrigger 完全独立于属性优先级系统，不参与依赖属性的值管理。`RoutedEvent` 属性必须指向一个合法的路由事件。

> [!origin] 由来背景
> WPF 的 Trigger 体系设计为"条件→属性变化"，但动画是持续性的时间轴动作，不能简单映射到属性的固定值。微软将动画触发单独设计为 EventTrigger + Storyboard 的组合：EventTrigger 负责"什么时候开始"，Storyboard 负责"做什么动画"。这套设计让复杂的动画交互（如弹出菜单、淡入淡出、闪烁报警）也能在 XAML 中声明式地完成。

> [!essentials] 核心要点
> - **RoutedEvent**：指定触发事件（如 `Button.Click`、`FrameworkElement.Loaded`）
> - **Actions 集合**：触发后执行的动作，常用 `BeginStoryboard`（启动动画）
> - **不能设 Setter**：EventTrigger 没有 Setters，只能用动作
> - **Storyboard 可控制**：`BeginStoryboard`、`PauseStoryboard`、`ResumeStoryboard`、`StopStoryboard`、`RemoveStoryboard`
> - **与 Trigger 配合**：Trigger 的 EnterActions/ExitActions 也可以启动 Storyboard（属性触发器也能做动画）
> - **只能监控路由事件**：CLR 事件和普通 .NET 事件不支持

> [!example] 完整示例
>
> 演示上位机中 EventTrigger 的典型用法——加载动画、报警闪烁、鼠标悬停效果。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="EventTrigger 演示" Height="500" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== 报警闪烁动画资源 ===== -->
>         <Storyboard x:Key="AlarmBlink" RepeatBehavior="Forever"
>                     AutoReverse="True">
>             <ColorAnimation
>                 Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
>                 From="#2a1515" To="#4a2525" Duration="0:0:0.5"/>
>             <!-- TargetProperty 全路径：ColorAnimation 目标类型是 Color -->
>             <ColorAnimation
>                 Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)"
>                 From="#CC2222" To="#FF4444" Duration="0:0:0.5"/>
>         </Storyboard>
>         
>         <!-- ===== 淡入动画 ===== -->
>         <Storyboard x:Key="FadeIn">
>             <DoubleAnimation
>                 Storyboard.TargetProperty="Opacity"
>                 From="0" To="1" Duration="0:0:0.8">
>                 <DoubleAnimation.EasingFunction>
>                     <CubicEase EasingMode="EaseOut"/>
>                 </DoubleAnimation.EasingFunction>
>             </DoubleAnimation>
>         </Storyboard>
>         
>         <!-- ===== 悬停放大动画 ===== -->
>         <Storyboard x:Key="HoverScaleUp">
>             <DoubleAnimation
>                 Storyboard.TargetProperty="(RenderTransform).(ScaleTransform.ScaleX)"
>                 To="1.05" Duration="0:0:0.2"/>
>             <DoubleAnimation
>                 Storyboard.TargetProperty="(RenderTransform).(ScaleTransform.ScaleY)"
>                 To="1.05" Duration="0:0:0.2"/>
>         </Storyboard>
>         
>         <Storyboard x:Key="HoverScaleDown">
>             <DoubleAnimation
>                 Storyboard.TargetProperty="(RenderTransform).(ScaleTransform.ScaleX)"
>                 To="1.0" Duration="0:0:0.2"/>
>             <DoubleAnimation
>                 Storyboard.TargetProperty="(RenderTransform).(ScaleTransform.ScaleY)"
>                 To="1.0" Duration="0:0:0.2"/>
>         </Storyboard>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="🎬 EventTrigger 事件触发动画演示"
>                        Foreground="#FF6B35" FontSize="16"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <StackPanel Grid.Row="1" Margin="20,15">
>             
>             <!-- ===== 1. Loaded 事件触发淡入动画 ===== -->
>             <TextBlock Text="1. Loaded 事件 → 淡入动画"
>                        Foreground="White"
>                        FontWeight="Bold" Margin="0,0,0,8"/>
>             <Border Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="15"
>                     BorderBrush="#444" BorderThickness="1"
>                     Width="450" Height="80"
>                     HorizontalAlignment="Left">
>                 <Border.Triggers>
>                     <EventTrigger RoutedEvent="FrameworkElement.Loaded">
>                         <BeginStoryboard Storyboard="{StaticResource FadeIn}"/>
>                     </EventTrigger>
>                 </Border.Triggers>
>                 <StackPanel VerticalAlignment="Center"
>                             HorizontalAlignment="Center">
>                     <TextBlock Text="✅ 系统初始化完成"
>                                Foreground="#3FB950"
>                                FontWeight="Bold" FontSize="14"/>
>                     <TextBlock Text="PLC 连接状态: 在线 ┃ 数据采集: 正常"
>                                Foreground="#999" FontSize="11"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- ===== 2. 报警闪烁（Loaded 事件启动循环动画） == -->
>             <TextBlock Text="2. Loaded 事件 → 循环闪烁（报警效果）"
>                        Foreground="White"
>                        FontWeight="Bold" Margin="0,20,0,8"/>
>             <Border x:Name="AlarmBorder"
>                     Background="#2a1515"
>                     CornerRadius="8" Padding="15"
>                     BorderBrush="#CC2222" BorderThickness="2"
>                     Width="450" Height="70"
>                     HorizontalAlignment="Left">
>                 <Border.Triggers>
>                     <EventTrigger RoutedEvent="FrameworkElement.Loaded">
>                         <BeginStoryboard Storyboard="{StaticResource AlarmBlink}"/>
>                     </EventTrigger>
>                 </Border.Triggers>
>                 <StackPanel Orientation="Horizontal"
>                             VerticalAlignment="Center">
>                     <TextBlock Text="⚠" Foreground="#CC2222"
>                                FontSize="24"
>                                VerticalAlignment="Center"/>
>                     <StackPanel Margin="10,0,0,0">
>                         <TextBlock Text="变频器 VFD-01 过载报警"
>                                    Foreground="#CC2222"
>                                    FontWeight="Bold" FontSize="14"/>
>                         <TextBlock Text="当前电流: 48.5A（额定: 35A）"
>                                    Foreground="#999" FontSize="11"
>                                    Margin="0,4,0,0"/>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>             
>             <!-- ===== 3. MouseEnter/MouseLeave 悬停缩放 ===== -->
>             <TextBlock Text="3. MouseEnter/MouseLeave → 悬停缩放"
>                        Foreground="White"
>                        FontWeight="Bold" Margin="0,20,0,8"/>
>             <Border Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="15"
>                     BorderBrush="#444" BorderThickness="1"
>                     Width="220" Height="100"
>                     HorizontalAlignment="Left">
>                 <Border.RenderTransform>
>                     <ScaleTransform CenterX="110" CenterY="50"/>
>                 </Border.RenderTransform>
>                 <Border.Triggers>
>                     <EventTrigger RoutedEvent="Mouse.MouseEnter">
>                         <BeginStoryboard
>                             Storyboard="{StaticResource HoverScaleUp}"/>
>                     </EventTrigger>
>                     <EventTrigger RoutedEvent="Mouse.MouseLeave">
>                         <BeginStoryboard
>                             Storyboard="{StaticResource HoverScaleDown}"/>
>                     </EventTrigger>
>                 </Border.Triggers>
>                 <StackPanel VerticalAlignment="Center"
>                             HorizontalAlignment="Center">
>                     <TextBlock Text="设备管理"
>                                Foreground="White"
>                                FontWeight="Bold" FontSize="14"/>
>                     <TextBlock Text="👆 鼠标悬停试试"
>                                Foreground="#999" FontSize="11"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
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
> 三种 EventTrigger 用法总结：
> | 事件 | 动画 | 效果 |
> |------|------|------|
> | FrameworkElement.Loaded | FadeIn（Opacity 0→1） | 页面加载时卡片淡入 |
> | FrameworkElement.Loaded | AlarmBlink（循环） | 报警卡片持续闪烁 |
> | Mouse.MouseEnter | HoverScaleUp | 鼠标进入时放大到 105% |
> | Mouse.MouseLeave | HoverScaleDown | 鼠标离开时缩回 100% |

> [!scene] 适用场景
> - ✅ 页面/控件加载动画——Loaded 事件触发淡入、滑入
> - ✅ 报警闪烁效果——循环动画让报警区域持续吸引注意力
> - ✅ 鼠标悬停动画——MouseEnter 放大/高亮、MouseLeave 还原
> - ✅ 按钮点击反馈动画——Click 事件触发短暂脉冲动画
> - ✅ 控件显示/隐藏动画——IsVisibleChanged 事件
> - ❌ 需要根据数据状态播放动画——用 Trigger 的 EnterActions/ExitActions
> - ❌ 需要修改属性值（非动画）——用 Trigger/DataTrigger 的 Setter

> [!pitfall] 常见踩坑
> - **坑1：EventTrigger 的 RoutedEvent 写成 CLR 事件名**。如 `RoutedEvent="Click"` 应该写成 `RoutedEvent="Button.Click"`。因为 EventTrigger 需要路由事件标识符，不是 CLR 事件包装器。解决方案：在 VS 中输入 `RoutedEvent=` 后用智能提示选择正确的事件标识符。
> - **坑2：Storyboard 的 TargetProperty 写错导致动画不生效**。TargetProperty 必须是依赖属性路径标识符，写 `TargetProperty="Opacity"` 可能因为类型歧义失败。解决方案：使用完全限定路径——`(UIElement.Opacity)` 或 `(Border.Background).(SolidColorBrush.Color)`。
> - **坑3：EventTrigger 不能设 Setter**。如果写了 `<EventTrigger RoutedEvent="..."><Setter .../></EventTrigger>` 会编译报错。解决方案：属性值切换用 Trigger/DataTrigger，事件驱动的持久效果用 EventTrigger + Storyboard。

> [!best] 最佳实践
> - 将 Storyboard 定义为 Resources 中的独立资源（设 x:Key），在 EventTrigger 中引用——便于复用和管理
> - 报警闪烁用 `RepeatBehavior="Forever"` + `AutoReverse="True"`——自动循环，无需手动停止/重启
> - 悬停动画保持轻量——Duration ≤ 0.3 秒，避免操作延迟感
> - 加载动画用 EasingFunction（如 CubicEase）让运动更自然——线性动画看起来"机械"
> - 上位机中大量数据刷新时避免同时播放过多动画——优先保证数据刷新性能

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：为设备列表创建一个"列表项淡入"效果——ItemsControl 加载时，每个设备卡片从透明淡入显示
> - **Lv.2 小试牛刀**：实现一个"心跳呼吸灯"——用 EventTrigger（Loaded）+ 循环 Storyboard 让设备运行状态指示灯像呼吸一样周期性变亮变暗
> - **Lv.3 融会贯通**：设计一个"上位机报警联动动画系统"——报警产生时触发红色闪烁+弹窗滑入+声音提示；报警确认后触发停止闪烁+弹窗滑出。用 EventTrigger + 命名 Storyboard + 代码控制组合实现

> [!related] 相关知识链接
> - ← 前置：多数据触发器 MultiDataTrigger — 多数据条件判断
> - → 后续：各触发器适用场景对比 — 四种触发器的综合选型指南
> - ⇄ 关联：Storyboard 动画 — EventTrigger 最常配合的动画类型
> - ⇄ 关联：属性触发器 Trigger — Trigger 的 EnterActions/ExitActions 也能启动 Storyboard
> - 📖 官方文档：[EventTrigger Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.eventtrigger)
