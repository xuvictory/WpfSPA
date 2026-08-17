---
title: 实时曲线：OxyPlot
section: 10-data-collection
parent: 10.4 数据可视化
---

# 实时曲线：OxyPlot

> [!plain] 白话理解
> 如果 LiveCharts2 是**功能丰富的智能仪表**，那 OxyPlot 就是**皮实耐用的经典仪表**——界面朴素，但核心活（画曲线、标坐标）干得极稳，而且轻量、老牌、文档扎实。
>
> OxyPlot 的编程模型很直白：你先搭一个"图纸"（`PlotModel`），在图纸上加"画笔"（`LineSeries`）和"尺子"（`LinearAxis`），然后把图纸交给画架（`PlotView`）去显示。数据更新后喊一声"重画"（`InvalidatePlot`），它就重画。
>
> 一句话：**OxyPlot = 模型驱动的轻量级跨平台绘图库，上手快、依赖小、适合朴素而稳定的实时/历史曲线**；与 LiveCharts2 相比，它更"传统"但更省资源。

> [!def] 官方定义
> - **OxyPlot**：开源跨平台绘图库（MIT 协议），**非微软官方控件**，支持 WPF/Windows Forms/Avalonia/MAUI 等。WPF 包名 `OxyPlot.Wpf`。
> - 核心类型归属：`OxyPlot.PlotModel`（图表模型，数据与渲染的载体）、`OxyPlot.Series.LineSeries`（折线系列）、`OxyPlot.Axes.LinearAxis`（线性坐标轴）、`OxyPlot.Wpf.PlotView`（WPF 控件，`PlotView.Model` 挂模型）。
> - 关键用法：`model.Series.Add(lineSeries)`、`model.Axes.Add(axis)`，数据更新后 `PlotView.InvalidatePlot(true)` 请求重绘（`true` 表示同步刷新数据）。
> - 📖 官方文档：[OxyPlot 官网](https://oxyplot.org/)、[OxyPlot 文档](https://oxyplot.readthedocs.io/)

> [!origin] 由来背景
> OxyPlot 由开发者 obelisk 于 2010 年发起，初衷是给 .NET 提供一款**免费、开源、跨平台**的绘图库，弥补微软官方图表控件的缺失（WPF 原生没有官方 Chart 控件，Windows Forms 的 Chart 又不够灵活）。它采用"模型 + 渲染器"架构：`PlotModel` 与平台无关，各平台只提供 `PlotView` 控件与渲染实现——所以同一套模型代码可跑在 WPF、Avalonia、MAUI 上。十余年稳定维护、文档示例丰富，加上**零外部依赖、体积小**，让它成为老工控机、内网离线环境、嵌入式 .NET 场景的首选。如今它与 LiveCharts2 并列为 .NET 上位机曲线库两大主流。

> [!essentials] 核心要点
> - **NuGet 与命名空间**：`Install-Package OxyPlot.Wpf`，XAML 加 `xmlns:oxy="http://oxyplot.org/wpf"`，控件为 `oxy:PlotView`
> - **模型驱动四步**：建 `PlotModel` → 加 `LinearAxis`（Bottom/Left）→ 加 `LineSeries` → `Plot.Model = model`
> - **实时更新三连**：向 `_line.Points` 加新点 → 清理窗口旧点 → `Plot.InvalidatePlot(true)` 重绘
> - **滑动窗口控制点数**：`if (_points.Count > 100) _points.RemoveAt(0)`，不控制则曲线越来越密、内存上涨
> - **轴范围要固定**：`LinearAxis { Minimum = 0, Maximum = 100 }` 定死 Y 轴，防实时尖峰把曲线压扁
> - **`Points` 用 `Clear()` + `Add()` 增量维护**：不要每次重建整个列表，减少 GC 压力

> [!example] 完整示例
> **实时曲线演示：OxyPlot 折线图，200ms 追加一个数据点，滑动窗口只保留最近 100 个点：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:oxy="http://oxyplot.org/wpf"
>         Title="实时曲线-OxyPlot" Height="440" Width="640"
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
>         <oxy:PlotView x:Name="Plot" Grid.Row="2" Margin="5" Background="#0D1117"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package OxyPlot.Wpf
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Threading;
> using OxyPlot;
> using OxyPlot.Series;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly List<DataPoint> _points = new List<DataPoint>();  // 滑动窗口数据
>         private readonly LineSeries _line;                                 // 折线系列
>         private readonly DispatcherTimer _timer;
>         private readonly Random _rnd = new Random();
>         private int _index;                                                // 采样序号
>
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 构建曲线模型：折线 + 坐标轴
>             _line = new LineSeries
>             {
>                 Color = OxyColors.DeepSkyBlue,
>                 StrokeThickness = 2,
>                 MarkerType = MarkerType.None
>             };
>             var model = new PlotModel { Title = "温度实时曲线", TextColor = OxyColors.Gray };
>             model.Axes.Add(new LinearAxis { Position = AxisPosition.Bottom, Title = "采样点" });
>             model.Axes.Add(new LinearAxis { Position = AxisPosition.Left, Title = "温度(℃)", Minimum = 0, Maximum = 100 });
>             model.Series.Add(_line);
>             Plot.Model = model;
>
>             _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(200) };
>             _timer.Tick += OnTick;
>         }
>
>         // 每 200ms 追加一个点，超过 100 个移除最旧的(滑动窗口)
>         private void OnTick(object sender, EventArgs e)
>         {
>             _points.Add(new DataPoint(_index++, _rnd.Next(20, 60)));
>             if (_points.Count > 100) _points.RemoveAt(0);
>
>             _line.Points.Clear();                       // 清空旧点
>             foreach (var p in _points) _line.Points.Add(p);
>             Plot.InvalidatePlot(true);                  // 请求重绘曲线
>
>             ValueText.Text = $"当前温度：{_points[_points.Count - 1].Y} ℃";
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
> ✅ **轻量实时曲线**：单机、点位不多的实时趋势图，OxyPlot 加载快、内存占用小
> ✅ **老工控机/低配现场终端**：无 GPU、内存小，OxyPlot 纯 CPU 渲染也流畅
> ✅ **离线内网环境**：单 DLL 无传递依赖，拷进内网项目即可用，不受 NuGet 源限制
> ✅ **需要完全控制细节的历史曲线**：`PlotModel` 数据模型清晰，适合报表/打印类图表
> ❌ **需要手势缩放、十字光标等强交互**：OxyPlot 交互能力弱于 LiveCharts2，分析型界面优先 LiveCharts2（见 `实时曲线livecharts2`）
> ❌ **超大点数实时流（万点/秒）**：性能与 LiveCharts2（SkiaSharp 硬件加速）有差距

> [!pitfall] 常见踩坑
> 坑 1：**每次更新重建整个 `Points` 列表** → 现象：数据稍多就明显卡顿、GC 频繁 → 原因：频繁分配大对象 → 解决：`Clear()` + `Add()` 增量维护（示例写法），只在窗口滑动时移除头部
>
> 坑 2：**忘记 `InvalidatePlot`** → 现象：数据一直在加，画面纹丝不动 → 原因：`PlotView` 不会自动感知数据变化 → 解决：每次改完数据调 `Plot.InvalidatePlot(true)`；批量更新完只调一次，别每加一点调一次
>
> 坑 3：**后台线程直接操作 `PlotModel`/`Points`** → 现象：偶发跨线程异常、绘制错乱 → 原因：`PlotModel` 非线程安全，UI 渲染在 UI 线程 → 解决：数据在采集线程入队，UI 线程定时取出更新（见 `采集线程模型设计`）
>
> 坑 4：**Y 轴范围留空让曲线自动缩放** → 现象：一个异常尖峰把曲线压成一条直线，其余数据看不出趋势 → 原因：轴自动缩放被极端值带飞 → 解决：`Minimum`/`Maximum` 定死量程，数据先过 `数据过滤与清洗`

> [!best] 最佳实践
> - **模型与渲染分离**：`PlotModel` 的构建封装成 `BuildModel()`，`PlotView` 只负责显示，切换画面（实时/历史）只换 `Model`
> - **批量更新限流**：采集线程 10ms 一个点，UI 侧 200ms 一次 `InvalidatePlot`，一次把一批点画上去（对应 `采集线程模型设计` 的限流思路）
> - **窗口上限集中管理**：`const int MaxPoints = 100;`，与 LiveCharts2 示例保持一致的管理方式
> - **配色跟随主题**：`TextColor`/`Axisline` 与面板深色主题统一，多曲线时每条一个对比色（与 `仪表盘控件` 的颜色分区一致）
> - **历史大查询用 Decimator**：OxyPlot 内置 `Decimator.Decimate` 可对海量点降采样后再画，别把百万原始点灌进 `LineSeries`

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例观察曲线滚动；把 `Interval` 改成 50ms、`MaxPoints` 改成 300，观察流畅度与 LiveCharts2 示例的差异
> **Lv.2 加属性**：添加第二条 `LineSeries`（橙色，"压力"），并给每条曲线加 `MarkerType = MarkerType.Circle` 显示数据点
> **Lv.3 改造**：接入 `数据过滤与清洗` 的"原始值+平滑值"双曲线，用 OxyPlot 画出来对比平滑效果；再把 X 轴从"序号"改成"真实时间"（`DateTimeAxis`）
> **Lv.4 挑战**：实现"历史查询曲线"：从 `轻量级数据库-sqlite` 按时间范围查询数据，用 `Decimator.Decimate` 降采样后绘制，支持切换"最近 1 小时/1 天/1 周"三个按钮——对比 OxyPlot 与 LiveCharts2 在历史场景的取舍

> [!related] 相关知识链接
> - ← 前置知识：`数据转换与工程值计算`（曲线画工程值）、`数据过滤与清洗`（毛刺会撕裂曲线）
> - → 对比必读：`实时曲线livecharts2`（另一款图表库，交互更强）
> - ⇄ 关联概念：`时序数据库简介`（历史曲线的数据源与降采样）、`仪表盘控件`（单点值的仪表表达）、`数据解析字节序类型转换`（曲线前的数据链路）
> - 📖 官方文档：[OxyPlot 官网](https://oxyplot.org/)、[OxyPlot 文档](https://oxyplot.readthedocs.io/)、[OxyPlot GitHub](https://github.com/oxyplot/oxyplot)
