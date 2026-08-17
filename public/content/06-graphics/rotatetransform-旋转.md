---
title: RotateTransform 旋转
section: 06-graphics
parent: 6.5 Transform 变换
---

# RotateTransform 旋转

> [!plain] 白话理解
> RotateTransform 是"把元素绕着某个点转个角度"的变换。上位机里最典型的应用就是**风机叶片**：三片叶片摆成 120° 夹角，整个叶片组每 50ms 转 6°，看起来就像风机在运转。它只改"显示的角度"，不碰布局、不重排，所以动画开销极小。关键参数就两个：转多少度（Angle）和绕哪个点转（RenderTransformOrigin）。
>
> 类比：表盘上的指针不是"移位置"，而是"绕表盘中心转角度"——转圈的本质是旋转，不是平移。

> [!def] 官方定义
> `System.Windows.Media.RotateTransform` 是 `Transform` 派生类，`Angle`（`double`，度）定义旋转角度（正值为顺时针），`CenterX`/`CenterY` 定义旋转中心（默认 `0,0`，即元素左上角）。配合 `UIElement.RenderTransformOrigin`（相对坐标 `0.5,0.5` = 元素中心）可把旋转中心设在元素内部任意比例位置。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.rotatetransform

> [!origin] 由来背景
> 旋转是图形学最基本的仿射变换之一，WPF 把它实现为可独立应用的 `Transform` 对象：不改布局坐标（Layout）只改绘制阶段（Render）的输出，因此**旋转不会触发重新布局**，只触发重绘——这是它可以高频动画而不卡顿的根源。WPF 设计 `RenderTransform` 与 `LayoutTransform` 分离，正是为了把"纯视觉变换"与"布局变化"区分开，旋转、缩放、平移这类视觉变换默认走 Render 路径。

> [!essentials] 核心要点
> - **Angle 方向**：正值为顺时针，负值为逆时针，单位度（不是弧度）
> - **旋转中心**：`RenderTransformOrigin="0.5,0.5"` 绕元素中心；默认 `0,0` 绕左上角（多数情况下不是你要的效果）
> - **组合场景**：多片叶片用各自局部 RotateTransform（120°/240°）摆好，外层容器统一旋转
> - **动画方式**：DispatcherTimer 或 Storyboard 改 Angle；连续动画优先 Storyboard（见 6.10）
> - **与平移区别**：旋转不改变元素位置与布局占位，平移也不改变，但两者视觉结果不同

