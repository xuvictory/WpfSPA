---
title: ImageBrush 图像画刷
section: 06-graphics
parent: 6.4 Brush 画刷
---

# ImageBrush 图像画刷

> [!plain] 白话理解
> ImageBrush 是"用图片当涂料"的画刷：把一张照片/位图"刷"到任何图形或控件表面。它和 image-控件 的区别是——Image 是"图片即控件"，ImageBrush 是"图片即刷子"，可以刷进圆形、多边形、异形区域，还能平铺、拉伸、裁剪。上位机里它常用于：产品缩略图墙、设备照片打底、按钮纹理、圆形头像。
>
> 类比：Image 是"把照片贴在墙上"；ImageBrush 是"把照片裁成拼图刷满墙面"——墙的形状由你定。

> [!def] 官方定义
> `System.Windows.Media.ImageBrush` 继承自 `TileBrush`，用 `ImageSource`（`System.Windows.Media.ImageSource`，常为 `BitmapImage`）提供图像，`Stretch`（None/Uniform/UniformToFill/Fill）控制缩放，`AlignmentX/AlignmentY` 控制对齐，`Viewbox`/`Viewport` 与 `TileMode` 控制显示区域与平铺方式。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imagebrush

> [!origin] 由来背景
> 图形学里"纹理贴图"是给 3D 表面覆盖图片的标准手段，WPF 把这一能力下放到 2D：ImageBrush 让任何 UIElement/Shape 都能"贴纹理"。它源于对 WinForms 时代"只能矩形控件放图"的突破——想要圆形产品图、异形按钮图？一个 ImageBrush 就解决，无需再叠一层 Image 裁剪。`TileMode` 平铺则让小幅纹理自动铺满大面积区域，省内存。

> [!essentials] 核心要点
> - **ImageSource 来源**：BitmapImage + pack URI、文件路径、网络 URL、程序集资源
> - **Stretch 四态**：Uniform 等比完整 / UniformToFill 等比裁剪 / Fill 拉伸变形 / None 原尺寸
> - **平铺能力**：`TileMode="Tile"` + Viewport 把图片铺满，适合纹理/底纹
> - **Viewbox 裁剪**：只取图片局部做"图片窗"，配合 Stretch 精确控制显示区域
> - **与 Image 控件分工**：仅显示一张图用 image-控件；把图"刷"进图形/异形区域用 ImageBrush

> [!example] 完整示例
> **产品图片展示演示：用 ImageBrush 将 BitmapImage 作为 Shape/控件背景，Viewbox 控制贴图区域，Stretch 控制缩放方式：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="产品图墙 - ImageBrush" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="产品图片墙（ImageBrush）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- ImageSource 指定图片来源，Stretch 控制图片在容器中的缩放 -->
>         <UniformGrid Grid.Row="1" Columns="2" Margin="0,10,0,0">
>             <Rectangle x:Name="Pic1" Width="190" Height="140" Margin="6" RadiusX="6" RadiusY="6"
>                        Stroke="#30363D" StrokeThickness="2">
>                 <Rectangle.Fill>
>                     <ImageBrush x:Name="Brush1" Stretch="UniformToFill"
>                                 ImageSource="pack://application:,,,/Assets/product.png"/>
>                 </Rectangle.Fill>
>             </Rectangle>
>             <Rectangle Width="190" Height="140" Margin="6" RadiusX="6" RadiusY="6"
>                        Stroke="#30363D" StrokeThickness="2">
>                 <Rectangle.Fill>
>                     <ImageBrush ImageSource="pack://application:,,,/Assets/product.png"
>                                 Stretch="Fill" Opacity="0.8"/>
>                 </Rectangle.Fill>
>             </Rectangle>
>             <Rectangle Width="190" Height="140" Margin="6" RadiusX="6" RadiusY="6"
>                        Stroke="#30363D" StrokeThickness="2">
>                 <Rectangle.Fill>
>                     <ImageBrush ImageSource="pack://application:,,,/Assets/product.png"
>                                 Stretch="None" AlignmentX="Left" AlignmentY="Top"/>
>                 </Rectangle.Fill>
>             </Rectangle>
>             <Rectangle Width="190" Height="140" Margin="6" RadiusX="6" RadiusY="6"
>                        Stroke="#30363D" StrokeThickness="2">
>                 <Rectangle.Fill>
>                     <ImageBrush ImageSource="pack://application:,,,/Assets/product.png"
>                                 Stretch="Uniform"/>
>                 </Rectangle.Fill>
>             </Rectangle>
>         </UniformGrid>
>         <TextBlock Grid.Row="2" Foreground="#8B949E" Margin="0,12,0,0"
>                    Text="注：运行前请在项目 Assets 目录放置 product.png 图片"/>
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
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 产品图墙/图库：Rectangle + ImageBrush 做圆角产品缩略图
> ✅ 异形贴图：把图片刷进圆形、多边形、心形等任意图形区域
> ✅ 纹理底纹：`TileMode="Tile"` 平铺小幅纹理铺满面板
> ✅ 按钮质感：给按钮 Fill 刷渐晕背景图（比纯色高级）
> ✅ 视频/相机画面：ImageSource 指向视频帧或摄像头图像流
> ❌ 需要交互/独立布局的一张图：直接用 image-控件
> ❌ 需要实时像素处理：用 writeablebitmap-可写入位图

