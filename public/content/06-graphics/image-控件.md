---
title: Image 控件
section: 06-graphics
parent: 6.7 图像处理
---

# Image 控件

> [!plain] 白话理解
> Image 控件是 WPF 里"专门展示图片"的控件：一个 `Source` 属性指定图片在哪，一个 `Stretch` 属性决定图片怎么缩放，就完成了产品图、设备照片、监控截图的展示。上位机里它是最常用的"图片容器"——轮播产品图、显示摄像头抓拍、放大工艺图，都靠它。它和 imagebrush-图像画刷 的分工是：Image 是"整张图摆在那"，ImageBrush 是"把图刷进任意形状"。
>
> 类比：Image 是"相框"，框里放什么照片、照片怎么铺满相框，由 Source 和 Stretch 决定。

> [!def] 官方定义
> `System.Windows.Controls.Image` 是 FrameworkElement 派生控件，核心属性 `Source`（`System.Windows.Media.ImageSource`，常为 `BitmapImage` 或 pack URI）指定图片来源，`Stretch`（`Stretch` 枚举：None/Uniform/UniformToFill/Fill）控制缩放模式，`StretchDirection`（`StretchDirection` 枚举：UpOnly/DownOnly/Both）限制缩放方向，`SourceEnded` 事件可监听动画图片播放结束。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.image

> [!origin] 由来背景
> 显示图片是任何 UI 框架的刚需，WPF 把图片封装成独立控件并支持"资源 URI"（pack://）加载，图片作为程序集资源随应用分发，部署无需担心路径丢失。它的 Stretch 缩放模型与 Shape 共用同一套枚举，保证矢量与位图在布局行为上一致。相比 WinForms 的 PictureBox，WPF Image 天然支持高分屏缩放、透明度、变换与数据绑定，是工业界面图片展示的标准容器。

> [!essentials] 核心要点
> - **Source 三来源**：pack URI 资源、文件路径、BitmapImage 对象（可控制解码）
> - **Stretch 缩放**：`Uniform` 完整显示不变形（默认）、`UniformToFill` 铺满裁剪、`Fill` 拉伸变形、`None` 原尺寸
> - **StretchDirection**：`UpOnly` 只放大不缩小、`DownOnly` 只缩小不放大，防止小图被放大糊
> - **动态换图**：`Image.Source = new BitmapImage(...)` 一句切换，适合轮播/状态图
> - **内存注意**：直接给 Source 一个 Uri 会整图解码，大图用 bitmapimage 的 DecodePixelWidth 控制

> [!example] 完整示例
> **产品图切换演示：用 Image 控件展示产品图片，Source 指定图片来源，Stretch 控制缩放，点击按钮在多个产品图间切换：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="产品图 - Image 控件" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="产品展示（Image 控件）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- Image.Source 可以是 pack URI、本地路径或 BitmapImage -->
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <Image x:Name="ProductImage" Stretch="Uniform" Margin="20"
>                    Source="pack://application:,,,/Assets/product.png"/>
>         </Border>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="上一张" Click="OnPrev" Padding="10" Background="#21262D" Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="下一张" Click="OnNext" Padding="10" Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media.Imaging;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly string[] _images =
>         {
>             "pack://application:,,,/Assets/product.png",
>             "pack://application:,,,/Assets/device.png",
>             "pack://application:,,,/Assets/workshop.png"
>         };
>         private int _index;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnPrev(object sender, RoutedEventArgs e)
>         {
>             _index = (_index + _images.Length - 1) % _images.Length;
>             ProductImage.Source = new BitmapImage(new Uri(_images[_index], UriKind.RelativeOrAbsolute));
>         }
>
>         private void OnNext(object sender, RoutedEventArgs e)
>         {
>             _index = (_index + 1) % _images.Length;
>             ProductImage.Source = new BitmapImage(new Uri(_images[_index], UriKind.RelativeOrAbsolute));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 产品图/设备图展示：产品轮播、设备外观图、工艺流程图截图
> ✅ 状态图切换：不同设备状态用不同图片（配合代码切 Source）
> ✅ 照片/缩略图墙：图片列表、图库浏览（注意解码内存）
> ✅ 相机抓拍显示：把摄像头截图赋给 Image.Source
> ✅ 布局中的图片元素：与 Border/Grid 组合排版
> ❌ 把图片刷进任意形状（圆/多边形）：用 imagebrush-图像画刷
> ❌ 高速逐帧画面：用 writeablebitmap-可写入位图 或视频方案

> [!pitfall] 常见踩坑
> 坑 1：**图片路径写错显示空白** → 现象：Image 控件空着，无报错 → 原因：pack URI 拼错或资源 Build Action 不是 Resource → 解决：确认 `pack://application:,,,/Assets/xxx.png` 与实际路径一致，资源文件属性设 Resource
> 
> 坑 2：**大图直接赋值导致内存暴涨/卡顿** → 现象：加载一张 4K 原图后界面卡 → 原因：`Source` 直接给 Uri 会整图解码 → 解决：用 bitmapimage 的 `DecodePixelWidth` 控制解码尺寸，再赋给 Source
>
> 坑 3：**Stretch 选错导致图片变形/裁边** → 现象：产品图被拉扁或边缘被切 → 原因：Fill 拉伸变形、UniformToFill 裁剪 → 解决：等比不裁用 `Uniform`（留白）、铺满用 `UniformToFill`（可裁）、接受变形才用 `Fill`

> [!best] 最佳实践
> - 图片来源统一用资源 pack URI，部署不丢路径；动态图（相机帧）用代码赋 BitmapImage
> - 大图预览一律走 bitmapimage 解码控尺寸，绝不直接 `Source = uri`
> - 产品图固定用 `Stretch="Uniform"` + 固定容器，视觉一致
> - 批量图片（图墙）复用 ImageSource 实例，避免重复解码
> - 需要"图片上叠加文字/按钮"时，用 Grid 把 Image 与 TextBlock 叠放，别用画刷硬拼

> [!practice] 上手练习
> **Lv.1 运行体验**：运行产品图示例，点"上一张/下一张"，观察三张图在固定区域内 Uniform 显示
> **Lv.2 动手改造**：把 Stretch 改成 UniformToFill 观察裁剪效果，再加一个 TextBlock 显示当前图片名称
> **Lv.3 综合实战**：把图片源改成相机目录下的文件（遍历某文件夹的 jpg），实现"本地图库翻页"
> **Lv.4 挑战进阶**：配合 bitmapimage 的 DecodePixelWidth=480 控制解码，并对比"直接赋 Uri"与"控制解码"的内存占用（任务管理器）

> [!related] 相关知识链接
> - ← 前置知识：rectangle-矩形 认识布局容器；bitmapimage 是 Source 背后的解码引擎
> - → 后续必学：writeablebitmap-可写入位图 高速画面；rendertargetbitmap-渲染到位图 画面快照
> - ⇄ 关联概念：imagebrush-图像画刷（图片刷进形状）；第 7 章「什么是数据绑定」绑定图片来源
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.image
