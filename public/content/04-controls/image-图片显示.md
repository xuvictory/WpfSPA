---
title: Image 图片显示
section: 04-controls
parent: 4.6 日期与信息显示控件
---

# Image 图片显示

> [!plain] 白话理解
> 设备照片、状态指示灯、工艺流程图——上位机界面离不开图片。`Image` 控件负责"把一张图放进界面"，`Source` 属性决定显示哪张图，`Stretch` 决定图片怎么适配容器。
> 三个关键点：**Source 来源**可以是项目内相对路径、`pack://` 资源路径或绝对路径；**Stretch 模式**——`Uniform` 等比缩放不变形（最常用）、`Fill` 拉伸铺满可能变形、`None` 原尺寸；**代码换图**——运行时重新给 `Source` 赋 `BitmapImage` 即可（状态灯绿↔红切换就是典型场景）。

> [!def] 官方定义
> Image 是 WPF 中用于"显示图片"的元素，位于 `System.Windows.Controls` 命名空间。核心属性 `Source`（`ImageSource`，常用 `BitmapImage` 加载位图，也可用 DrawingImage/视觉对象）、`Stretch`（`None`/`Uniform`/`Fill`/`UniformToFill`，控制图片缩放方式）、`StretchDirection`（缩放方向）。`BitmapImage` 可通过文件路径、URI（`pack://application:,,,/`）或字节流构造，并支持缓存策略（`CacheOption`）与解码尺寸（`DecodePixelWidth`）。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.image

> [!origin] 由来背景
> 图形界面从诞生起就需要图片，但 WinForms 的 PictureBox 在缩放质量、资源加载、内存管理上都很粗糙：大图缩放卡顿、频繁换图内存暴涨、透明与动画支持弱。WPF 的 Image 建立在新一代影像管线之上：`Stretch` 提供高质量缩放（Uniform 等比、UniformToFill 裁切填充），`BitmapImage` 支持 URI、流、内存三种加载，配合 `CacheOption` 控制解码缓存、`DecodePixelWidth` 控制解码尺寸。上位机的"设备照片墙""状态灯切换""工艺图缩放"都能流畅完成，且换图时通过 `Freeze()` 还能进一步优化性能。

> [!essentials] 核心要点
> - **Source 加载方式**：相对路径（`assets/a.png`）或 `pack://application:,,,/assets/a.png` 资源路径
> - **Stretch 模式**：`Uniform` 等比（默认）、`Fill` 铺满变形、`UniformToFill` 裁切填满、`None` 原尺寸
> - **代码换图**：`img.Source = new BitmapImage(new Uri(...))` 动态切换
> - **DecodePixelWidth 控制内存**：大图先解码成小尺寸，避免加载原始分辨率占满内存
> - **CacheOption 缓存**：同一 URI 复用缓存，重复显示不重复解码
> - **Freeze 优化**：静态图片 `Freeze()` 后跨线程/高频渲染更安全高效

> [!example] 完整示例
> **设备照片与状态图演示：Source 多种来源、Stretch 缩放模式、代码动态切换图片：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="图片显示 - Image" Height="480" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="设备图片（Stretch=Uniform 等比缩放）：" Foreground="White"/>
>         <!-- 直接引用图片资源；Uniform 保持比例、Fill 拉伸铺满 -->
>         <Image x:Name="imgDevice" Source="assets/device.png"
>                Stretch="Uniform" Height="200" Margin="0,6,0,12"
>                Background="#161B22"/>
>
>         <TextBlock Text="状态指示灯：" Foreground="White"/>
>         <Image x:Name="imgStatus" Width="24" Height="24"
>                Stretch="Uniform" HorizontalAlignment="Left"
>                Source="assets/green.png" Margin="0,4,0,12"/>
>
>         <Button Content="切换运行状态" Click="OnToggleStatus" Padding="8"
>                 HorizontalAlignment="Left" Background="#21262D" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Media.Imaging;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private bool _running = true;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnToggleStatus(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             // 代码中动态更换图片来源（注意清理旧 BitmapImage 避免句柄泄漏）
>             var uri = new System.Uri(_running
>                 ? "pack://application:,,,/assets/green.png"
>                 : "pack://application:,,,/assets/red.png");
>             imgStatus.Source = new BitmapImage(uri);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备照片/产品图：档案面板展示设备外观
> ✅ 状态指示灯：绿色/红色小图随运行状态切换（示例场景）
> ✅ 工艺流程图：大幅工艺图缩放查看
> ✅ 背景图/Logo：品牌与界面装饰
> ❌ 需要交互式绘制/标注（用「inkcanvas-手写画布」）
> ❌ 需要矢量图标随主题换色（用 `Path`/`Geometry`，见「图标按钮实现」）

> [!pitfall] 常见踩坑
> 坑 1：**图片不显示（空白）** → Image 占位但无图。原因：路径错误或资源未包含。解决：确认文件 Build Action 为 `Resource` 且路径正确（`assets/device.png` 或 `pack://` 形式）
>
> 坑 2：**大图加载卡顿/内存暴涨** → 打开一张 5000×4000 的设备照片界面卡死。原因：解码了原始分辨率。解决：`BitmapImage.DecodePixelWidth = 500`，让 WPF 只解码显示所需尺寸
>
> 坑 3：**图片变形** → 方形图被拉成长条。原因：`Stretch="Fill"`。解决：用 `Uniform`（等比）或 `UniformToFill`（裁切填满）
>
> 坑 4：**频繁换图句柄泄漏** → 内存只增不减。原因：旧 `BitmapImage` 未释放。解决：换图时先 `BitmapCacheOption.OnLoad` 并 `Freeze()`，旧引用置空让 GC 回收

> [!best] 最佳实践
> - 界面图片资源统一放 `assets/` 并设 Build Action=Resource，用 `pack://application:,,,/` 引用
> - 大图（>1000px）一律设 `DecodePixelWidth`，内存占用可降 90%
> - 固定尺寸容器用 `Uniform`，避免图片变形；`UniformToFill` 用于封面裁切
> - 状态切换图提前加载并 `Freeze()` 复用，别每次 new BitmapImage
> - 图片路径用常量/资源字典管理，别在代码里散落字符串

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"切换运行状态"观察绿色/红色状态灯切换
> **Lv.2 小试牛刀**：把 `Stretch` 从 `Uniform` 改成 `Fill`，加载一张非等比图片观察变形效果
> **Lv.3 融会贯通**：实现"设备图片查看器"：Image + 缩放按钮（`ScaleTransform`），支持放大/缩小/复位
> **Lv.4 挑战**：实现"缩略图列表"：10 张大图用 `DecodePixelWidth=100` 生成缩略图网格，切换查看大图（验证内存优化效果）

> [!related] 相关知识链接
> - ← 前置知识：「button-按钮」了解按钮内嵌图片图标；「contentcontrol-内容控件」内容模型
> - → 后续必学：「inkcanvas-手写画布」在图片上叠加批注；「mediaelement-媒体播放器」动态内容
> - ⇄ 关联概念：「图标按钮实现」用 Path 矢量图标替代位图；「tooltip-工具提示」给图片加说明
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.image
