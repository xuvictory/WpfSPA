---
title: 冻结 Freezable 对象
section: 13-performance
parent: 13.2 UI 性能优化
---

# 冻结 Freezable 对象

> [!plain] 白话理解
> `Freezable` 是 WPF 里的一种"冰鲜食品"：新鲜时（未冻结）可以随便改，一进冷库（调用 `Freeze()`）就"冻住了"——不能改，但可以放心地放进冰柜共享。画刷（`SolidColorBrush`）这类对象不冻结时，每个控件都得自己"复刻一份"以免被别人改；冻结后大家共用同一块，既省内存又省复制成本。示例里：不冻结创建 10000 个独立画刷，冻结则只创建 1 个、一万个控件共用——内存和渲染开销天差地别。代价是**冻结后不能修改**，所以要在"设置完所有属性"之后再冻。

> [!def] 官方定义
> `Freezable` 是 `System.Windows` 命名空间下的一个抽象基类，为 WPF 中可变的只读对象提供两种状态：**可修改状态（可变）**与**只读状态（已冻结，IsFrozen 为 true）**。对象冻结（调用 `Freeze()`）后属性不可再变，WPF 因此可以：①在线程间共享（冻结对象跨线程安全）；②深度共享并缓存其渲染数据（如把画刷编译为 GPU 指令复用）；③减少复制与内存占用。典型 `Freezable` 派生类：`Brush`（`SolidColorBrush` 等）、`Pen`、`Transform`、`Geometry`、`AnimationTimeline`、`BitmapCache`、`Drawing`。未冻结的 Freezable 在多个 `DependencyObject` 间共享时会被自动克隆（副本），这是大量对象内存膨胀的常见来源。详见官方文档：[Freezable 对象概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/freezable-objects-overview)、[Freeze()](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.freezable.freeze)。

> [!origin] 由来背景
> WPF 早期曾因"同一个画刷被多个控件共享后，一个控件改了颜色，所有控件跟着变"的诡异问题吃过亏。`DependencyObject` 的值共享机制要求"一个对象只能有一个所有者"，于是 WPF 采用**复制**策略：同一个 `Brush` 赋给 1000 个控件，就会复制出 1000 份独立对象，内存与渲染缓存全部翻倍。微软从 WPF 1.0 起内置 `Freezable` 解决这个矛盾：对象一旦 `Freeze()`，就承诺"永不改变"，所有控件都能安全共用同一份，既保住了共享的性能红利，又消除了"改了共享对象影响一片"的风险。这也是"**不可变性带来并发与共享安全**"这一现代编程思想在 UI 框架里的经典落地。

> [!essentials] 核心要点
> - **冻结时机**：属性全部设置完之后调用 `Freeze()`，冻结后任何属性赋值都会抛 `InvalidOperationException`
> - **条件满足**：只有当对象没有事件订阅者、没有数据绑定、没有动画时才能冻结（`CanFreeze` 可预检）
> - **共享生效**：冻结对象赋给多个元素不再产生副本，内存与渲染缓存显著下降
> - **线程安全**：冻结后可在任意线程共享使用（如后台线程构造画刷冻结后交给 UI 线程）
> - **克隆无碍**：`Clone()` 返回未冻结副本，可再修改；要冻结副本需对新对象再调 `Freeze()`

