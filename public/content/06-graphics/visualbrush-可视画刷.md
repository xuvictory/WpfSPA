---
title: VisualBrush 可视画刷
section: 06-graphics
parent: 6.4 Brush 画刷
---

# VisualBrush 可视画刷

> [!plain] 白话理解
> VisualBrush 是"拿一个现成的界面元素当涂料"：把仪表盘、按钮、图标等任意 UIElement 当作画刷的"内容"，刷到另一个图形上。最经典的用途是**倒影/镜像**——把源元素上下翻转刷出来，再调低透明度，就成了水面上/镜面上的倒影。它和 imagebrush-图像画刷 的区别是：ImageBrush 刷"图片文件"，VisualBrush 刷"活的界面"。
>
> 类比：VisualBrush 像是"盖章机"——把任意印章（界面元素）盖到任何地方，印章上有什么，盖出来就是什么。

> [!def] 官方定义
> `System.Windows.Media.VisualBrush` 继承自 `TileBrush`，`Visual` 属性（`System.Windows.Media.Visual`）指定要引用的界面元素，`Stretch`/`AlignmentX`/`AlignmentY`/`Viewbox`/`Viewport`/`TileMode` 控制显示与平铺。源 Visual 内容变化时，画刷会自动同步更新（"活"的画刷）。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.visualbrush

> [!origin] 由来背景
> 反射（Reflection）是工业界面和媒体界面提升质感的重要手段，但传统做法要么截图、要么再渲染一份，成本高且不同步。WPF 的 VisualBrush 让"任意 Visual 可被当作画笔内容"，渲染引擎直接引用源元素，无需复制数据——源变了画刷自动跟着变。这使它成为倒影、镜像、水印、以及"玻璃质感"等效果的极简实现路径。

> [!essentials] 核心要点
> - **Visual 属性**：指定源元素（`Visual="{Binding ElementName=GaugeHost}"` 或 x:Name 引用）
> - **"活"画刷**：源元素内容变化，画刷同步更新，适合做动态倒影
> - **配合变换**：ScaleTransform ScaleY=-1 实现上下翻转，是倒影的标准手法
> - **透明与淡出**：画刷所在矩形设 Opacity 或渐变蒙版，倒影更自然
> - **性能注意**：源元素越复杂，每次更新开销越大；静止内容考虑只渲一次

> [!example] 完整示例
> **仪表盘倒影演示：用 VisualBrush 以仪表盘 Visual 为画刷实现镜面倒影，TileMode 控制平铺方式，Opacity 调节倒影透明度：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="仪表倒影 - VisualBrush" Height="480" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="仪表盘倒影（VisualBrush）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <StackPanel Grid.Row="1" Margin="0,10,0,0">
>             <!-- 被复制的源 Visual：仪表盘 -->
>             <Grid x:Name="GaugeHost" Height="160">
>                 <Ellipse Width="150" Height="150" Fill="#161B22" Stroke="#30363D" StrokeThickness="4"
>                          HorizontalAlignment="Center"/>
>                 <TextBlock Text="66.6" Foreground="#58A6FF" FontSize="28"
>                            HorizontalAlignment="Center" VerticalAlignment="Center"/>
>             </Grid>
>             <!-- 倒影：用 VisualBrush 引用 GaugeHost，上下翻转 -->
>             <Rectangle Height="80" Opacity="0.35" Margin="0,4,0,0">
>                 <Rectangle.Fill>
>                     <VisualBrush Stretch="None" AlignmentX="Center" AlignmentY="Top">
>                         <VisualBrush.Visual>
>                             <Border Width="150" Height="150">
>                                 <Border.RenderTransform>
>                                     <ScaleTransform ScaleY="-1" ScaleX="1"/>
>                                 </Border.RenderTransform>
>                                 <Border.Background>
>                                     <VisualBrush Visual="{Binding ElementName=GaugeHost}"/>
>                                 </Border.Background>
>                             </Border>
>                         </VisualBrush.Visual>
>                     </VisualBrush>
>                 </Rectangle.Fill>
>             </Rectangle>
>         </StackPanel>
>         <TextBlock Grid.Row="2" Foreground="#8B949E" Margin="0,12,0,0"
>                    Text="提示：VisualBrush 可把任意 UIElement 当画刷使用，适合做倒影、水印"/>
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
> ✅ 仪表/设备倒影：把仪表盘、状态灯做镜面反射，提升看板质感
> ✅ 水印/标志：把 Logo、公司标志以半透明画刷平铺到整个界面
> ✅ 按钮镜像：操作按钮下方做淡色倒影，增强可点击提示
> ✅ 玻璃质感：用 VisualBrush 复制周边内容做半透明蒙层
> ✅ 画中画：把另一区域内容"刷"进小窗口（如监控画面缩略）
> ❌ 只需要图片纹理：用 imagebrush-图像画刷 更省
> ❌ 源元素频繁变化且复杂：实时同步开销大，考虑只渲一帧再贴图

> [!pitfall] 常见踩坑
> 坑 1：**倒影没有"倒过来"** → 现象：倒影和原件方向一样，看不出镜像 → 原因：忘了对源元素做 `ScaleTransform ScaleY="-1"` 翻转 → 解决：在 VisualBrush 内的容器上设置翻转变换，并让画刷 `Stretch="None"` + 对齐
> 
> 坑 2：**源元素不可见导致倒影空白** → 现象：倒影区域一片空白 → 原因：源元素视觉树尚未布局完成，或 Visual 属性引用失败 → 解决：在 `Loaded` 事件后再设 Visual，或用 `{Binding ElementName=...}` 绑定而非代码赋值
>
> 坑 3：**倒影出现重影/错位** → 现象：倒影边缘与原件不对齐 → 原因：容器尺寸、Margin、对齐方式与源不一致 → 解决：倒影矩形的 Width/Height、Alignment 与源元素保持一致，用统一布局参数

> [!best] 最佳实践
> - 倒影标准模板：源元素 → 外层容器 ScaleY=-1 → VisualBrush → 矩形 + Opacity 0.3~0.4
> - 源元素加 `x:Name`，用 Binding ElementName 引用，避免在代码里拼 Visual
> - 倒影矩形高度取源高度的 40%-50%，底部加渐变蒙版过渡更自然
> - 静止内容的倒影做成一次性（源不变化就不需要实时同步），减少渲染开销
> - 与 OpacityMask（线性渐变）配合做"渐隐倒影"，是高端看板的标配

> [!practice] 上手练习
> **Lv.1 运行体验**：运行仪表倒影示例，观察仪表盘上下镜像 + 半透明效果
> **Lv.2 动手改造**：把倒影透明度从 0.35 改成 0.6，再给倒影矩形加 OpacityMask 渐变实现"渐隐"
> **Lv.3 综合实战**：给"启动"按钮加一个倒影（参照上位机画刷应用 的按钮镜像思路），随按钮状态变色
> **Lv.4 挑战进阶**：做"画中画"——用 VisualBrush 把页面左侧监控区内容刷进右下角小窗，验证源内容变化画刷自动同步

> [!related] 相关知识链接
> - ← 前置知识：scaletransform-缩放（ScaleY=-1 翻转）、imagebrush-图像画刷（同类画刷）
> - → 后续必学：dropshadoweffect-投影 叠加立体感；上位机画刷应用 综合看板
> - ⇄ 关联概念：opacitymask 蒙版（渐隐）；第 7 章「什么是数据绑定」驱动源元素内容
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.visualbrush
