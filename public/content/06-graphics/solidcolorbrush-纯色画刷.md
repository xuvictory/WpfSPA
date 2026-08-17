---
title: SolidColorBrush 纯色画刷
section: 06-graphics
parent: 6.4 Brush 画刷
---

# SolidColorBrush 纯色画刷

> [!plain] 白话理解
> SolidColorBrush 就是"给图形上色的油漆"，只不过这桶油漆只有一种颜色。WPF 里凡是能显示颜色的地方——Fill、Stroke、Background、Foreground——背后都是各种 Brush，而纯色画刷是其中最常用、最省事的：`Fill="#238636"` 和 `Fill=new SolidColorBrush(...)` 是一回事。它负责把"什么颜色"变成"能涂到图形上的东西"。
>
> 类比：颜色是"色卡上的编号"，画刷是"涂到墙上的油漆"。上位机状态灯的绿/红/灰，就是三桶不同颜色的 SolidColorBrush。

> [!def] 官方定义
> `System.Windows.Media.SolidColorBrush` 是 `Brush` 抽象类的实现，用单一 `Color`（`System.Windows.Media.Color`，RGBA 结构）填充图形区域。XAML 属性简写 `Fill="#RRGGBB"` 会自动转换。常用预置实例：`System.Windows.Media.Brushes.Red` 等静态属性；也支持 `Color.FromRgb`/`FromArgb` 在代码中构造。SolidColorBrush 继承自 `Freezable`，可冻结。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.solidcolorbrush

> [!origin] 由来背景
> WPF 把"颜色"抽象为可继承的 `Brush` 体系：纯色、渐变、图像、视觉画刷共用同一接口，任何接受 Brush 的属性都能无缝替换。SolidColorBrush 作为最基础的实现，配合 WPF 的依赖属性与 Freezable 机制，可以做到"一个画刷实例被多个图形共享、一处修改全局生效"。工控界面的状态色管理（绿=运行、红=报警、灰=离线）正是它最典型的应用。

> [!essentials] 核心要点
> - **构造三法**：XAML 简写 `"#RRGGBB"`、`Brushes.Red` 预置、代码 `Color.FromRgb/FromArgb`
> - **Color 结构**：`Color` 是值类型（R/G/B/A 各 0-255），`SolidColorBrush` 是引用类型（可共享）
> - **Alpha 透明度**：`FromArgb(0x66, ...)` 做半透明，叠加到底图上不遮挡
> - **Freezable 冻结**：静态颜色 `Freeze()` 提升性能，且可跨线程共享
> - **共享与隔离**：多个元素共享一个画刷改一处全变；不想联动就各自 new

> [!example] 完整示例
> **设备启停状态灯演示：用 SolidColorBrush 纯色画刷控制指示灯颜色（红/绿/灰），演示 XAML 声明与后台代码动态赋值两种写法：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="状态灯 - SolidColorBrush" Height="380" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="1 号泵运行状态" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 声明式纯色画刷：Fill="#21262D" 等价于 SolidColorBrush -->
>         <StackPanel Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Ellipse x:Name="Lamp" Width="90" Height="90" Fill="#21262D"
>                      Stroke="#30363D" StrokeThickness="3"/>
>             <TextBlock x:Name="StateText" Text="停止" Foreground="#8B949E" FontSize="20"
>                        HorizontalAlignment="Center" Margin="0,12,0,0"/>
>         </StackPanel>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="启动" Click="OnStart" Padding="10" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="停止" Click="OnStop" Padding="10" Background="#DA3633"
>                     Foreground="White"/>
>         </StackPanel>
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
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             // 命令式纯色画刷：Color.FromRgb 构造
>             Lamp.Fill = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>             StateText.Text = "运行中";
>             StateText.Foreground = Brushes.LimeGreen;
>         }
>
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             Lamp.Fill = new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33));
>             StateText.Text = "停止";
>             StateText.Foreground = Brushes.OrangeRed;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 状态指示灯/启停灯：绿/红/灰三色纯色画刷切换设备状态
> ✅ 统一界面底色：窗口/面板背景 `Background="#0D1117"` 等固定色
> ✅ 文本与边框配色：Foreground、BorderBrush 的纯色着色
> ✅ 按钮/控件状态色：默认态与悬停态用不同纯色
> ❌ 需要立体/光泽效果：改用 lineargradientbrush-线性渐变 / radialgradientbrush-径向渐变
> ❌ 需要图片纹理：改用 imagebrush-图像画刷

> [!pitfall] 常见踩坑
> 坑 1：**`Color` 与 `Brush` 混淆** → 现象：给 Fill 赋 `Color` 类型报编译错 → 原因：Fill 需要 `Brush`，`Color` 是值类型颜色值 → 解决：`new SolidColorBrush(color)` 包装，或直接用 `Brushes.Red`/`(Brush)new BrushConverter().ConvertFromString("#58A6FF")`
> 
> 坑 2：**共享画刷导致"改一处全局变色"** → 现象：明明只想改一个灯，其它灯也跟着变 → 原因：多个元素引用了同一个 SolidColorBrush 实例 → 解决：需要独立变化就各自 new；要联动才共享同一个画刷（这正是 Freeze 的意义）
>
> 坑 3：**颜色写错格式** → 现象：`#58A6FF` 有效但 `#58A6F` 无效或 Alpha 混乱 → 原因：16 进制色值位数不对，或把 Argb 当 Rgb 用 → 解决：标准 `#RRGGBB`；带透明度用 `#AARRGGBB` 或 `Color.FromArgb`

> [!best] 最佳实践
> - 状态色集中为 Brush 资源（`x:Key="RunBrush"/"StopBrush"/"AlarmBrush"`），改一处全站生效
> - 静态画刷（不会变）`Freeze()` 冻结，渲染更快、内存更省
> - 需要"状态→颜色"映射时封装一个方法（如 `Brush ForStatus(Status s)`），比散落 if/else 强
> - 自定义主题色定义在 App.xaml 资源字典，窗口 XAML 引用，换肤只改一处
> - 界面调试时先用高对比纯色定位元素，再替换成正式配色

> [!practice] 上手练习
> **Lv.1 运行体验**：运行状态灯示例，点"启动/停止"，观察灯与文字颜色切换（后台代码改 Fill/Foreground）
> **Lv.2 动手改造**：给指示灯加第三个状态"检修中"（黄色 `#E3B341`），新增按钮切换
> **Lv.3 综合实战**：把三种状态色抽成 Brush 资源放在 Window.Resources，XAML 用 StaticResource 引用，后台只改资源键
> **Lv.4 挑战进阶**：用 `Color.FromArgb` 实现"半透明运行灯"叠加在背景上，并写一个 `ForStatus` 转换函数供多控件复用

> [!related] 相关知识链接
> - ← 前置知识：ellipse-椭圆 认识 Fill/Stroke；wpf-图形渲染概述 理解 Freezable 冻结的意义
> - → 后续必学：lineargradientbrush-线性渐变 提升视觉层次；上位机画刷应用 综合运用
> - ⇄ 关联概念：所有-shape-共享属性（Fill/Stroke）；第 7 章「什么是数据绑定」用值转换器把状态转画刷
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.solidcolorbrush
