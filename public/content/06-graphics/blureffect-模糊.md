---
title: BlurEffect 模糊
section: 06-graphics
parent: 6.6 Effect 特效
---

# BlurEffect 模糊

> [!plain] 白话理解
> BlurEffect 是"给元素套一层磨砂玻璃"的特效：把元素内容按 `Radius` 半径模糊掉。上位机里最常见的用法是——弹窗弹出时，把背后的监控画面模糊掉，让用户注意力集中到弹窗上；或模拟"摄像头失焦"状态。它用起来极简：给元素的 `Effect` 属性挂一个 BlurEffect，调 Radius 即可。
>
> 类比：近视眼摘掉眼镜看东西——轮廓还在，细节糊了。Radius 就是"近视度数"。

> [!def] 官方定义
> `System.Windows.Media.Effects.BlurEffect` 是 `Effect` 派生类（`System.Windows.Media.Effects` 命名空间），`Radius`（`double`，DIP）定义模糊半径（0=不模糊），`KernelType`（`Gaussian`/`Box`）定义卷积核类型，`RenderingBias`（`Performance`/`Quality`）权衡性能与质量。通过 `UIElement.Effect` 属性挂载到任意元素。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.effects.blureffect

> [!origin] 由来背景
> 现代界面大量使用"背景虚化"（背景模糊）来突出前景内容，WPF 从 .NET 3.0 起内置 Effect 体系，BlurEffect 是其中应用最广的特效。它的实现基于 GPU 卷积，把模糊从"逐像素手工处理"提升为"一行 XAML 的声明式特效"。虽然 Radius 调大时性能开销明显，但失焦、弹窗遮罩这类低频场景完全够用——这也是它在工控界面"弹窗/告警聚焦"场景大放异彩的原因。

> [!essentials] 核心要点
> - **Effect 属性**：`UIElement.Effect` 挂载特效（`CamView.Effect = _blur`），一个元素同时只能挂一个 Effect
> - **Radius 范围**：0 = 原样；5-10 轻度模糊；20+ 重度模糊（示例滑块 0-30 演示）
> - **性能开销**：模糊是 GPU 卷积，Radius 越大越费；大面积高频模糊慎用
> - **代码复用**：一个 BlurEffect 实例可挂多个元素；Radius 变化即整体更新
> - **失焦语义**：Radius 调大表示"失焦/遮罩"，调回 0 表示"聚焦"，是弹窗场景的开关式用法

> [!example] 完整示例
> **失焦背景演示：用 BlurEffect 的 Radius 控制模糊半径，模拟窗口失焦、弹窗遮罩等场景，点击按钮调节模糊强度：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="模糊背景 - BlurEffect" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="监控画面失焦演示" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 被模糊的内容：模拟实时监控画面 -->
>         <Grid Grid.Row="1" Margin="0,10,0,0" Background="#161B22">
>             <Grid x:Name="CamView">
>                 <Rectangle Width="200" Height="130" Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"
>                            HorizontalAlignment="Center" VerticalAlignment="Center"/>
>                 <Ellipse Width="60" Height="60" Fill="#238636" HorizontalAlignment="Center"
>                          VerticalAlignment="Center" Opacity="0.7"/>
>                 <TextBlock Text="CAM-01" Foreground="#8B949E" HorizontalAlignment="Center"
>                            VerticalAlignment="Bottom" Margin="0,0,0,10"/>
>             </Grid>
>         </Grid>
>         <!-- 模糊半径滑杆 -->
>         <DockPanel Grid.Row="2" Margin="0,12,0,0">
>             <TextBlock Text="模糊半径" Foreground="#8B949E" Margin="0,0,10,0" VerticalAlignment="Center"/>
>             <Slider x:Name="BlurSlider" Minimum="0" Maximum="30" Value="0"
>                     ValueChanged="OnBlurChanged"/>
>             <TextBlock x:Name="BlurValue" Text="0" Foreground="#8B949E" Width="40"
>                        TextAlignment="Right" VerticalAlignment="Center"/>
>         </DockPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media.Effects;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly BlurEffect _blur = new BlurEffect();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             CamView.Effect = _blur;   // 挂载模糊特效
>         }
>
>         private void OnBlurChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             _blur.Radius = BlurSlider.Value;
>             BlurValue.Text = BlurSlider.Value.ToString("F0");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 弹窗遮罩：弹出确认框时模糊背后监控画面，聚焦注意力
> ✅ 失焦模拟：模拟摄像头/画面失焦状态（Radius 从 0 拉到 20+）
> ✅ 动态模糊提示：模糊 + 提示文字表示"画面待机/无信号"
> ✅ 玻璃质感：模糊半透明面板（配合透明度）
> ❌ 高频动画中大面积模糊：GPU 开销大，掉帧
> ❌ 需要像素级精确模糊控制：用 writeablebitmap-可写入位图 自实现

> [!pitfall] 常见踩坑
> 坑 1：**Radius 调大后画面明显掉帧** → 现象：拖动滑块到 30 时卡顿 → 原因：模糊是 GPU 卷积，半径越大开销越大 → 解决：低频静态模糊 OK；动画/高频场景保持小半径或改用遮罩替代（半透明黑底即可）
> 
> 坑 2：**模糊范围超出预期（边缘被切）** → 现象：元素边缘出现模糊被裁掉 → 原因：模糊会向外扩散，容器没留边距被 Clip → 解决：给被模糊元素所在容器加 Padding/Margin 余量，或关掉父容器 ClipToBounds
>
> 坑 3：**多个特效叠加混乱** → 现象：又模糊又投影效果异常 → 原因：`Effect` 属性一次只能挂一个 Effect，后赋覆盖前者 → 解决：把多个效果组合进一个 EffectGroup（.NET 3.0 SP1+）或只保留最需要的特效

> [!best] 最佳实践
> - 弹窗遮罩的模糊值固定（如 Radius=12），进入/退出时只做透明度动画，避免滑块式高频调参
> - 明确"模糊=状态"：Radius 0↔20 作为"聚焦↔失焦"的开关，用 Storyboard 平滑过渡
> - 大面积模糊改"半透明黑遮罩"（性价比更高），模糊只用于小区域或低频场景
> - 模糊 + 文字提示组合表达"无信号/待机"，比纯黑屏友好
> - 一个 BlurEffect 实例可复用给多个元素，别每处 new

> [!practice] 上手练习
> **Lv.1 运行体验**：运行失焦示例，拖动"模糊半径"滑块，观察 CAM-01 画面从清晰到模糊
> **Lv.2 动手改造**：把模糊值默认设为 12，并在窗口加载时自动淡入（模糊从 12 → 0 平滑聚焦）
> **Lv.3 综合实战**：做"弹窗遮罩"——点按钮弹出"确认启动设备？"面板，背后监控画面模糊 + 半透明遮罩
> **Lv.4 挑战进阶**：用 Storyboard 对 Radius 做 0→20→0 循环动画，实现"呼吸失焦"提醒效果

> [!related] 相关知识链接
> - ← 前置知识：wpf-图形渲染概述 理解 GPU 渲染与特效管线
> - → 后续必学：dropshadoweffect-投影 兄弟特效；性能注意事项 理解特效开销
> - ⇄ 关联概念：动画基础概念 模糊过渡动画；第 5 章「什么是样式」把特效做进控件模板
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.effects.blureffect
