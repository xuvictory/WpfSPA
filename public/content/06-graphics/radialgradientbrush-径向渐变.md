---
title: RadialGradientBrush 径向渐变
section: 06-graphics
parent: 6.4 Brush 画刷
---

# RadialGradientBrush 径向渐变

> [!plain] 白话理解
> RadialGradientBrush 是"颜色从中心向外一圈圈扩散"的画刷——像往平静水面扔石子荡开的涟漪，只不过涟漪换成了颜色。上位机里它最有名的用途是**球形指示灯**：中心亮、边缘暗、高光偏左上，三笔就画出"玻璃球"的立体感，比纯色圆片高级得多。它比线性渐变多两个关键参数：渐变圆心（Center）和高光点（GradientOrigin）。
>
> 类比：探照灯从灯罩中心照出，越靠近灯源越亮，光斑边缘逐渐暗下去。

> [!def] 官方定义
> `System.Windows.Media.RadialGradientBrush` 从 `Center`（渐变中心，`Point` 相对坐标）向四周径向扩散，`GradientOrigin` 定义"光源"位置（默认同 Center），`RadiusX`/`RadiusY` 定义渐变椭圆的水平/垂直半径，`GradientStops` 定义沿半径的色阶断点。超出渐变椭圆的部分由 `SpreadMethod`（Pad/Reflect/Repeat）决定如何延续。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.radialgradientbrush

> [!origin] 由来背景
> 真实世界的"光"几乎都是径向的：灯泡、球体反光、镜头光晕。WPF 的 RadialGradientBrush 正是为模拟这类光照效果而设计，其参数模型（Center/Origin/Radius）与图形学的球体着色、光晕渲染同源。把 GradientOrigin 偏离圆心，就能制造"高光偏移"的立体球效果——这是工控球型指示灯、状态球通用的视觉技巧。

> [!essentials] 核心要点
> - **Center vs GradientOrigin**：Center 决定渐变几何中心，Origin 决定光源位置；Origin 偏移 = 高光偏移
> - **RadiusX/RadiusY**：控制渐变椭圆形状，配正圆图形时设为 0.5/0.5
> - **三段色阶**：高光(亮)→主体(主色)→边缘(深色)，是球体渲染的标准套路
> - **SpreadMethod**：Pad 默认截断、Reflect 镜像、Repeat 平铺，渐变越界时生效
> - **动态变色**：改 GradientStops 里的 Color 即可整球换色，适合状态切换