> [!example] 完整示例
> **风叶旋转演示：用 RotateTransform 控制 Angle 与 RenderTransformOrigin 旋转中心，让风机叶片绕轴旋转，模拟设备运转动画：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="风机演示 - RotateTransform" Height="420" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="冷却风机" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 叶片组：以中心 (0.5,0.5) 为旋转原点 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Grid x:Name="BladeGroup" RenderTransformOrigin="0.5,0.5">
>                 <Grid.RenderTransform>
>                     <RotateTransform x:Name="FanRotate" Angle="0"/>
>                 </Grid.RenderTransform>
>                 <!-- 三片叶片 -->
>                 <Rectangle Width="12" Height="70" RadiusX="6" RadiusY="6" Fill="#58A6FF"
>                            HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,0,0,45"/>
>                 <Rectangle Width="12" Height="70" RadiusX="6" RadiusY="6" Fill="#58A6FF"
>                            HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,0,0,45">
>                     <Rectangle.RenderTransform>
>                         <RotateTransform Angle="120"/>
>                     </Rectangle.RenderTransform>
>                 </Rectangle>
>                 <Rectangle Width="12" Height="70" RadiusX="6" RadiusY="6" Fill="#58A6FF"
>                            HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,0,0,45">
>                     <Rectangle.RenderTransform>
>                         <RotateTransform Angle="240"/>
>                     </Rectangle.RenderTransform>
>                 </Rectangle>
>                 <!-- 中心轴 -->
>                 <Ellipse Width="26" Height="26" Fill="#DA3633" HorizontalAlignment="Center" VerticalAlignment="Center"/>
>             </Grid>
>             <TextBlock Text="转" Foreground="#8B949E" HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,0,0,0"/>
>         </Grid>
>         <Button Grid.Row="2" Content="启动 / 停止" Click="OnToggle" Margin="0,12,0,0"
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
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 定时器每 50ms 旋转一次，模拟实时运转
>             _timer.Interval = System.TimeSpan.FromMilliseconds(50);
>             _timer.Tick += (s, e) => FanRotate.Angle = (FanRotate.Angle + 6) % 360;
>         }
>
>         private void OnToggle(object sender, RoutedEventArgs e)
>         {
>             if (_timer.IsEnabled) _timer.Stop(); else _timer.Start();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 风机/电机/叶轮旋转动画：设备运转状态可视化
> ✅ 仪表指针：表盘指针绕中心旋转指示数值
> ✅ 机械臂关节：旋转关节角度变化
> ✅ 指示灯闪烁增强：加 45° 旋转让图标更醒目
> ✅ 相机/雷达扫描动画：扇形区域旋转扫描效果
> ❌ 需要元素"位移"的效果：用 translatetransform-平移
> ❌ 需要改变尺寸：用 scaletransform-缩放

> [!pitfall] 常见踩坑
> 坑 1：**旋转中心不对，图形"甩飞"** → 现象：叶片不是绕中心转而是绕左上角转，轨迹乱飞 → 原因：没设 `RenderTransformOrigin="0.5,0.5"`，默认绕 `0,0` 左上角 → 解决：把旋转容器设为 `RenderTransformOrigin="0.5,0.5"` 并居中布局
> 
> 坑 2：**多片叶片没摆好夹角** → 现象：叶片重叠或间隙不均 → 原因：叶片自身没做 120°/240° 局部旋转 → 解决：每片叶片各套一个 `RotateTransform Angle="120"` 或 `240"`（如示例），再整体旋转
>
> 坑 3：**Angle 累积溢出或方向搞反** → 现象：转着转着角度负数或跳到超大值 → 原因：直接累加不取模，或对顺时针方向理解错误 → 解决：`(Angle + 增量) % 360` 保持 0-360；顺时针是正值

> [!best] 最佳实践
> - 旋转中心统一用 `RenderTransformOrigin="0.5,0.5"`，元素整体居中布局，避免坐标计算
> - 多部件组合（叶片/指针）把"部件摆位"与"整体旋转"分成两层，逻辑清晰
> - 连续旋转用 Storyboard（见 6.10）更流畅；本示例用 DispatcherTimer 便于理解原理
> - 角度单位是"度"，转一圈 = 360，换算到物理量（如转速）时写清楚映射关系
> - 给叶片加中心轴 Ellipse 遮住旋转中心，视觉更自然（示例已演示）

> [!practice] 上手练习
> **Lv.1 运行体验**：运行风机示例，点"启动/停止"观察叶片旋转，再把定时器 Interval 从 50ms 改成 20ms 看转速变化
> **Lv.2 动手改造**：给风扇加第四片叶片（90° 间隔），并修改叶片颜色为青色 #56D364
> **Lv.3 综合实战**：做一个"转速仪表"——指针用 RotateTransform，按钮让指针每步转 15°，文本显示对应 RPM
> **Lv.4 挑战进阶**：把定时器改用 Storyboard 的 DoubleAnimation 旋转，并对比两种方式在 60fps 下的 CPU 占用

> [!related] 相关知识链接
> - ← 前置知识：ellipse-椭圆/rectangle-矩形 搭建叶片；RenderTransformOrigin 见所有-shape-共享属性
> - → 后续必学：scaletransform-缩放、translatetransform-平移 组合变换；transformgroup-变换组合 多变换叠加
> - ⇄ 关联概念：2d-绘图综合（风机综合看板）；第 8 章「线程与调度」的 DispatcherTimer 驱动动画
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.rotatetransform
