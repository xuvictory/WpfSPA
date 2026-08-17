---
title: RenderTargetBitmap 渲染到位图
section: 06-graphics
parent: 6.7 图像处理
---

# RenderTargetBitmap 渲染到位图

> [!plain] 白话理解
> RenderTargetBitmap 是"**给界面拍快照**"：把任意一个界面元素（看板、报表、曲线图）整个渲染成一张位图，然后可以显示、保存为 PNG、或放进报表。上位机里最典型的场景是"生产报表快照"——把当前产线日报画面截成图片存档。它和 WriteableBitmap 相反：WriteableBitmap 是"你画像素"，RenderTargetBitmap 是"把现成的界面变成像素"。
>
> 类比：RenderTargetBitmap 是"截屏相机"，对准任何一个窗口（UIElement）按下快门，就得到一张照片。

> [!def] 官方定义
> `System.Windows.Media.Imaging.RenderTargetBitmap` 继承自 `BitmapSource`，构造参数（像素宽、像素高、DPI X、DPI Y、像素格式，常用 `PixelFormats.Pbgra32`）。核心方法 `Render(Visual visual)` 把 `Visual` 子树渲染为位图。渲染前通常需先 `Measure`/`Arrange`/`UpdateLayout` 确保源元素有实际尺寸。可用 `PngBitmapEncoder` 等编码保存。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.rendertargetbitmap

> [!origin] 由来背景
> 数据报表、审计留痕、远程查看都需要"把当前画面固化成图片"。WinForms 时代用 `DrawToBitmap`，WPF 则提供 RenderTargetBitmap：基于 Visual 树渲染管线，一次 Render 就能把任意复杂度界面转成位图。它直接复用引擎的渲染能力（含特效、变换、透明），无需开发者手工重绘；配合 PngBitmapEncoder 可导出 PNG 存档，是上位机"快照/报表/留档"功能的标准实现。

> [!essentials] 核心要点
> - **Render(Visual)**：传 `UIElement`/`Visual` 即渲染整个子树（含特效与变换）
> - **先布局再渲染**：`Measure → Arrange → UpdateLayout` 三连，否则快照可能空白
> - **像素尺寸独立**：构造时的宽高决定快照分辨率，可与屏幕实际尺寸不同（如 2× 导出）
> - **编码导出**：`PngBitmapEncoder` + `BitmapFrame.Create(rtb)` 存 PNG/JPG
> - **应用场景**：报表快照、曲线留档、缩略图生成、远程画面传输

