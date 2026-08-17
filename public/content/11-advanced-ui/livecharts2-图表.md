---
title: LiveCharts2 图表
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# LiveCharts2 图表

> [!plain] 白话理解
> LiveCharts2 是给 WPF 做**数据曲线图的现成画板**：你只管把数据喂给它（`Values` 绑定一个集合），它负责坐标轴、网格、缩放、动画全部细节。示例里温度曲线就是：建一条 `LineSeries<double>`（"车间温度"），`Values` 指向 `_temps` 集合，定时器每 500ms 往集合里加一个温度点——曲线自己滚动起来。它底层用 SkiaSharp 渲染（GPU 加速），所以几十上百个点也能流畅刷新。不用自己写 `OnRender` 画折线，把精力留给"数据从哪来"。

> [!def] 官方定义
> **LiveCharts2**（LiveChartsCore）是开源跨平台图表库（GitHub: beto-rodriguez/LiveCharts，作者 Beto Rodriguez），v2 基于 SkiaSharp 渲染，支持 WPF / WinUI / Avalonia / MAUI / Blazor 等多框架。WPF 使用需安装 NuGet 包 `LiveChartsCore.SkiaSharpView.WPF`，通过 `CartesianChart`/`PieChart`/`PolarChart` 等控件承载 `Series`（如 `LineSeries<T>`、`ColumnSeries<T>`），配合 `Axis`（`XAxes`/`YAxes`，支持 `MinLimit`/`MaxLimit`/`Labels`）与 `TooltipPosition`/`ZoomMode` 等交互配置。数据集合实现 `INotifyCollectionChanged`（如 `ObservableCollection<T>`）时图表自动增量刷新。详见官方仓库：https://github.com/beto-rodriguez/LiveCharts 。

> [!origin] 由来背景
> WPF 原生没有图表控件（2006 年随 .NET Framework 3.0 发布时只有 `Polyline` 这类绘图原语），上位机要画曲线只能自绘或引入第三方库。**LiveCharts** 第一代（v0，约 2017 年）用 GDI+ 渲染，轻量易用但性能与动画有限；作者 Beto Rodriguez 随后重写为 **LiveCharts2**（v2，约 2021 年起），底层换用 SkiaSharp（Google 的 2D 图形库，.NET 社区常用绑定），实现 GPU 加速渲染、流畅动画、更好的主题支持，并统一了多框架 API。如今它是 .NET 生态最流行的开源图表库之一，上位机实时曲线、历史趋势、统计分析都常用它。

> [!essentials] 核心要点
> - **安装与命名空间**：NuGet 包 `LiveChartsCore.SkiaSharpView.WPF`；XAML `xmlns:lvc="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"`（示例）
> - **图表控件**：`CartesianChart`（直角坐标：折线/柱状/散点）、`PieChart`（饼图）、`PolarChart`（极坐标）
> - **Series 配置**：`LineSeries<T>` 设 `Values`、`Name`、`Stroke`（`SolidColorPaint` + `SKColor`）、`Fill`（`null` 只描边）
> - **Axis 配置**：`XAxes`/`YAxes` 数组，`Name` 轴名、`MinLimit`/`MaxLimit` 范围、`Labels` 自定义刻度
> - **数据驱动刷新**：`Values` 绑定 `ObservableCollection<T>`，`Add`/`RemoveAt` 自动触发图表增量更新（示例滚动窗口）
> - **实时数据注意**：UI 线程更新集合（用 `DispatcherTimer` 或后台线程 `Dispatcher.Invoke` 调度）

