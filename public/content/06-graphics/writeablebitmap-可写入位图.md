---
title: WriteableBitmap 可写入位图
section: 06-graphics
parent: 6.7 图像处理
---

# WriteableBitmap 可写入位图

> [!plain] 白话理解
> 前面用 Shape/Polyline 画波形，元素一多就会卡；WriteableBitmap 是"**直接往像素缓冲区里涂色**"的位图：一个 `WritePixels` 调用把整帧数据塞进去，界面立即刷新。它像示波器的显像管——不管波形多复杂，本质就是"每个像素点什么色"。这是上位机高速波形、视频帧、实时图像的最终性能方案。
>
> 类比：Shape 是"请画家画"，WriteableBitmap 是"自己拿喷枪喷"。喷枪（写像素）够快，但得自己算好每一喷。

> [!def] 官方定义
> `System.Windows.Media.Imaging.WriteableBitmap` 是 `BitmapSource` 派生类，允许直接写入像素数据。核心方法 `WritePixels(Int32Rect sourceRect, Array pixels, int stride, int offset)`：`sourceRect` 定义写入区域，`pixels` 是 BGRA 字节数组，`stride`（每行字节数 = 宽 × 4）告诉 WPF 每行跨度。构造时指定宽高、DPI 与像素格式（常用 `PixelFormats.Bgra32`）。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.writeablebitmap

> [!origin] 由来背景
> WPF 的 Shape 体系是"声明式"的——元素越多渲染开销越大，每秒刷新上千条曲线会卡。WriteableBitmap 提供"命令式"像素通道：开发者直接操作内存缓冲区，再一次性提交给 GPU。这是 WPF 为"高性能数据可视化"预留的后门，适合波形、视频帧、热力图等"每帧都在变"的场景。它与保留模式互补：静态复杂图形用 Shape，动态高频画面用 WriteableBitmap。

> [!essentials] 核心要点
> - **BGRA 布局**：像素数组按 B、G、R、A 顺序排列，写错通道颜色就偏
> - **stride 步长**：`stride = 宽度 × 4`（每像素 4 字节），`WritePixels` 第三个参数必须是它
> - **清屏再画**：每帧先 `Array.Clear` 清空缓冲，再写新波形，否则残留残影
> - **WritePixels 一次性提交**：整幅缓冲填好再调一次，比多次小区域写入快
> - **与 Shape 分工**：静态/少量图形用 Shape；高频逐帧刷新用 WriteableBitmap（30FPS 示例）

