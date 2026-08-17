---
title: BitmapImage
section: 06-graphics
parent: 6.7 图像处理
---

# BitmapImage

> [!plain] 白话理解
> BitmapImage 是"图片的加载引擎"：它负责把一张图片文件/资源**解码**成 WPF 能用的像素数据，而 Image 控件只是"显示框"。为什么要分开？因为解码时可以控制尺寸——`DecodePixelWidth = 320` 就把 4000×3000 的相机原图按宽度 320 解码，内存占用从几十 MB 降到几百 KB。上位机里预览大量监控图片时，这一步是"不卡顿"的关键。
>
> 类比：Image 是"电视"，BitmapImage 是"解码器"。直播流太大时解码器可以降分辨率，电视照样能看。

> [!def] 官方定义
> `System.Windows.Media.Imaging.BitmapImage` 是 `BitmapSource` 的派生类，用于从 `Uri`/`Stream` 解码位图。常用属性：`UriSource`（图片来源）、`DecodePixelWidth`/`DecodePixelHeight`（解码尺寸，等比控制）、`CacheOption`（`BitmapCacheOption.OnLoad` 立即缓存 / `OnDemand` 延迟缓存）、`CreateOptions`（`BitmapCreateOptions.PreservePixelFormat` 等）、`PixelWidth`/`PixelHeight`/`Format`（解码后信息）。构造需在 `BeginInit()` 与 `EndInit()` 之间完成。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.bitmapimage

> [!origin] 由来背景
> WPF 的成像管线（`System.Windows.Media.Imaging`）提供"延迟解码"与"按需解码"能力：不设置 DecodePixelWidth 时，图片会以原始尺寸占内存；设置后按目标尺寸解码。这是 WPF 面对"大量高清图片"（如监控截图、产品原图）时的重要优化手段。Freeze() 冻结后还可跨线程共享，配合 MVVM 在后台线程加载图片而不卡 UI。

> [!essentials] 核心要点
> - **BeginInit/EndInit 配对**：`UriSource`、`DecodePixelWidth` 等必须在两者之间设置
> - **DecodePixelWidth 省内存**：只设宽度即可等比解码，320 预览足够了
> - **Freeze() 冻结**：解码完成后 `Freeze()`，可跨线程共享、渲染更快
> - **CacheOption**：`OnLoad` 立即占内存但访问快；`OnDemand` 懒加载省启动时间
> - **信息来源**：pack URI（资源）、文件 Stream、网络 Uri 均可；Info.Text 可读解码后的实际尺寸

> [!example] 完整示例
> **图片解码演示：用 BitmapImage 从本地文件/资源加载图片，DecodePixelWidth 控制解码尺寸（节省内存），点击按钮重新加载并显示像素信息：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="图片解码 - BitmapImage" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="监控图片解码（BitmapImage）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <Image x:Name="Preview" Stretch="Uniform" Margin="20"/>
>         </Border>
>         <StackPanel Grid.Row="2" Margin="0,12,0,0">
>             <TextBlock x:Name="Info" Foreground="#8B949E" Text="尚未加载图片"/>
>             <Button Content="重新解码加载" Click="OnLoad" Margin="0,8,0,0" Padding="8"
>                     Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO;
> using System.Windows;
> using System.Windows.Media.Imaging;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             OnLoad(this, new RoutedEventArgs());
>         }
>
>         private void OnLoad(object sender, RoutedEventArgs e)
>         {
>             // 1. 构造 BitmapImage
>             var bmp = new BitmapImage();
>             bmp.BeginInit();
>             // 2. 指定图片来源（此处用项目资源，也可改为本地文件路径）
>             bmp.UriSource = new Uri("pack://application:,,,/Assets/camera.png", UriKind.RelativeOrAbsolute);
>             // 3. 关键 API：解码时限制宽度，显著降低内存占用
>             bmp.DecodePixelWidth = 320;
>             bmp.EndInit();
>             bmp.Freeze();   // 冻结后可在多线程/多 UI 间共享
>
>             Preview.Source = bmp;
>             Info.Text = $"解码尺寸：{bmp.PixelWidth} × {bmp.PixelHeight}，格式：{bmp.Format.BitsPerPixel} bpp";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 监控图片预览：多路相机截图解码后显示（DecodePixelWidth 控制内存）
> ✅ 产品原图加载：大图按预览尺寸解码，避免整图占内存
> ✅ 批量图片浏览：图库缩略图统一小尺寸解码
> ✅ 后台线程加载：Freeze() 后跨线程使用（配合第 8 章线程）
> ✅ 网络图片：从 Uri 加载远程图片（注意缓存与安全）
> ❌ 只需要 XAML 静态图片：`Source="pack://..."` 简写足够
> ❌ 需要逐像素绘制：用 writeablebitmap-可写入位图

> [!pitfall] 常见踩坑
> 坑 1：**忘记 BeginInit/EndInit 就赋值** → 现象：运行时报 `InvalidOperationException`"对象已初始化"或属性不生效 → 原因：UriSource/DecodePixelWidth 必须在 BeginInit 与 EndInit 之间设置 → 解决：严格按 `new BitmapImage()` → `BeginInit()` → 设属性 → `EndInit()` 的顺序
> 
> 坑 2：**DecodePixelWidth 设置后仍占用大内存** → 现象：内存没降下来 → 原因：DecodePixelWidth 只在解码时生效，若先解码后设置无效；或 CacheOption 未设 → 解决：在 BeginInit/EndInit 内设 `DecodePixelWidth` 并配合 `CacheOption=OnLoad` 立即释放源文件
>
> 坑 3：**Uri 相对路径解析错误** → 现象：`new Uri("Assets/camera.png", RelativeOrAbsolute)` 报错或加载失败 → 原因：相对 Uri 相对的是当前目录，不是程序集 → 解决：用 `pack://application:,,,/Assets/camera.png` 绝对资源 URI，或 `Path.Combine(目录, 文件)` 构造文件 Uri

> [!best] 最佳实践
> - 预览图统一 `DecodePixelWidth`（如 320/480），需要原图时再单独全尺寸解码
> - 解码完成立即 `Freeze()`，可跨线程共享且渲染更快
> - 图片来源集中成常量/资源，避免字符串散落
> - 批量加载用 `CacheOption.OnLoad` 释放文件句柄，防止文件被占用
> - 动态图片更新频率高时，考虑复用 BitmapImage 或改用 writeablebitmap-可写入位图

> [!practice] 上手练习
> **Lv.1 运行体验**：运行解码示例，点"重新解码加载"，观察图片显示与 Info 文本中的解码尺寸
> **Lv.2 动手改造**：把 DecodePixelWidth 改成 640 再运行，对比 Info 中像素尺寸变化
> **Lv.3 综合实战**：加一个"切换图片源"按钮，从资源切换到本地文件路径（FileStream + BitmapImage），观察两种来源的差异
> **Lv.4 挑战进阶**：做一个"多图预览墙"——用数组加载 8 张图，每张 DecodePixelWidth=160，对比不设解码时的内存占用

> [!related] 相关知识链接
> - ← 前置知识：image-控件 认识 Source；第 8 章「线程与调度」配合后台加载
> - → 后续必学：writeablebitmap-可写入位图 主动写像素；rendertargetbitmap-渲染到位图 界面快照
> - ⇄ 关联概念：imagebrush-图像画刷（ImageSource 的另一种消费方式）；第 7 章绑定驱动图片来源
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.bitmapimage
