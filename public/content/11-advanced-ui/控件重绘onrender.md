---
title: 控件重绘（OnRender）
section: 11-advanced-ui
parent: 11.1 自定义控件深度开发
---

# 控件重绘（OnRender）

> [!plain] 白话理解
> 把控件重绘想象成**画图工重新画一块工牌**：`OnRender` 就是"发图纸、领画笔"的时刻，你在这段时间里把要显示的东西一笔一笔画进 `DrawingContext`（一支"即画即录"的画笔，画完直接进入渲染缓存，不能回头擦改）。平时界面上盖了别的窗口、拖动改变大小，系统会自动通知"重画"，不用你操心。但你想让灯从红变绿时，要主动喊一声 `InvalidateVisual()`——相当于"我这块工牌过时了，请重新画"。重绘只在需要时发生（保留模式渲染），所以不能在里面做耗时操作，否则一拖动窗口就卡成幻灯片。

> [!def] 官方定义
> `OnRender(DrawingContext drawingContext)` 是 `UIElement` 的受保护虚方法，在元素进入渲染管线时由系统调用，开发者通过 `DrawingContext` 指令（`DrawLine`/`DrawRectangle`/`DrawEllipse`/`DrawText`/`DrawImage`/`PushTransform` 等）描述"要画什么"，系统负责把这些指令编译为渲染缓存。调用 `InvalidateVisual()` 可使元素被标记为需重绘，在下一渲染帧触发新的 `OnRender`。注意 `OnRender` 中绘制的内容**不会被命中测试**（点击检测需要 `OnRender` 之外配合 `IsHitTestVisible` 或命中测试覆盖），且不能用 `dc` 之外的方式保存状态。详见官方文档：[UIElement.OnRender](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.uielement.onrender)、[DrawingContext 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.drawingcontext)。

> [!origin] 由来背景
> WPF 的渲染模型继承自 WinFX 时代为高 DPI、GPU 加速而设计的**保留模式渲染**（Retained Mode）架构：2003 年微软在 Longhorn 演示（Avalon 前身）中首次展示"矢量化的声明式 UI"，其核心思想是把"绘制命令"保留为渲染树而非像 GDI 那样立即绘入像素。2006 年 WPF 随 .NET Framework 3.0 发布后，`OnRender` 成为自定义绘制的标准入口：系统只在布局或属性变化使视觉无效时重绘，`DrawingContext` 收集的命令会被 `MIL`（Media Integration Layer）硬件加速合成。相比 WinForms 的 `OnPaint` + GDI+（每次都要完整重画、易闪烁），WPF 让"重绘"变得声明式、增量式且可硬件加速。

> [!essentials] 核心要点
> - **`OnRender` 只描述不执行**：`DrawingContext` 收集指令，实际绘制由系统合成，不能在其中取现成结果或保存中间状态
> - **主动重绘用 `InvalidateVisual()`**：属性变化时调用，系统在下一帧重新调用 `OnRender`；连续多次调用自动合并为一帧
> - **`DrawingContext` 核心 API**：`DrawLine`/`DrawRectangle`/`DrawEllipse`/`DrawGeometry`/`DrawText`/`DrawImage`，`PushClip`/`PushTransform` 成对使用后要 `Pop()`
> - **画刷与画笔应冻结**：`brush.Freeze()` 后在渲染线程共享，避免每次 `OnRender` 新建对象造成 GC 压力
> - **命中测试**：`OnRender` 画出的内容默认不响应鼠标，需要配合 `HitTestCore` 重写或把元素当可点击区域处理
> - **与 `FrameworkElement` 的关系**：需要自绘的轻量元素直接继承 `FrameworkElement` 重写 `OnRender` 即可，无需 `Control` 模板