> [!example] 完整示例
> **像素级示波器演示：用 WriteableBitmap 直接操作像素缓冲区（WritePixels），实时绘制波形，体现高速逐帧更新的能力：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="示波器 - WriteableBitmap" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="虚拟示波器（WritePixels）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 后台代码通过 WriteableBitmap 直接写像素 -->
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <Image x:Name="ScopeImage" Stretch="Fill" Margin="5"/>
>         </Border>
>         <Button Grid.Row="2" Content="开始 / 暂停" Click="OnToggle" Margin="0,12,0,0"
>                 Padding="8" Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Media.Imaging;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private const int W = 480, H = 260;
>         private readonly byte[] _pixels = new byte[W * H * 4];  // BGRA 像素缓冲
>         private readonly WriteableBitmap _bmp = new WriteableBitmap(W, H, 96, 96, PixelFormats.Bgra32, null);
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private int _phase;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             ScopeImage.Source = _bmp;
>             _timer.Interval = TimeSpan.FromMilliseconds(33);    // ~30 FPS
>             _timer.Tick += OnTick;
>         }
>
>         private void OnToggle(object sender, RoutedEventArgs e)
>         {
>             if (_timer.IsEnabled) _timer.Stop(); else _timer.Start();
>         }
>
>         // 每帧清空画布并逐像素绘制正弦波
>         private void OnTick(object sender, EventArgs e)
>         {
>             Array.Clear(_pixels, 0, _pixels.Length);            // 1. 清屏（黑色）
>             for (int x = 0; x < W; x++)
>             {
>                 double y = H / 2 + Math.Sin((x + _phase) * 0.06) * 60;
>                 int py = (int)y;
>                 if (py >= 0 && py < H)
>                 {
>                     int i = (py * W + x) * 4;
>                     _pixels[i] = 0xFF;       // B
>                     _pixels[i + 1] = 0xA6;   // G
>                     _pixels[i + 2] = 0x58;   // R
>                     _pixels[i + 3] = 0xFF;   // A
>                 }
>             }
>             _phase = (_phase + 3) % W;
>             // 2. 整幅写入位图并立即刷新
>             _bmp.WritePixels(new Int32Rect(0, 0, W, H), _pixels, W * 4, 0);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 高速波形/示波器：每秒 30-60 帧逐像素绘制信号波形
> ✅ 视频帧显示：相机/视频流每帧 WritePixels 上屏
> ✅ 热力图/矩阵数据：颜色映射数据矩阵直接写像素
> ✅ 动态水位/料位填充：按百分比填充区域（逐行算像素）
> ✅ 自定义光标/覆盖层：逐像素绘制十字线、测量标尺
> ❌ 静态图形/少量元素：用 Shape/Polyline 更简洁
> ❌ 需要矢量缩放/交互（点击图形）：WriteableBitmap 是纯像素，无命中测试

> [!pitfall] 常见踩坑
> 坑 1：**像素通道顺序写错（颜色偏色）** → 现象：蓝色波形显示成红色 → 原因：WriteableBitmap 是 **BGRA**（蓝绿红α）顺序，不是 RGB → 解决：`_pixels[i]=B; [i+1]=G; [i+2]=R; [i+3]=A`，对照示例顺序写
> 
> 坑 2：**stride 算错导致画面"斜切/错位"** → 现象：波形被斜着切成两半 → 原因：`stride` 传错（每行字节数必须 = 宽 × 4） → 解决：`WritePixels(rect, _pixels, W * 4, 0)`，W*4 就是 stride
>
> 坑 3：**只写部分区域不清屏出现残影** → 现象：旧波形残留拖尾 → 原因：新帧没覆盖全部像素，旧数据残留 → 解决：每帧先 `Array.Clear(_pixels, ...)` 清空再画，或只绘制变化区域并主动擦除旧区

> [!best] 最佳实践
> - 像素缓冲用固定数组复用，别每帧 new，减少 GC 压力
> - 整帧更新用一次 WritePixels 提交，别拆成多次小写入
> - 波形先算好所有 y 值再统一填像素，避免在循环里做复杂计算
> - 需要交互（点击波形取坐标）时，用鼠标坐标反算数据坐标（x→数据索引），别依赖图形命中
> - 固定背景（网格）可先画好再叠加动态内容，或分层位图

> [!practice] 上手练习
> **Lv.1 运行体验**：运行示波器示例，点"开始/暂停"，观察 30FPS 的正弦波逐帧刷新
> **Lv.2 动手改造**：把波形从正弦改成三角波（`Math.Abs(...)` 计算），并改成黄色 #FFD33D
> **Lv.3 综合实战**：加一条"参考阈值线"——每帧在 y=80 处画一条水平虚线（每隔 4 像素写一点）
> **Lv.4 挑战进阶**：把波形数据改为从随机数组模拟 PLC 采集，实现"滚动波形"（新数据顶掉旧数据），并增加滚动平均平滑

> [!related] 相关知识链接
> - ← 前置知识：bitmapimage 理解解码与位图；第 8 章「线程与调度」DispatcherTimer 驱动
> - → 后续必学：rendertargetbitmap-渲染到位图 画面快照；2d-绘图综合 对比 Shape 方案
> - ⇄ 关联概念：polyline-折线（低频波形方案对比）；第 7 章「什么是数据绑定」数据源解耦
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.writeablebitmap
