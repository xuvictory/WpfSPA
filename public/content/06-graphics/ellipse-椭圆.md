---
title: Ellipse 椭圆
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Ellipse 椭圆

> [!plain] 白话理解
> Ellipse 是"正方形/矩形里内切的那个圆"。给它相等的 Width 和 Height 就是正圆，不等就是椭圆。上位机里到处是它的影子：指示灯、按钮圆点、表盘刻度、阀门圆盘、摄像头画面圆角。判断"该用 Ellipse 还是 Border"很简单——只是"画个圆"用 Ellipse；要在圆里放文字/子元素，就用 Border 加 `CornerRadius`。
>
> 类比：Ellipse 是"贴纸"，只能看；Border 是"托盘"，能装东西。指示灯是贴纸，按钮是托盘。

> [!def] 官方定义
> `System.Windows.Shapes.Ellipse` 是 Shape 派生控件，由 `Width`/`Height` 界定外接矩形，`Fill` 填充内部、`Stroke` 描边，`Stretch` 属性决定如何占满可用空间。当 Width 与 Height 相等时绘制正圆；不等时为椭圆。它没有文字内容，若需在圆中显示文本，应叠加 TextBlock 或用 Border 实现。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.ellipse

> [!origin] 由来背景
> 椭圆/圆是工业视觉里最常见的"软"图形（区别于矩形等硬边），WPF 的 Shape 家族从第一个版本就提供 Ellipse。它的价值在于两点：一是与矩形、圆角矩形组合能拼出仪表盘、阀门等设备外观；二是配合 `RenderTransform` 的缩放可以做出"呼吸灯""脉冲灯"等动画效果。由于它只是几何形状，渲染开销极低，几十个指示灯同时闪烁也不会卡顿。

> [!essentials] 核心要点
> - **正圆条件**：Width == Height 才是正圆，否则是椭圆——拖拽容器时容易"变形"
> - **Fill/Stroke 同 Shape**：默认 Fill 为透明黑色？实际默认 null，不填色则只显示 Stroke
> - **居中定位**：Ellipse 自身没有"中心点"属性，定位用容器坐标或 `Canvas.Left`/`Top`
> - **做指示灯**：状态切换改 Fill + 可选 `RenderTransform` 缩放实现呼吸/闪烁
> - **与 Border 区分**：Ellipse 不能放内容；Border 可放任何子元素且支持圆角，语义不同

> [!example] 完整示例
> **电机转速仪表演示：用 Ellipse 画刻度圆盘与指针底座，Width/Height 决定椭圆形状，点击按钮加速/减速：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="转速仪表 - Ellipse" Height="420" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="主轴电机转速（RPM）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 表盘：外圈 + 内圈两个 Ellipse 同心叠加 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Ellipse Width="260" Height="260" Fill="#161B22" Stroke="#30363D" StrokeThickness="4"/>
>             <Ellipse Width="240" Height="240" Fill="#0D1117" Stroke="#21262D" StrokeThickness="2"/>
>             <!-- 指针：细长矩形，旋转由后台代码控制 -->
>             <Rectangle x:Name="Needle" Width="4" Height="100" Fill="#DA3633"
>                        RenderTransformOrigin="0.5,1" VerticalAlignment="Center" HorizontalAlignment="Center">
>                 <Rectangle.RenderTransform>
>                     <RotateTransform x:Name="NeedleRotate" Angle="-120"/>
>                 </Rectangle.RenderTransform>
>             </Rectangle>
>             <TextBlock x:Name="RpmText" Text="0 RPM" Foreground="#8B949E" FontSize="20"
>                        HorizontalAlignment="Center" VerticalAlignment="Center"/>
>         </Grid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="加速" Click="OnSpeedUp" Padding="10" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="减速" Click="OnSpeedDown" Padding="10" Background="#DA3633"
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
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private double _rpm;    // 当前转速
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnSpeedUp(object sender, RoutedEventArgs e)
>         {
>             _rpm = System.Math.Min(3000, _rpm + 300);   // 上限 3000 RPM
>             UpdateGauge();
>         }
>
>         private void OnSpeedDown(object sender, RoutedEventArgs e)
>         {
>             _rpm = System.Math.Max(0, _rpm - 300);      // 下限 0 RPM
>             UpdateGauge();
>         }
>
>         // 0~3000 RPM 映射到指针角度 -120°~120°
>         private void UpdateGauge()
>         {
>             NeedleRotate.Angle = -120 + (_rpm / 3000.0) * 240;
>             RpmText.Text = $"{_rpm:F0} RPM";
>             RpmText.Foreground = _rpm > 2400
>                 ? new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33)) // 超速告警红色
>                 : Brushes.LimeGreen;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 指示灯/状态灯：正圆 Ellipse 加不同 Fill 表示运行/停止/报警
> ✅ 仪表盘：同心圆叠出表盘内外圈，配合 RotateTransform 旋转指针
> ✅ 设备示意：阀门、圆盘、管道截面、摄像头视角圆
> ✅ 呼吸/脉冲动画：Ellipse + ScaleTransform 缩放模拟"灯在闪"
> ❌ 圆形按钮（需要点击且放文字）：用 Border + CornerRadius 更合适
> ❌ 椭圆需要精确控制长轴/短轴角度：用 path-路径 的 Arc 更灵活