> [!example] 完整示例
> **Freezable 冻结对象：10000 个独立画刷 vs 1 个冻结画刷共享：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="冻结 Freezable 对象" Height="400" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15" Background="#161B22" Padding="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="Freezable 冻结对象：独立画刷 vs 冻结共享画刷"
>                    Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Grid.Row="1" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"
>                    Text="创建 10000 个矩形：左侧用 10000 个独立画刷，右侧全部共用 1 个冻结画刷，对比内存与耗时。"/>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,10,0,0">
>             <Button Content="创建 10000 个矩形（独立画刷）" Click="OnCreateSeparate" Padding="8"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="创建 10000 个矩形（冻结共享）" Click="OnCreateFrozen" Padding="8" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <ScrollViewer Grid.Row="3" Margin="0,10,0,0" VerticalScrollBarVisibility="Auto">
>             <WrapPanel x:Name="Panel" />
>         </ScrollViewer>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Diagnostics;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
> using System.Windows.Shapes;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 方式一：10000 个独立画刷（未冻结，各自持有对象副本）
>         private void OnCreateSeparate(object sender, RoutedEventArgs e)
>         {
>             Panel.Children.Clear();
>             var sw = Stopwatch.StartNew();
>             for (int i = 0; i < 10000; i++)
>             {
>                 var rect = new Rectangle
>                 {
>                     Width = 24, Height = 24,
>                     Margin = new Thickness(1),
>                     Fill = new SolidColorBrush(Color.FromRgb(88, 166, 255))
>                 };
>                 Panel.Children.Add(rect);
>             }
>             sw.Stop();
>             ShowMem($"独立画刷 x 10000：耗时 {sw.Elapsed.TotalMilliseconds:F0} ms");
>         }
>
>         // 方式二：10000 个矩形共用 1 个冻结画刷
>         private void OnCreateFrozen(object sender, RoutedEventArgs e)
>         {
>             Panel.Children.Clear();
>             var brush = new SolidColorBrush(Color.FromRgb(35, 134, 54));
>             brush.Freeze();   // 关键：冻结后才可被多个元素安全共享
>             var sw = Stopwatch.StartNew();
>             for (int i = 0; i < 10000; i++)
>             {
>                 var rect = new Rectangle
>                 {
>                     Width = 24, Height = 24,
>                     Margin = new Thickness(1),
>                     Fill = brush     // 全部共用同一个冻结画刷
>                 };
>                 Panel.Children.Add(rect);
>             }
>             sw.Stop();
>             ShowMem($"冻结共享画刷 x 10000：耗时 {sw.Elapsed.TotalMilliseconds:F0} ms");
>         }
>
>         private void ShowMem(string info)
>         {
>             double mb = Process.GetCurrentProcess().WorkingSet64 / 1024d / 1024d;
>             Title = $"{info}；进程内存 {mb:F1} MB";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 状态指示灯/点位图：监控画面几百上千个"灯"共用同一个冻结 `SolidColorBrush`，内存省一大截
> ✅ 列表 ItemTemplate 的静态资源：模板里频繁使用的画刷、几何、变换，在资源字典中统一冻结
> ✅ 后台线程预构建画刷：采集线程构造好冻结画刷、几何，UI 线程直接使用，线程安全且快
> ✅ 动画用的 `Transform`/`Geometry`：批量静态图形共享冻结的几何对象，省渲染缓存
> ✅ 截图/离屏渲染：`RenderTargetBitmap` 渲染前把相关画刷冻结，渲染更快
> ❌ 需要动态改颜色的画刷（如报警闪烁变色），冻结后无法修改，必须用可变画刷
> ❌ 带数据绑定或事件订阅的画刷（`CanFreeze` 为 false，调用 `Freeze()` 会抛异常）

> [!pitfall] 常见踩坑
> 坑 1：**冻结后还想改属性** → 现象：代码运行到一半抛 `InvalidOperationException: Cannot modify a frozen object` → 原因：`Freeze()` 之后任何属性赋值/子对象修改都被禁止 → 解决：在冻结前把属性设置完；确需修改时用 `Clone()` 出可变副本再改
> 
> 坑 2：**把冻结对象当可变对象传给业务代码** → 现象：业务逻辑改了画刷颜色，界面没反应或直接异常 → 原因：业务层不知道对象已冻结 → 解决：约定冻结对象"只读共享"，可变需求走 `Clone()`，并在代码注释中标注冻结状态
>
> 坑 3：**忘了 CanFreeze 预检** → 现象：`Freeze()` 抛异常，且难以定位 → 原因：对象带绑定/事件/动画时不允许冻结 → 解决：冻结前先判 `CanFreeze`，不满足时用 `Clone()` 或解绑后再冻；批量冻结逻辑放在资源字典 XAML 里用 `PresentationOptions:Freeze="True"` 声明，编译期就能发现

> [!best] 最佳实践
> - 画刷、变换、几何这类"只读共享"对象，一律在资源字典里 `PresentationOptions:Freeze="True"` 声明冻结，一劳永逸
> - 代码创建共享对象时先 `Freeze()` 再赋给多个元素（示例的冻结分支就是这个顺序）
> - 冻结前确认不再修改：先设属性、后冻结，冻结逻辑与构造逻辑放一起
> - 用 `Process.GetCurrentProcess().WorkingSet64` 量化对比（示例 `ShowMem`），用数据说服团队养成冻结习惯
> - 与 `图片优化与位图缓存` 配合：位图本身是不可变的，`BitmapImage` 冻结后共享渲染缓存

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，分别点两个按钮，观察标题栏的耗时与内存差异；把独立画刷数量改成 50000，对比差距是否拉大
> **Lv.2 小试牛刀**：在"冻结共享"分支中，尝试冻结前把画刷绑定到某个颜色属性（`SetBinding`），观察 `CanFreeze` 是否为 false，再验证 `Freeze()` 抛异常
> **Lv.3 融会贯通**：给状态灯控件做一个"报警闪烁"效果：正常状态用冻结画刷共享，报警时 `Clone()` 出可变画刷并触发颜色动画，报警解除后切回冻结画刷，同时用 `视觉树与渲染线程` 的 FPS 工具对比动画期间的帧率

> [!related] 相关知识链接
> - ← 前置知识：`什么是-wpf-资源`（资源字典承载冻结对象）、`资源字典`（PresentationOptions:Freeze 声明处）
> - → 后续必学：`图片优化与位图缓存`（位图冻结与缓存共用）、`wpf-内存常见问题与泄漏场景`（对象共享不当引发的内存问题）
> - ⇄ 关联概念：`资源层级与查找顺序`（共享对象的作用域）、`依赖属性的原理`（共享值系统的底层机制）、`大量控件同时可见`（与冻结画刷组合的大规模绘制）
> - 📖 官方文档：[Freezable 对象概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/freezable-objects-overview)、[Freeze()](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.freezable.freeze)