> [!example] 完整示例
> **实时温度曲线演示：自定义 TrendChart 控件重写 OnRender，用 DrawingContext 绘制网格与折线，点击按钮追加数据点并调用 InvalidateVisual 触发重绘：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="控件重绘 - 实时温度曲线" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="采集温度曲线（OnRender + DrawingContext 自绘）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <!-- 自定义自绘控件：所有画面都由 OnRender 画出 -->
>         <local:TrendChart x:Name="Chart" Grid.Row="1" Margin="0,12,0,0"/>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="追加一个数据点" Click="OnAddPoint" Margin="0,0,10,0"
>                     Padding="10,6" Background="#21262D" Foreground="White"/>
>             <Button Content="清空曲线" Click="OnClear" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与自定义自绘控件：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 自绘控件：重写 OnRender，用 DrawingContext 一次性绘制网格和折线
>     public class TrendChart : FrameworkElement
>     {
>         private readonly List<double> _points = new List<double>();
>         private readonly Random _random = new Random();
>
>         // 追加数据并请求重绘（自绘惯用法：改数据 → InvalidateVisual）
>         public void AddPoint()
>         {
>             _points.Add(60 + _random.NextDouble() * 40); // 模拟 60~100℃ 温度
>             if (_points.Count > 60) _points.RemoveAt(0); // 滚动窗口，只保留最近 60 个点
>             InvalidateVisual();
>         }
>
>         public void Clear()
>         {
>             _points.Clear();
>             InvalidateVisual();
>         }
>
>         // 渲染入口：WPF 在需要重绘时自动调用，把全部画面画进 DrawingContext
>         protected override void OnRender(DrawingContext dc)
>         {
>             var bg = new SolidColorBrush(Color.FromRgb(0x16, 0x1B, 0x22));
>             var gridPen = new Pen(new SolidColorBrush(Color.FromRgb(0x21, 0x26, 0x2D)), 1);
>             var linePen = new Pen(new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF)), 2);
>
>             // 背景 + 水平网格线（每格 25% 高度）
>             dc.DrawRectangle(bg, null, new Rect(0, 0, ActualWidth, ActualHeight));
>             for (int i = 0; i <= 4; i++)
>             {
>                 double y = ActualHeight * i / 4;
>                 dc.DrawLine(gridPen, new Point(0, y), new Point(ActualWidth, y));
>             }
>
>             // 把温度值映射为坐标并连成折线
>             if (_points.Count > 1)
>             {
>                 double step = ActualWidth / Math.Max(_points.Count - 1, 1);
>                 for (int i = 1; i < _points.Count; i++)
>                 {
>                     var p1 = new Point(step * (i - 1), MapY(_points[i - 1]));
>                     var p2 = new Point(step * i, MapY(_points[i]));
>                     dc.DrawLine(linePen, p1, p2);
>                 }
>             }
>         }
>
>         // 温度 60~100℃ 线性映射到控件高度
>         private double MapY(double v) => ActualHeight - (v - 60) / 40 * ActualHeight;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 启动时预置几个数据点，让曲线一打开就有内容
>             for (int i = 0; i < 10; i++) Chart.AddPoint();
>         }
>
>         private void OnAddPoint(object sender, RoutedEventArgs e) => Chart.AddPoint();
>         private void OnClear(object sender, RoutedEventArgs e) => Chart.Clear();
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机自绘仪表：环形进度、温度计、液位、转速表盘（矢量绘制 + `InvalidateVisual` 实时刷新）
> ✅ 轻量自绘元素：指示灯、分隔线、信号波形、网格刻度（无需模板，直接继承 `FrameworkElement`）
> ✅ 需要把数据实时映射为图形的场景：采集曲线、报警闪烁点、总线拓扑图
> ❌ 内容主要是"组合标准控件"的场景（用 `Control` + 模板更合适，可换肤、可绑定）
> ❌ 需要复杂交互、键盘导航、无障碍支持的自定义控件（`OnRender` 只管画，交互能力有限）

> [!pitfall] 常见踩坑
> 坑 1：**在 `OnRender` 里做耗时计算** → 现象：拖动窗口、切页时界面卡顿 → 原因：`OnRender` 在渲染线程每帧执行，繁重逻辑阻塞渲染 → 解决：把计算缓存到字段，`OnRender` 只做绘制指令；`DrawingContext` 对象用完释放
> 
> 坑 2：**每次重绘都 new 画笔/画刷** → 现象：内存与 GC 压力大、长时间运行卡顿 → 原因：`OnRender` 高频执行，未冻结的对象无法跨线程共享还被反复创建 → 解决：静态只读画刷并在首次 `Freeze()`，或缓存于字段
>
> 坑 3：**只改属性忘记 `InvalidateVisual`** → 现象：数据变了但界面不刷新 → 原因：普通 CLR 属性变化不通知渲染系统 → 解决：依赖属性元数据加 `FrameworkPropertyMetadataOptions.AffectsRender`，系统自动在值变化时触发重绘

> [!best] 最佳实践
> - 数据刷新用依赖属性 + `AffectsRender` 元数据，让系统在值变化时自动重绘，避免手动到处调 `InvalidateVisual`
> - 画刷、画笔、几何对象尽量 `Freeze()` 并复用；频繁变化的文字用 `FormattedText` 缓存
> - 先按 `ActualWidth`/`ActualHeight` 计算布局，支持控件尺寸变化自动适配（拖动窗口不失真）
> - 复杂图形优先用 `StreamGeometry`/`PathGeometry` 而非逐像素绘制，交给 GPU 合成
> - `OnRender` 抛异常会中断渲染，绘制前对 `Value`/`Max` 做范围钳制（示例里 `Math.Max/Min`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"追加一个数据点"观察曲线增长、点"清空曲线"观察归零；连续追加 60 个点后看是否自动滚动
> **Lv.2 小试牛刀**：在 `TrendChart.OnRender` 中增加一条 80℃ 的虚线"上限警示线"（`DashStyle` 画刷），并给网格加 20%/40%/60%/80% 刻度文字
> **Lv.3 融会贯通**：用 `DispatcherTimer` 每 500ms 自动调用 `AddPoint()` 模拟实时采集，并给曲线增加第二通道（红色）表示另一台设备温度
> **Lv.4 拆层挑战**：把曲线数据源抽成 `INotifyPropertyChanged` 的 ViewModel，`TrendChart` 只订阅数据集合变化，通过依赖属性绑定注入，验证"数据层与绘制层"解耦

> [!related] 相关知识链接
> - ← 前置知识：「第 5 章·什么是依赖属性」「什么是依赖属性」（`AffectsRender` 元数据）、`控件生命周期`（`OnRender` 在布局后由系统调用）
> - → 后续必学：`焦点管理`（自绘元素的键盘/鼠标命中测试）、`per-monitor-dpi-awareness`（`OnRender` 中 DIP 与物理像素的换算）
> - ⇄ 关联概念：「第 5 章·控件模板」「控件模板-controltemplate」（模板 vs 自绘两种表现方式）、`customcontrol-自定义控件`（选择 `Control` 模板还是 `FrameworkElement` 自绘）
> - 📖 官方文档：[UIElement.OnRender](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.uielement.onrender)、[DrawingContext 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.drawingcontext)、[UIElement.InvalidateVisual](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.uielement.invalidatevisual)
