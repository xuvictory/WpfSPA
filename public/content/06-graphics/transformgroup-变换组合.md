---
title: TransformGroup 变换组合
section: 06-graphics
parent: 6.5 Transform 变换
---

# TransformGroup 变换组合

> [!plain] 白话理解
> TransformGroup 是"把多个变换叠在一起用"的容器：缩放 → 旋转 → 平移，按顺序依次作用在同一个元素上。比如机械臂：先放大抓手、再旋转到目标角度、最后挪到指定位置——三种动作只要一个 `RenderTransform` 里的 TransformGroup 就能同时生效。**顺序很重要**：先缩放再旋转和平移，结果和先平移再旋转完全不同。
>
> 类比：工位操作步骤有先后——先"定位（平移）"再"转向（旋转）"还是先转再移，最终工件朝向和位置都不一样。

> [!def] 官方定义
> `System.Windows.Media.TransformGroup` 是 `Transform` 派生类，`Children`（`TransformCollection`）按**顺序**容纳多个 Transform（`ScaleTransform`/`RotateTransform`/`TranslateTransform`/`SkewTransform`/`MatrixTransform`），整体等价于各矩阵按顺序相乘后的复合矩阵。示例中"缩放→旋转→平移"等价于 `Matrix = M_scale × M_rotate × M_translate`。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.transformgroup

> [!origin] 由来背景
> 实际动画（机械臂、吊车、飞行动效）几乎不会只有单一变换，WPF 因此提供 TransformGroup 把多个变换组合成一条"变换管线"。它的顺序语义继承自图形学的矩阵复合规则——变换按 Children 顺序依次作用于元素，这与 3D 图形中"Model-View"矩阵栈的思想一致。组合后仍然是一个 Transform，可整体赋值给 RenderTransform/LayoutTransform，也可整体参与动画。

> [!essentials] 核心要点
> - **Children 顺序**：先声明的先作用（缩放→旋转→平移是"先形变后摆放"的常用顺序）
> - **单一入口**：组内每个变换可单独命名（x:Name），后台代码独立修改互不影响
> - **复合矩阵**：整体等价矩阵 = 各子矩阵按顺序相乘，可直接用 `Transform.Value` 查看
> - **任意组合**：可嵌套（组里有组），但优先保持扁平结构便于管理
> - **动画友好**：组内每个子变换都可被 Storyboard 独立动画（如旋转组旋转、缩放组放大）