> [!pitfall] 常见踩坑
> 坑 1：**图片加载不出来（空白）** → 现象：Rectangle 有边框但内部空白 → 原因：pack URI 写错、资源未设为 `Resource` 生成操作、路径不存在 → 解决：确认图片文件在项目 Assets 且 Build Action=Resource，URI 用 `pack://application:,,,/Assets/xxx.png`
> 
> 坑 2：**Stretch 理解错误导致图片变形** → 现象：图片被拉扁/裁掉 → 原因：`Fill` 会拉伸变形，`UniformToFill` 会裁剪 → 解决：按需求选择——正方形图墙用 UniformToFill（铺满但裁边）、保留完整图用 Uniform（留白）
>
> 坑 3：**同一图片创建多个画刷浪费内存** → 现象：大量缩略图卡顿 → 原因：每张图 new 多个 ImageBrush/BitmapImage → 解决：BitmapImage 可共享（多个 ImageBrush 引用同一 ImageSource），图片解码用 `CacheOption.OnLoad` 控制缓存

> [!best] 最佳实践
> - 图片资源统一放 Assets 目录并设 Build Action=Resource，路径用 pack URI 保证部署后可访问
> - 大批量图墙共用一个 ImageSource 实例，只创建不同的 ImageBrush 引用它
> - 圆角图片优先 Rectangle + RadiusX/Y + ImageBrush，比 Image 叠裁剪层更轻
> - 固定尺寸图墙用 `Stretch="UniformToFill"` 保证铺满不拉伸变形
> - 相机/视频帧动态图用 ImageSource 定时更新，配 ImageBrush 可刷进异形窗口

> [!practice] 上手练习
> **Lv.1 运行体验**：放置一张 product.png 到 Assets 目录后运行，对比 4 种 Stretch 的贴图差异
> **Lv.2 动手改造**：把第 1 个矩形改成 Ellipse（圆形产品图），再给第 2 个加 `TileMode="Tile"` 平铺观察
> **Lv.3 综合实战**：用 ImageBrush + 多边形 Polygon 做一张"圆形/菱形徽章图"，图片裁进异形区域
> **Lv.4 挑战进阶**：用 `Viewbox` 属性实现"图片裁剪窗"——只显示图片的左上 1/4 区域，并随按钮切换裁剪区域

> [!related] 相关知识链接
> - ← 前置知识：rectangle-矩形 认识 Fill；ellipse-椭圆 做圆形贴图
> - → 后续必学：visualbrush-可视画刷（用界面元素当画刷）；上位机画刷应用 综合运用
> - ⇄ 关联概念：bitmapimage 深入解码与缓存；image-控件 分工对比；第 7 章绑定驱动图片来源
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imagebrush
