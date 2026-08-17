---
title: 实时曲线：LiveCharts2
section: 10-data-collection
parent: 10.4 数据可视化
---

# 实时曲线：LiveCharts2

> [!plain] 白话理解
> 把实时曲线比作**病房里的心电监护仪**：病人的心跳数据不断涌进来，屏幕只显示"最近一段"的波形——太老的数据滚出屏幕，新的数据从右边顶进来。操作员看的是**趋势**，而不是某个瞬间的孤点。
>
> 工业上位机里的实时曲线也是一样：温度、压力、转速每 200ms 进一个点，曲线持续向右滚动，操作员一眼看出"温度在往上爬、快超限了"。LiveCharts2 就是帮你把"采集数据→画成会滚动的曲线"这件事做好的库——你只管把数据喂给它，缩放、平移、十字光标、主题配色它都包了。
>
> 一句话：**实时曲线 = 滑动窗口的数据 + 按固定频率刷新的图表；LiveCharts2 是其中渲染与交互做得最省心的选择之一**。

> [!def] 官方定义
> - **LiveCharts2**：开源跨平台图表库（MIT 协议），由 Betim Muhamedi 开发，**非微软官方控件**。基于 **SkiaSharp** 渲染（GPU/CPU 均可，性能好、跨平台一致），当前主版本 2.x（包名 `LiveChartsCore.SkiaSharpView.WPF`）。
> - 核心类型归属：`LiveChartsCore.SkiaSharpView.WPF.CartesianChart`（WPF 控件）、`LiveChartsCore.SkiaSharpView.LineSeries<T>`（折线系列）、`ISeries`（系列接口）、`LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint`（画笔/配色）、`Axis`（坐标轴）。
> - 关键用法：给 `Chart.Series` 赋系列、`Chart.XAxes`/`Chart.YAxes` 配轴，改完数据后调用 `Chart.Update()` 刷新；`LineSeries.Values` 设数据源。
> - 📖 官方文档：[LiveCharts2 官网](https://livecharts.dev/)、[LiveCharts2 文档](https://livecharts.dev/docs/wpf/2.0/start)

> [!origin] 由来背景
> 上位机曲线图库的演变史：早期开发者用 WPF 原生 `Polyline` + `Canvas` 手动画曲线——数据一多、一缩放，代码就失控，于是社区出现了专用图表库。**OxyPlot**（2010 年）以轻量稳定著称；2016 年 Betim Muhamedi 推出 **LiveCharts**（第一代，基于 WPF 原生渲染），因 API 简洁迅速流行。但第一代性能与跨平台能力受限，作者于 2021 年用 **SkiaSharp** 全部重写为 **LiveCharts2**：渲染更快（硬件加速）、一套 API 跑通 WPF/MAUI/WinUI/Avalonia，成为现代 .NET 跨平台图表库的代表。对 WPF 上位机来说，它和 OxyPlot 是目前实时曲线事实上的两大选择，前者交互更丰富、性能更佳。

> [!essentials] 核心要点
> - **NuGet 与命名空间**：`Install-Package LiveChartsCore.SkiaSharpView.WPF`，XAML 加 `xmlns:lvc="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"`
> - **三步搭图表**：建 `LineSeries<T>` → 赋给 `Chart.Series` → 配 `Chart.XAxes`/`Chart.YAxes`（示例即此结构）
> - **实时刷新两种方式**：改完 `_series.Values` 后 `Chart.Update()` 手动刷新（示例用）；或把 `Values` 绑定到 `ObservableCollection<T>` 自动刷新（数据频率低时用）
> - **滑动窗口控制点数**：`if (values.Count > 60) values.RemoveAt(0)`——不控制点数，曲线会越来越密、内存越涨越高（对应 `存储策略与数据保留` 的缓冲思想）
> - **`Values` 用 `ToArray()` 替换**：不要直接给同一个 `List` 增删后继续引用原对象，避免渲染与数据竞争（赋值新数组最安全）
> - **轴范围预配置**：`MinLimit`/`MaxLimit` 给 Y 轴定死量程，避免实时数据抖动导致曲线上下乱跳

> [!example] 完整示例
> **实时曲线演示：LiveCharts2 折线图，200ms 追加一个采样点，滑动窗口只保留最近 60 个点：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:lvc="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"
>         Title="实时曲线-LiveCharts2" Height="440" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <Button x:Name="StartBtn" Content="开始采集" Click="OnStartClick" Padding="10,6"
>                     Background="#238636" Foreground="White"/>
>             <Button x:Name="StopBtn" Content="停止采集" IsEnabled="False" Click="OnStopClick"
>                     Padding="10,6" Background="#DA3633" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="ValueText" Grid.Row="1" Margin="5" Foreground="#58A6FF"
>                    Text="当前温度：-- ℃"/>
>
>         <!-- 实时曲线区域 -->
>         <lvc:CartesianChart x:Name="Chart" Grid.Row="2" Margin="5"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package LiveChartsCore.SkiaSharpView.WPF
> using System;
> using System.Collections.Generic;
> using System.Linq;
> using System.Windows;
> using System.Windows.Threading;
> using LiveChartsCore;
> using LiveChartsCore.SkiaSharpView;
> using LiveChartsCore.SkiaSharpView.Painting;
> using SkiaSharp;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly List<double> _values = new List<double>();  // 滑动窗口数据
>         private LineSeries<double> _series;                          // 折线系列
>         private readonly DispatcherTimer _timer;
>         private readonly Random _rnd = new Random();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 配置折线样式：强调蓝、无填充、不画数据点
>             _series = new LineSeries<double>
>             {
>                 Stroke = new SolidColorPaint(SKColors.DeepSkyBlue) { StrokeThickness = 2 },
>                 Fill = null,
>                 GeometrySize = 0
>             };
>             Chart.Series = new ISeries[] { _series };
>             Chart.XAxes = new[] { new Axis { Name = "采样点" } };
>             Chart.YAxes = new[] { new Axis { Name = "温度(℃)", MinLimit = 0, MaxLimit = 100 } };
>
>             _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(200) };
>             _timer.Tick += OnTick;
>         }
>
>         // 每 200ms 追加一个采样点，超过 60 个移除最旧的(滑动窗口)
>         private void OnTick(object sender, EventArgs e)
>         {
>             _values.Add(_rnd.Next(20, 60));
>             if (_values.Count > 60) _values.RemoveAt(0);
>
>             _series.Values = _values.ToArray();   // 更新数据源
>             Chart.Update();                       // 手动刷新曲线
>             ValueText.Text = $"当前温度：{_values[_values.Count - 1]} ℃";
>         }
>
>         private void OnStartClick(object sender, RoutedEventArgs e)
>         {
>             _timer.Start();
>             StartBtn.IsEnabled = false;
>             StopBtn.IsEnabled = true;
>         }
>
>         private void OnStopClick(object sender, RoutedEventArgs e)
>         {
>             _timer.Stop();
>             StartBtn.IsEnabled = true;
>             StopBtn.IsEnabled = false;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **实时趋势监控**：温度、压力、流量、转速随时间变化的滚动曲线——上位机最刚需的画面
> ✅ **需要缩放/平移/十字光标的交互分析**：操作员要放大看某段异常、悬浮看具体值，LiveCharts2 开箱即用
> ✅ **多曲线对比**：多台设备/多个点位同屏对比（每个点位一条 `LineSeries`），趋势判断直观
> ✅ **需要跨平台一致体验**：同一套图表代码将来要跑 WPF/WinUI/MAUI 时，LiveCharts2 是首选
> ❌ **极简只读历史曲线**：只要画出来、不要交互，OxyPlot 更轻量（见 `实时曲线oxyplot`）
> ❌ **离线环境无法引 NuGet 包**：内网隔离的工控机若无本地包源，用 WPF 原生自绘或 OxyPlot 内置更省事

> [!pitfall] 常见踩坑
> 坑 1：**数据窗口无限增长** → 现象：运行几小时后曲线越来越密、内存占用持续上涨、界面变卡 → 原因：`_values` 只增不减 → 解决：滑动窗口强制上限（`Count > N` 就 `RemoveAt(0)`），与 `存储策略与数据保留` 的环形缓冲同理
>
> 坑 2：**给 `Values` 直接赋值同一个 `List` 引用并在渲染中增删** → 现象：偶发异常、曲线错乱 → 原因：渲染线程遍历时数据被修改 → 解决：每次更新赋值 `_values.ToArray()` 新数组（示例写法），或改用 `ObservableCollection` 并只做 Add/RemoveAt
>
> 坑 3：**高频刷新时逐点 `Chart.Update()`** → 现象：CPU 飙升、曲线抖动 → 原因：每 10ms 就重绘一次，刷新频率远超人眼需要 → 解决：限流到 5~10 次/秒（如 200ms 一次，示例即如此），数据可以攒一批一起推给图表
>
> 坑 4：**Y 轴范围不固定** → 现象：偶尔一个尖峰让整条曲线压成一条直线 → 原因：轴自动缩放被异常值带飞 → 解决：`MinLimit`/`MaxLimit` 定死量程；数据先过 `数据过滤与清洗` 再上图，别让毛刺直接进曲线

> [!best] 最佳实践
> - **曲线数据与采集解耦**：采集线程只往 `ConcurrentQueue` 放值，UI 侧 `DispatcherTimer` 定时取出批量更新曲线（见 `采集线程模型设计`），天然限流
> - **多系列用统一主题**：所有系列共用 `SolidColorPaint` 配色方案（面板深色、曲线亮色、轴灰色），与 `状态指示灯` 的颜色语义呼应
> - **Y 轴量程来自点位配置**：`MinLimit/MaxLimit` 用 `数据转换与工程值计算` 里点位配置的量程，别手写在代码里
> - **大点数场景考虑降采样**：历史曲线查询海量点时，先在服务端/查询层降采样（见 `时序数据库简介`）再给图表，别把百万点灌给前端
> - **窗口上限做成常量**：`const int MaxPoints = 60;` 集中管理，方便现场按屏幕宽度调整

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例启动采集，观察曲线滚动；把 `Interval` 改成 50ms、把 `MaxPoints` 改成 200，观察曲线密度与流畅度变化
> **Lv.2 加属性**：添加第二条 `LineSeries`（如"压力"系列，橙色），两条曲线同屏滚动——多系列对比是上位机曲线的标配
> **Lv.3 改造**：把数据源从"随机数"换成 `数据过滤与清洗` 的清洗后数据（原始+平滑两条曲线对比），再用 `数据转换与工程值计算` 的工程值显示 Y 轴
> **Lv.4 挑战**：实现"历史回放"：从 `轻量级数据库-sqlite` 查询最近 1 小时数据，按时间范围分段加载到曲线，支持暂停/继续滚动、缩放查看——这就是 SCADA 历史趋势图的核心

> [!related] 相关知识链接
> - ← 前置知识：`数据转换与工程值计算`（曲线画的是工程值）、`数据过滤与清洗`（清洗后曲线才平滑）
> - → 对比必读：`实时曲线oxyplot`（另一款常用图表库，轻量派）
> - ⇄ 关联概念：`时序数据库简介`（历史曲线的数据来源）、`仪表盘控件`（单点实时值另一种表达）、`报警系统`（曲线上的超限可视化）
> - 📖 官方文档：[LiveCharts2 官网](https://livecharts.dev/)、[LiveCharts2 WPF 入门](https://livecharts.dev/docs/wpf/2.0/start)
