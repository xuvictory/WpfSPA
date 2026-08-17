---
title: DropShadowEffect 投影
section: 06-graphics
parent: 6.6 Effect 特效
---

# DropShadowEffect 投影

> [!plain] 白话理解
> DropShadowEffect 是"给元素投一道影子"的特效：卡片下面一道柔和的光晕，让它看起来"浮"在界面上。上位机里最常用的地方是**设备卡片**——运行中的设备卡片挂蓝色投影、停止的挂灰色投影，一眼就能分清"谁在干活"。三个关键参数：`Color`（影子颜色）、`BlurRadius`（影子柔和度）、`ShadowDepth`（影子偏移距离）。
>
> 类比：灯从上面照下来，物体离桌面越远影子越虚越大。调 BlurRadius 就像调灯的柔光罩。

> [!def] 官方定义
> `System.Windows.Media.Effects.DropShadowEffect` 是 `Effect` 派生类，`Color`（投影颜色，默认黑）、`BlurRadius`（模糊半径，`double`）、`ShadowDepth`（阴影偏移，`double`，正值向右下）、`Direction`（阴影方向角，默认 315° 右下）、`Opacity`（阴影透明度 0-1）。通过 `UIElement.Effect` 挂载。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.effects.dropshadoweffect

> [!origin] 由来背景
> 平面界面容易"糊成一片"，投影是建立视觉层级（哪个浮起来、哪个沉下去）最经济的手段。WPF 从 .NET 3.0 起把 DropShadowEffect 内置进 Effect 体系，开发者不再需要手工绘制半透明阴影位图。与 WinForms 时代"阴影要叠两张图"相比，投影变成纯声明式属性，且可以随状态动画（颜色/深度变化），成为卡片、弹窗、悬浮提示的标配特效。

> [!essentials] 核心要点
> - **状态区分**：投影颜色/强度 = 状态（蓝色亮投影=选中/运行，灰色淡投影=普通/停止）
> - **BlurRadius**：控制柔和度（柔和值 10-25），越小影子越硬
> - **ShadowDepth**：控制偏移距离（值越大影子越"飘"），默认 315° 右下
> - **Opacity 半透明**：影子别太实，0.4-0.8 更自然
> - **与 Effect 互斥**：一个元素只能挂一个 Effect，投影与模糊不能同时直接挂

> [!example] 完整示例
> **悬浮卡片演示：用 DropShadowEffect 的 BlurRadius/ShadowDepth/Color 为面板添加投影，模拟选中/悬浮的高亮效果：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="悬浮卡片 - DropShadowEffect" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备卡片（投影特效）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 选中卡片：蓝色投影；普通卡片：灰色投影 -->
>         <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="0,10,0,0">
>             <Border x:Name="CardA" Width="170" Height="120" Background="#21262D" CornerRadius="8"
>                     Margin="8" Padding="10">
>                 <Border.Effect>
>                     <DropShadowEffect x:Name="ShadowA" Color="#58A6FF" BlurRadius="18"
>                                       ShadowDepth="4" Opacity="0.8"/>
>                 </Border.Effect>
>                 <StackPanel>
>                     <TextBlock Text="A 号泵" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>                     <TextBlock Text="运行中" Foreground="#238636" Margin="0,8,0,0"/>
>                     <TextBlock Text="25.0 ℃" Foreground="#8B949E" Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             <Border x:Name="CardB" Width="170" Height="120" Background="#21262D" CornerRadius="8"
>                     Margin="8" Padding="10">
>                 <Border.Effect>
>                     <DropShadowEffect Color="#8B949E" BlurRadius="6" ShadowDepth="2" Opacity="0.4"/>
>                 </Border.Effect>
>                 <StackPanel>
>                     <TextBlock Text="B 号泵" Foreground="#8B949E" FontSize="16" FontWeight="Bold"/>
>                     <TextBlock Text="停止" Foreground="#8B949E" Margin="0,8,0,0"/>
>                     <TextBlock Text="-- ℃" Foreground="#8B949E" Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>         </StackPanel>
>         <TextBlock Grid.Row="2" Foreground="#8B949E" Margin="0,12,0,0"
>                    Text="提示：ShadowDepth 控制偏移，BlurRadius 控制投影柔和度"/>
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
> ✅ 设备卡片/状态卡片：运行卡片挂蓝色投影、停止卡片挂灰色投影，状态一目了然
> ✅ 弹窗/浮层：弹出提示框时挂投影，从背景中"浮"起来
> ✅ 按钮交互反馈：鼠标悬停时投影加深，提示可点击
> ✅ 告警高亮：红色投影闪烁标识报警设备
> ✅ 图表/数值卡片：仪表盘、趋势图卡片加投影增加层次
> ❌ 大量元素同时挂投影（几十个卡片）：性能问题见性能注意事项
> ❌ 需要"发光"而不是"投影"：考虑径向渐变模拟光晕（radialgradientbrush-径向渐变）

> [!pitfall] 常见踩坑
> 坑 1：**投影颜色用纯黑且过浓** → 现象：阴影像"污渍"，界面脏 → 原因：Opacity 高、BlurRadius 小、颜色深 → 解决：用状态色或低饱和色（如示例蓝色投影），Opacity 0.4-0.6，BlurRadius 12-20
> 
> 坑 2：**给动画/高频变化元素挂投影导致卡顿** → 现象：卡片移动时拖影、掉帧 → 原因：投影也是 GPU 特效，动画元素每帧重算 → 解决：动画结束后再挂投影；移动中用无特效的纯色，停止后加投影
>
> 坑 3：**ShadowDepth 太大显得"假"** → 现象：影子飘得很远，像元素飞在空中 → 原因：偏移过大的投影违背视觉直觉 → 解决：ShadowDepth 2-6 内取，方向默认 315° 即可；想更真实配合 BlurRadius 同向增大

> [!best] 最佳实践
> - 投影参数做成统一资源（Style 或 Brush 参照），卡片投影全站一致
> - "状态→投影"映射：运行=蓝色亮投影、停止=灰色淡投影、告警=红色投影，见示例
> - 投影挂 Border 而非内部内容，投影范围可控且与圆角一致
> - 数量多的场景（图墙/监控墙）尽量少用投影，用边框+底色区分即可
> - 弹窗遮罩模糊（blureffect-模糊）+ 弹窗本体投影组合，聚焦效果最佳

> [!practice] 上手练习
> **Lv.1 运行体验**：运行设备卡片示例，观察 A 卡（蓝色投影）与 B 卡（灰色投影）的视觉差异
> **Lv.2 动手改造**：把 ShadowA 的 BlurRadius 从 18 改成 30、ShadowDepth 从 4 改成 8，观察"飘浮感"
> **Lv.3 综合实战**：给"运行中"卡片加第三种状态——鼠标移入时投影从蓝变红（MouseEnter/MouseLeave 改 Color）
> **Lv.4 挑战进阶**：用 Storyboard 让 A 卡投影做"呼吸"动画（BlurRadius 18→26 循环），模拟选中脉冲

> [!related] 相关知识链接
> - ← 前置知识：blureffect-模糊 理解特效体系；solidcolorbrush-纯色画刷 控制投影色
> - → 后续必学：性能注意事项 避免特效滥用；第 11 章「控件模板-controltemplate」把投影做进按钮模板
> - ⇄ 关联概念：动画基础概念 投影动画；第 5 章「什么是样式」统一投影规范
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.effects.dropshadoweffect