> [!example] 完整示例
> **球形指示灯演示：用 RadialGradientBrush 的 Center/GradientOrigin 与径向色阶模拟立体球体光泽，点击按钮切换红绿警示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="球形指示灯 - RadialGradientBrush" Height="400" Width="400"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="运行指示球" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- Center 是渐变中心，GradientOrigin 是高光位置，颜色由内向外扩散 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Ellipse x:Name="Ball" Width="160" Height="160">
>                 <Ellipse.Fill>
>                     <RadialGradientBrush x:Name="BallBrush" Center="0.5,0.5"
>                                           GradientOrigin="0.35,0.3" RadiusX="0.5" RadiusY="0.5">
>                         <GradientStop Color="#C6E7FF" Offset="0"/>
>                         <GradientStop Color="#58A6FF" Offset="0.55"/>
>                         <GradientStop Color="#0D419D" Offset="1"/>
>                     </RadialGradientBrush>
>                 </Ellipse.Fill>
>             </Ellipse>
>             <TextBlock x:Name="BallText" Text="运行" Foreground="White" FontSize="20" FontWeight="Bold"/>
>         </Grid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="运行" Click="OnRun" Padding="10" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="报警" Click="OnAlarm" Padding="10" Background="#DA3633"
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
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 运行：蓝绿色渐变；报警：红橙色渐变
>         private void OnRun(object sender, RoutedEventArgs e)
>         {
>             SetGradient(Colors.LightGreen, Color.FromRgb(0x23, 0x86, 0x36), Color.FromRgb(0x0F, 0x3D, 0x1F));
>             BallText.Text = "运行";
>         }
>
>         private void OnAlarm(object sender, RoutedEventArgs e)
>         {
>             SetGradient(Color.FromRgb(0xFF, 0xC8, 0xB0), Color.FromRgb(0xDA, 0x36, 0x33), Color.FromRgb(0x5F, 0x0A, 0x08));
>             BallText.Text = "报警";
>         }
>
>         // 动态修改径向渐变的三段色阶
>         private void SetGradient(Color inner, Color mid, Color outer)
>         {
>             BallBrush.GradientStops[0].Color = inner;
>             BallBrush.GradientStops[1].Color = mid;
>             BallBrush.GradientStops[2].Color = outer;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 球形指示灯：中心高光 + 边缘深色的立体球（运行/报警状态球）
> ✅ 仪表盘中心光斑：表盘中心加径向渐变模拟凹陷/凸起
> ✅ 光晕/呼吸效果：径向渐变做发光圆，配合透明度动画
> ✅ 聚光照明模拟：在设备图上叠加径向渐变模拟探照灯效果
> ✅ 圆角卡片的微弱立体感：边缘深色内衬
> ❌ 需要沿直线方向过渡：用 lineargradientbrush-线性渐变
> ❌ 需要规则平铺纹理：用 imagebrush-图像画刷 的 TileMode

> [!pitfall] 常见踩坑
> 坑 1：**高光位置不在预期位置** → 现象：球体高光偏在正中心或消失了 → 原因：忘了设 `GradientOrigin` 或设成与 Center 相同 → 解决：`GradientOrigin="0.35,0.3"` 让高光偏移左上，立体感立刻出来
> 
> 坑 2：**渐变在椭圆外"戛然而止"** → 现象：球边缘突然变硬色块 → 原因：渐变半径只覆盖到 RadiusX/Y 的范围，外侧默认 Pad（截断为最后颜色） → 解决：理解 SpreadMethod 语义；需要外扩时调大 RadiusX/RadiusY 或改用 Repeat/Reflect
>
> 坑 3：**Center/Origin 用绝对像素导致缩放错位** → 现象：窗口缩放后高光不在原位置 → 原因：Center 用了 `Absolute` 映射或写成像素值 → 解决：默认相对坐标（0-1），图形缩放高光位置自动按比例保持

> [!best] 最佳实践
> - 球体标准套路：三段色阶（亮高光→主色→深边缘）+ `GradientOrigin` 左上偏移
> - 状态切换只改 GradientStops 的颜色，保留 Center/Origin，性能好且不破坏立体感
> - 把"球体画刷"做成 Style/资源，所有状态球统一质感
> - 配合 `RenderTransform` 缩放做"脉冲灯"，注意旋转中心设 `0.5,0.5`
> - 预览时用半透明底图验证渐变范围，再收紧 Radius 值

> [!practice] 上手练习
> **Lv.1 运行体验**：运行球形指示灯示例，点"运行/报警"，观察整球渐变换色的立体效果
> **Lv.2 动手改造**：把 GradientOrigin 移到 `0.6,0.7`（右下），观察高光位置变化，再把 RadiusX 改成 0.3 看椭圆渐变
> **Lv.3 综合实战**：新增"警告"状态（橙色渐变），并给球加一圈纯色描边（Stroke）区分状态
> **Lv.4 挑战进阶**：用 Storyboard 对 GradientStops[0].Color 做亮度动画，实现"呼吸灯"效果，并思考如何用数据绑定驱动颜色

> [!related] 相关知识链接
> - ← 前置知识：lineargradientbrush-线性渐变 理解 GradientStop 体系；ellipse-椭圆 承载球体
> - → 后续必学：dropshadoweffect-投影 给球加阴影增强立体感；上位机画刷应用 综合
> - ⇄ 关联概念：solidcolorbrush-纯色画刷（状态色）；storyboard-故事板（颜色动画）；第 7 章绑定
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.radialgradientbrush