> [!pitfall] 常见踩坑
> 坑 1：**圆被容器拉伸成椭圆** → 现象：Width/Height 设成 50 却显示为椭圆 → 原因：在 Grid/StackPanel 中默认 `Stretch="Fill"` 被拉伸 → 解决：设 `Stretch="Uniform"` 或放在 Canvas 中；不想变形就显式指定相等宽高
> 
> 坑 2：**想给圆加文字却放不进去** → 现象：Ellipse 里写 `<Ellipse>文字</Ellipse>` 报错 → 原因：Ellipse 是纯图形，没有内容属性 → 解决：Ellipse 与 TextBlock 叠放（Grid 同格），或改用 Border
>
> 坑 3：**指示灯中心偏移** → 现象：多个指示灯排列时圆不在预期位置 → 原因：Ellipse 按左上角定位，圆心 = 左上角 + 半径 → 解决：用 `Canvas.Left`/`Top` 手动减半半径，或放在 Grid 中靠 HorizontalAlignment/VerticalAlignment 居中

> [!best] 最佳实践
> - 仪表盘先定圆心：把 Ellipse 放进 Grid 并居中，半径由 Width/Height 控制，圆心永远在中心
> - 状态灯颜色统一管理，配合数据绑定（第 7 章）用值转换器把 bool 转成画刷
> - 多个指示灯复用：把 Ellipse 做成资源（Style/ControlTemplate），一处改样式全局生效
> - 用 `RenderTransformOrigin="0.5,0.5"` 让旋转/缩放围绕圆心，否则会围着左上角转
> - 叠加同心圆时注意 `StrokeThickness` 会向外扩张，内圈半径要留出描边余量

> [!practice] 上手练习
> **Lv.1 运行体验**：运行转速仪表示例，点"加速/减速"，观察指针角度与 RPM 文本同步变化
> **Lv.2 动手改造**：把表盘外圈改成渐变色（后续学 lineargradientbrush-线性渐变），或把指针改成三角形状
> **Lv.3 综合实战**：在表盘外围加 12 个刻度小圆（Ellipse），刻度颜色随转速超限变红
> **Lv.4 挑战进阶**：用 DispatcherTimer 让转速自动上下波动（模拟电机负载变化），超 2400RPM 时让整个表盘外圈闪烁红色

> [!related] 相关知识链接
> - ← 前置知识：wpf-图形渲染概述；第 3 章「布局」的 Grid 居中定位
> - → 后续必学：所有-shape-共享属性；rotatetransform-旋转 让指针动起来
> - ⇄ 关联概念：rectangle-矩形（同心圆外框）、solidcolorbrush-纯色画刷（状态色）；第 7 章「什么是数据绑定」驱动转速
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.ellipse