> [!example] 完整示例
> **画面快照演示：用 RenderTargetBitmap 把任意 UIElement 渲染成位图，实现报表截图/曲线快照，点击按钮生成并保存快照：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="画面快照 - RenderTargetBitmap" Height="460" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="生产报表快照" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 被快照的源画面 -->
>         <Grid x:Name="SnapshotSource" Grid.Row="1" Margin="0,10,0,0" Background="#161B22"
>               Width="420" Height="240" ClipToBounds="True">
>             <StackPanel Margin="15">
>                 <TextBlock Text="产线日报" Foreground="#58A6FF" FontSize="15" FontWeight="Bold"/>
>                 <Rectangle Height="70" Margin="0,8,0,0" Fill="#21262D" RadiusX="4" RadiusY="4">
>                     <Rectangle.Fill>
>                         <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
>                             <GradientStop Color="#0D419D" Offset="0"/>
>                             <GradientStop Color="#58A6FF" Offset="1"/>
>                         </LinearGradientBrush>
>                     </Rectangle.Fill>
>                 </Rectangle>
>                 <TextBlock x:Name="SnapText" Text="产量：1250 件 / 合格率：98.6%" Foreground="#8B949E"
>                            Margin="0,10,0,0"/>
>             </StackPanel>
>         </Grid>
>         <!-- 快照预览区 -->
>         <Border Grid.Row="2" Margin="0,12,0,0" Height="120" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <Image x:Name="SnapshotPreview" Stretch="Uniform"/>
>         </Border>
>         <Button Grid.Row="2" Content="生成快照" Click="OnCapture" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Right" VerticalAlignment="Bottom"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.IO;
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Media.Imaging;
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
>         // 把 SnapshotSource 渲染成位图并显示到预览区
>         private void OnCapture(object sender, RoutedEventArgs e)
>         {
>             // 1. 按目标尺寸创建 RenderTargetBitmap
>             var rtb = new RenderTargetBitmap(420, 240, 96, 96, PixelFormats.Pbgra32);
>             // 2. 渲染 UIElement（需先 Measure/Arrange 保证有实际尺寸）
>             SnapshotSource.Measure(new Size(420, 240));
>             SnapshotSource.Arrange(new Rect(0, 0, 420, 240));
>             SnapshotSource.UpdateLayout();
>             rtb.Render(SnapshotSource);
>             SnapshotPreview.Source = rtb;
>
>             // 3. 可选：编码为 PNG 保存
>             var encoder = new PngBitmapEncoder();
>             encoder.Frames.Add(BitmapFrame.Create(rtb));
>             using (var fs = File.Create("snapshot.png"))
>             {
>                 encoder.Save(fs);
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 生产报表快照：把产线日报/曲线图截成 PNG 存档或打印
> ✅ 审计留痕：操作界面定期截图留档，追溯问题
> ✅ 缩略图生成：为大批量界面/图纸生成统一缩略图
> ✅ 远程查看：把画面快照推送到远程监控端
> ✅ 导出图片：看板/仪表盘导出分享
> ❌ 需要实时逐帧画面：用 writeablebitmap-可写入位图
> ❌ 需要保留矢量可编辑性：快照是像素图，无法再编辑

> [!pitfall] 常见踩坑
> 坑 1：**快照空白/只有背景色** → 现象：生成的图是空白的或缺少内容 → 原因：源元素没 Measure/Arrange，无实际尺寸就 Render → 解决：`Measure(new Size(w,h))` → `Arrange(new Rect(...))` → `UpdateLayout()` 三连后再 Render（示例已示范）
> 
> 坑 2：**快照分辨率模糊** → 现象：导出图片发虚 → 原因：RenderTargetBitmap 像素尺寸太小（用屏幕尺寸但 DPI 低） → 解决：需要高清导出时按倍数放大构造尺寸（如 2× 尺寸、192 DPI），再 Stretch 缩小显示
>
> 坑 3：**保存文件被占用/路径错误** → 现象：`File.Create("snapshot.png")` 抛 IO 异常 → 原因：文件已存在被占用、或相对路径不在预期目录 → 解决：先 `File.Delete` 或唯一文件名（时间戳），保存路径用绝对路径并记录

> [!best] 最佳实践
> - 快照统一封装成方法（`BitmapSource Capture(UIElement e, int w, int h)`），供报表/留档复用
> - 布局三连（Measure/Arrange/UpdateLayout）是 Render 的前置纪律，写进封装方法
> - 高清导出用"2× 尺寸 + 96→192 DPI"的套路，保证清晰度
> - 保存文件用时间戳命名防覆盖，保存后提示路径（可加到界面）
> - 大批量生成缩略图时在后台线程做（需 Freeze 位图），避免卡 UI

> [!practice] 上手练习
> **Lv.1 运行体验**：运行快照示例，点"生成快照"，观察 SnapshotSource 渲染到下方预览区
> **Lv.2 动手改造**：在 SnapshotSource 里加一个实时时钟（DispatcherTimer 显示时间），快照时时间也一并截入
> **Lv.3 综合实战**：把快照尺寸改成 840×480（2×），导出到带时间戳的文件名，并显示保存路径
> **Lv.4 挑战进阶**：做一个"批量报表导出"——循环 3 个不同的模拟报表页面，各自生成 PNG 存到指定目录

> [!related] 相关知识链接
> - ← 前置知识：bitmapimage 理解位图体系；第 5 章「什么是样式」报表样式统一
> - → 后续必学：2d-绘图综合 综合看板；writeablebitmap-可写入位图 对比"写像素 vs 拍快照"
> - ⇄ 关联概念：第 8 章「线程与调度」后台生成快照；第 7 章「什么是数据绑定」报表数据驱动
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.imaging.rendertargetbitmap