> [!example] 完整示例
> **机械臂姿态演示：用 TransformGroup 将平移、旋转、缩放按顺序叠加，控制机械臂末端执行器到指定姿态：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="机械臂 - TransformGroup" Height="440" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="机械臂姿态（组合变换）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- TransformGroup：依次执行缩放→旋转→平移 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Grid x:Name="Arm" RenderTransformOrigin="0.5,0.5" HorizontalAlignment="Center" VerticalAlignment="Center">
>                 <Grid.RenderTransform>
>                     <TransformGroup>
>                         <ScaleTransform x:Name="GroupScale" ScaleX="1" ScaleY="1"/>
>                         <RotateTransform x:Name="GroupRotate" Angle="0"/>
>                         <TranslateTransform x:Name="GroupTranslate" X="0" Y="0"/>
>                     </TransformGroup>
>                 </Grid.RenderTransform>
>                 <!-- 机械臂本体：大臂 + 小臂 + 抓手 -->
>                 <Rectangle Width="26" Height="90" Fill="#58A6FF" RadiusX="10" RadiusY="10"
>                            VerticalAlignment="Top" HorizontalAlignment="Center" Margin="0,0,0,0"/>
>                 <Rectangle Width="20" Height="80" Fill="#8B949E" RadiusX="8" RadiusY="8"
>                            VerticalAlignment="Bottom" HorizontalAlignment="Center" Margin="0,0,0,30"/>
>                 <Ellipse Width="22" Height="22" Fill="#DA3633" VerticalAlignment="Bottom" HorizontalAlignment="Center"/>
>             </Grid>
>         </Grid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="左转" Click="OnLeft" Padding="10" Background="#21262D" Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="右转" Click="OnRight" Padding="10" Background="#21262D" Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="放大" Click="OnGrow" Padding="10" Background="#21262D" Foreground="White"/>
>         </StackPanel>
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
>         // 只改旋转，平移与缩放保持
>         private void OnLeft(object sender, RoutedEventArgs e)
>         {
>             GroupRotate.Angle -= 15;
>             GroupTranslate.X -= 8;
>         }
>
>         private void OnRight(object sender, RoutedEventArgs e)
>         {
>             GroupRotate.Angle += 15;
>             GroupTranslate.X += 8;
>         }
>
>         private void OnGrow(object sender, RoutedEventArgs e)
>         {
>             GroupScale.ScaleX = GroupScale.ScaleY = System.Math.Min(1.8, GroupScale.ScaleX + 0.15);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 机械臂/吊车组合运动：同时缩放、旋转、平移末端执行器
> ✅ 复杂设备动效：风机+机架的"整体平移+叶片旋转"分层组合
> ✅ 画面漫游：放大（缩放）+ 拖拽（平移）组合浏览
> ✅ 交互动画：按钮缩放反馈 + 位移动画叠加
> ✅ 多轴系统示意：XYZ 平台用多个平移组合表达坐标运动
> ❌ 只有单一变换：直接用对应 Transform，别套 TransformGroup
> ❌ 需要任意矩阵：直接用 matrixtransform-矩阵变换

> [!pitfall] 常见踩坑
> 坑 1：**变换顺序写反导致运动轨迹错误** → 现象：机械臂绕错点转或移动方向不对 → 原因：TransformGroup 里 Children 顺序即作用顺序，先缩放再平移与先平移再缩放结果不同 → 解决：按"缩放→旋转→平移"的固定套路（先形变后摆放），需要调试时逐个注释对照
> 
> 坑 2：**只命名了组没命名子变换** → 现象：后台代码想改角度却找不到 RotateTransform → 原因：子变换没加 `x:Name`，组里无法定位 → 解决：每个需要动态控制的子变换都加 `x:Name`（示例的 GroupScale/GroupRotate/GroupTranslate）
>
> 坑 3：**旋转中心与平移叠加导致"画圈"** → 现象：机械臂一边转一边绕大圈 → 原因：RotateTransform 未设 `RenderTransformOrigin="0.5,0.5"`，旋转绕左上角 + 平移叠加 → 解决：旋转子变换所在元素设 RenderTransformOrigin 居中，平移只负责"摆放"

> [!best] 最佳实践
> - 固定套路"缩放→旋转→平移"能覆盖绝大多数组合动画，先背下来再理解原理
> - 子变换全部命名，后台代码通过名称分别控制，代码可读性高
> - 同一元素的"静态摆位"与"动态动画"分开：摆位用 XAML 静态，动画用 Storyboard 驱动子变换
> - 需要多部件各自运动时，把 TransformGroup 放在各部件自己的容器上（如叶片组），不要全放父容器
> - 调试组合变换时先固定两个、只动一个，确认效果再放开

> [!practice] 上手练习
> **Lv.1 运行体验**：运行机械臂示例，点"左转/右转/放大"，观察三个按钮分别驱动组内的旋转与缩放
> **Lv.2 动手改造**：在 TransformGroup 里加一个 SkewTransform，观察对机械臂整体形状的影响
> **Lv.3 综合实战**：给机械臂加"下降/上升"——按钮同时改 Y 平移与缩放（模拟爪手接近目标变大）
> **Lv.4 挑战进阶**：用 Storyboard 让机械臂自动完成"抬起→左转→放下"的循环动作，三个子变换协同动画

> [!related] 相关知识链接
> - ← 前置知识：rotatetransform-旋转、scaletransform-缩放、translatetransform-平移 三个基础变换
> - → 后续必学：matrixtransform-矩阵变换 看组合的本质；rendertransform-vs-layouttransform 选对容器
> - ⇄ 关联概念：2d-绘图综合（机械臂综合场景）；storyboard-故事板 驱动组合动画
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.transformgroup
