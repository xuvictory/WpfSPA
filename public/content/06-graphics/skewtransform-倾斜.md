---
title: SkewTransform 倾斜
section: 06-graphics
parent: 6.5 Transform 变换
---

# SkewTransform 倾斜

> [!plain] 白话理解
> SkewTransform 是"把元素沿某个方向推歪"的变换：像一个平行四边形那样被"斜切"。它最常用的效果是**车间标牌/路标**——斜斜的"危险区域"标牌比正放的更有警示感和设计感。两个角度：`AngleX` 沿水平方向歪、`AngleY` 沿垂直方向歪，配合 Center 决定"从哪歪"。
>
> 类比：把一张方形卡片用手一推，变成菱形——边长没变，但角度变了，这就是倾斜。

> [!def] 官方定义
> `System.Windows.Media.SkewTransform` 是 `Transform` 派生类，`AngleX`（沿 X 轴方向的倾斜角，度）与 `AngleY`（沿 Y 轴方向）定义倾斜量，`CenterX`/`CenterY` 定义倾斜轴心。倾斜后平行线仍然平行（仿射变换），矩形会变成平行四边形。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.skewtransform

> [!origin] 由来背景
> 倾斜（Shear）在图形学中是基础仿射变换，常用来制造"透视感"和"速度感"：斜切让图形看起来有方向性、冲击力。WPF 将它与其他 Transform 平级提供，配合滑杆可以实时调节角度。工控界面用它做告警标牌、管道箭头、动效装饰，成本极低——不需要额外素材，一个 SkewTransform 就完成"斜切"设计。

> [!essentials] 核心要点
> - **AngleX vs AngleY**：AngleX 沿水平推歪（矩形变菱形），AngleY 沿垂直推歪
> - **Center 轴心**：`CenterX/CenterY` 控制倾斜"钉住"的点，默认左上角
> - **数值范围**：±45° 内效果自然，过大变形严重可读性差
> - **联动控制**：示例用 Slider 统一驱动两块标牌，注意角度方向相反（`-angle`）
> - **仿射性质**：倾斜后边仍平行，可用平行四边形/箭头等装饰元素

> [!example] 完整示例
> **角度标牌演示：用 SkewTransform 的 AngleX/AngleY 让标牌产生透视倾斜效果，CenterX/CenterY 控制变形轴心：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="倾斜标牌 - SkewTransform" Height="400" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="车间标识牌（斜切效果）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <StackPanel Grid.Row="1" VerticalAlignment="Center">
>             <!-- AngleX 让元素沿 X 方向倾斜 -->
>             <Border Width="240" Height="50" Background="#DA3633" CornerRadius="4"
>                     HorizontalAlignment="Center">
>                 <Border.RenderTransform>
>                     <SkewTransform x:Name="Skew1" AngleX="-20" AngleY="0" CenterX="120" CenterY="25"/>
>                 </Border.RenderTransform>
>                 <TextBlock Text="危险区域" Foreground="White" FontWeight="Bold" FontSize="18"
>                            HorizontalAlignment="Center" VerticalAlignment="Center"/>
>             </Border>
>             <!-- AngleY 让元素沿 Y 方向倾斜 -->
>             <Border Width="240" Height="50" Background="#238636" CornerRadius="4"
>                     HorizontalAlignment="Center" Margin="0,30,0,0">
>                 <Border.RenderTransform>
>                     <SkewTransform x:Name="Skew2" AngleX="0" AngleY="15" CenterX="120" CenterY="25"/>
>                 </Border.RenderTransform>
>                 <TextBlock Text="安全通道" Foreground="White" FontWeight="Bold" FontSize="18"
>                            HorizontalAlignment="Center" VerticalAlignment="Center"/>
>             </Border>
>         </StackPanel>
>         <Slider Grid.Row="2" Minimum="-45" Maximum="45" Value="0" Margin="0,12,0,0"
>                 ValueChanged="OnSkewChanged"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
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
>         // 拖动滑块同时调节两块标牌的倾斜角度
>         private void OnSkewChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             double angle = ((Slider)sender).Value;
>             Skew1.AngleX = angle;
>             Skew2.AngleY = -angle;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 车间标牌/路标：危险、安全等警示牌的斜切设计
> ✅ 告警横幅：报警条斜切增强视觉冲击
> ✅ 动感图标：方向箭头/速度线的倾斜动感
> ✅ 拟透视效果：简单模拟"看向侧面"的透视感
> ✅ 装饰纹理：平行四边形组合拼出几何装饰
> ❌ 需要真实 3D 透视：用 3d-图形入门 的 PerspectiveCamera
> ❌ 需要旋转/缩放/位移：分别用 rotatetransform-旋转 / scaletransform-缩放 / translatetransform-平移

> [!pitfall] 常见踩坑
> 坑 1：**AngleX 与 AngleY 混淆** → 现象：想斜切水平方向却变成垂直方向 → 原因：两个角度作用轴理解反了 → 解决：记住"AngleX 沿水平轴推、元素左右错位；AngleY 沿垂直轴推、元素上下错位"，动手试 ±值确认方向
> 
> 坑 2：**倾斜角度过大导致内容溢出容器** → 现象：标牌文字被截断或跑出边框 → 原因：大角度斜切后元素渲染区域超出原布局范围 → 解决：角度控制在 ±45° 内，并给容器留 Margin；必要时 ClipToBounds 收边
>
> 坑 3：**Center 设置不当使标牌"往一边跑"** → 现象：斜切时标牌整体偏移了 → 原因：CenterX/CenterY 与元素实际中心不符 → 解决：Center 取元素尺寸一半（如宽 240 高 50 则 `CenterX="120" CenterY="25"`），或直接用 RenderTransformOrigin

> [!best] 最佳实践
> - 标牌宽度明显大于高度时效果更自然（宽 240 高 50 的横条），避免正方形斜切变形难看
> - 倾斜是"装饰手法"，配合加粗文字与对比色才能传达警示感（红底白字）
> - 多个标牌联动（如示例 Slider）时统一通过后台代码赋值，避免 XAML 各自硬编码
> - 倾斜元素若参与布局，注意它仍占用原矩形空间，排版时预留余量
> - 需要"平行四边形按钮"时：外层 Grid 加 SkewTransform，内层文字反向倾斜即可保持文字正立

> [!practice] 上手练习
> **Lv.1 运行体验**：运行倾斜标牌示例，拖动滑块，观察两块标牌分别沿 X/Y 方向倾斜
> **Lv.2 动手改造**：新增第三块"注意高温"黄色标牌，AngleY 联动成相反方向，形成对称排列
> **Lv.3 综合实战**：把"危险区域"标牌改成平行四边形按钮（外层斜切、内层文字反向斜切补偿）
> **Lv.4 挑战进阶**：做一个"倾斜告警横幅"——告警时横幅从 0° 动画到 15° 倾斜并闪烁，恢复后归零

> [!related] 相关知识链接
> - ← 前置知识：rotatetransform-旋转 理解 Transform 概念；RenderTransformOrigin 定位
> - → 后续必学：transformgroup-变换组合 把倾斜与其他变换叠加；matrixtransform-矩阵变换 底层原理
> - ⇄ 关联概念：dropshadoweffect-投影 增强标牌立体感；动画基础概念 做倾斜动画
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.skewtransform