> [!example] 完整示例
> **LiveCharts2 实时温度曲线演示：NuGet 安装 LiveChartsCore.SkiaSharpView.WPF 后，用 CartesianChart 绑定可观察集合，DispatacherTimer 定时追加数据点，实现上位机实时曲线：**
>
> **说明：先通过 NuGet 安装 `Install-Package LiveChartsCore.SkiaSharpView.WPF`。**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:lvc="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"
>         Title="LiveCharts2 实时温度曲线" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="LiveCharts2 实时曲线（NuGet：LiveChartsCore.SkiaSharpView.WPF）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <!-- CartesianChart 是绘图控件：Series 绑定数据，XAxes/YAxes 配置坐标轴 -->
>         <lvc:CartesianChart x:Name="Chart" Grid.Row="1" Margin="0,12,0,0"
>                             Background="#161B22"/>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="开始采集" Click="OnStart" Padding="12,6" Margin="0,0,10,0"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="停止采集" Click="OnStop" Padding="12,6" Margin="0,0,10,0"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="清空数据" Click="OnClear" Padding="12,6"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Collections.ObjectModel;
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
>         // 定时器：模拟数据采集线程（真实项目里应换成后台线程 + 调度回 UI）
>         private readonly DispatcherTimer _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
>         private readonly ObservableCollection<double> _temps = new ObservableCollection<double>();
>         private readonly Random _random = new Random();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Tick += OnTick;
>             Chart.Series = new ISeries[]
>             {
>                 new LineSeries<double>
>                 {
>                     Values = _temps,
>                     Name = "车间温度",
>                     Stroke = new SolidColorPaint(new SKColor(0x58, 0xA6, 0xFF), 2),
>                     Fill = null
>                 }
>             };
>             Chart.XAxes = new Axis[] { new Axis { Name = "采样点" } };
>             Chart.YAxes = new Axis[] { new Axis { Name = "温度 ℃", MinLimit = 0, MaxLimit = 120 } };
>         }
>
>         // 每个采样周期追加一个温度点，滚动窗口只保留最近 60 个点
>         private void OnTick(object sender, EventArgs e)
>         {
>             _temps.Add(60 + _random.NextDouble() * 40);
>             if (_temps.Count > 60) _temps.RemoveAt(0);
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e) => _timer.Start();
>         private void OnStop(object sender, RoutedEventArgs e) => _timer.Stop();
>         private void OnClear(object sender, RoutedEventArgs e) => _temps.Clear();
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 实时数据曲线：温度、压力、转速、流量随时间变化（示例场景）
> ✅ 历史趋势查询：从数据库/日志加载时间序列并绘图
> ✅ 统计分析：柱状图对比班产量、饼图展示故障占比
> ✅ 需要缩放/悬停查看数据点的交互式图表（`ZoomMode`、`TooltipPosition`）
> ❌ 数据点极少且样式固定的静态图（普通 `Polyline` 或图片更省事）
> ❌ 对包体积/启动时间敏感的低配工控机（SkiaSharp 原生依赖会增加部署复杂度）

> [!pitfall] 常见踩坑
> 坑 1：**后台线程更新 `ObservableCollection`** → 现象：实时采集时崩溃或图表不更新 → 原因：`Values` 绑定集合必须在 UI 线程改（`ObservableCollection` 非线程安全） → 解决：后台线程采集后 `Dispatcher.Invoke`/`BeginInvoke` 回 UI 线程再加点（示例用 `DispatcherTimer` 规避）
> 
> 坑 2：**点太多导致卡顿** → 现象：数据多了以后拖动/缩放大卡 → 原因：几万点全量渲染 → 解决：滚动窗口限制点数（示例保留 60 点）；或按采样间隔抽稀，`XAxes` 配 `MinStep` 控制刻度
>
> 坑 3：**包版本不一致（LiveChartsCore 与 SkiaSharp 冲突）** → 现象：编译报版本冲突或运行异常 → 原因：项目引用了多个版本的 SkiaSharp/LiveCharts 组件 → 解决：统一升级到同一大版本，用 NuGet 的"统一版本"或清理多余引用

> [!best] 最佳实践
> - 实时曲线用"滚动窗口 + 固定点数"（示例保留 60 点），长期运行内存稳定
> - 数据更新走 UI 线程（`DispatcherTimer`/`Dispatcher.Invoke`），曲线数据与采集线程解耦
> - 曲线样式（`Stroke`/`Fill`）统一配置；多通道曲线用不同 `Name` 并配图例，颜色选工控高对比色
> - Y 轴设置合理范围（`MinLimit`/`MaxLimit`），避免数据突变时曲线被压扁
> - 与 ViewModel 解耦：`Series` 在 View 层构建，数据源来自 VM 的可观察集合，便于替换采集源

> [!practice] 上手练习
> **Lv.1 照猫画虎**：安装 `LiveChartsCore.SkiaSharpView.WPF`，运行示例点"开始采集"观察温度曲线滚动；把采样间隔改成 200ms 看刷新频率变化
> **Lv.2 小试牛刀**：添加第二条 `LineSeries<double>`（压力曲线，不同颜色），并给 X 轴配 `Labels` 显示时间刻度
> **Lv.3 融会贯通**：开启 `Chart.ZoomMode = ZoomAndPanMode.X`，悬停查看数据点 Tooltip；把曲线改成 `StepLineSeries` 观察差异
> **Lv.4 拆层挑战**：把采集端改为后台 `Task` + `Channel` 生产温度数据，UI 线程 `Dispatcher` 消费并更新曲线，验证真实采集场景下的线程模型（结合 `08-threading`）

> [!related] 相关知识链接
> - ← 前置知识：「第 8 章·DispatcherTimer」「dispatchertimer」（定时采集驱动）、「第 5 章·数据绑定」「什么是数据绑定」（集合绑定）
> - → 后续必学：`多屏适配拼接屏场景`（大屏图表布局）、`控件重绘（OnRender）`（需要自绘图表时的对比方案）
> - ⇄ 关联概念：`handycontrol`（Gauge 仪表盘与图表搭配看板）、`materialdesigninxaml`（图表配色与主题库协调）
> - 📖 官方文档：LiveCharts GitHub：https://github.com/beto-rodriguez/LiveCharts ；LiveCharts2 文档：https://lvcharts.com/ ；NuGet：https://www.nuget.org/packages/LiveChartsCore.SkiaSharpView.WPF
