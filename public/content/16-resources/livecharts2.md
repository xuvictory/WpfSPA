---
title: LiveCharts2
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# LiveCharts2

> [!plain] 白话理解
> 上位机界面的灵魂是**实时曲线**——温度、压力、转速随时间跳动。**LiveCharts2** 就是专门画这种动态图表的控件库：你只管往列表里"喂数据"，它负责把曲线画得又快又顺滑，还支持缩放、悬停提示、图例。相比老一代图表库，它基于 SkiaSharp 跨平台渲染，**曲线数据量大、刷新频繁也不卡**，是新一代上位机可视化的首选。

> [!def] 官方定义
> **LiveCharts2** 是一个**社区开源**的跨平台数据可视化库（GitHub：https://github.com/beto-rodriguez/LiveCharts2 ，NuGet：`LiveChartsCore.SkiaSharpView.WPF`），由 Alberto Rodríguez 开发维护。它基于 SkiaSharp 渲染，支持 WPF/WinForms/Avalonia/MAUI 等平台，提供折线图、柱状图、饼图、极坐标图、热力图等类型，且**数据绑定友好**——修改集合即自动刷新，无需手动调重绘。它**不是微软官方库**，但与微软官方 WPF 的 `DataBinding`（见 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/ ）深度配合：`Series.Values` 绑定到 `ObservableCollection` 即可驱动实时刷新。

> [!origin] 由来背景
> LiveCharts 第一代（LiveCharts.Wpf）诞生于 2015 年前后，因为使用简单在 WPF 社区流行，但底层基于 WPF 自带渲染，数据量大时性能不足、且多年维护缓慢。作者于 **2021 年起重写为 LiveCharts2**，改用 SkiaSharp 直接绘制，换来跨平台与高帧率，同时保留了"给数据就能画"的易用接口。LiveCharts2 文档站：https://lvcharts.com/ 。上位机场景对它尤为关注：实时采样点每秒几十个、曲线窗口滑动刷新，正是它相对老库的强项。

> [!essentials] 核心要点
> - **核心类型**：`CartesianChart` 控件 + `LineSeries<T>`/`ColumnSeries<T>` 系列，`Values` 承载数据
> - **实时刷新**：`Values` 用 `ObservablePoint`/`ObservableCollection`，数据变化图表自动更新，无需手动 `Refresh`
> - **外观定制**：`Stroke = new SolidColorPaint(SKColors.LimeGreen, 2)` 设置线宽与颜色，`Fill = null` 去掉面积填充
> - **X/Y 轴**：`Axis` 配置 `Labeler` 格式化刻度（如 `v => v + " ℃"`）
> - **窗口滑动**：只保留最近 N 个点（`_points.RemoveAt(0)`），形成滚动窗口，避免内存与渲染膨胀
> - **动画开关**：实时刷新建议 `AnimationsSpeed = TimeSpan.Zero` 关闭插值动画，避免动画帧堆积卡顿

> [!example] 完整示例
> **LiveCharts2 实时折线图：模拟温度传感器数据采样：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:lvc="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"
>         Title="LiveCharts2 实时曲线" Height="420" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
>             <TextBlock Text="1 号炉温度实时监控" Foreground="#58A6FF" FontWeight="Bold"
>                        VerticalAlignment="Center" Margin="0,0,20,0"/>
>             <TextBlock x:Name="TempText" Text="0.0 ℃" Foreground="White" FontSize="20"
>                        VerticalAlignment="Center"/>
>         </StackPanel>
>         <lvc:CartesianChart x:Name="Chart" Grid.Row="1"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
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
>         // 需通过 NuGet 安装 LiveChartsCore.SkiaSharpView.WPF 包
>         private readonly List<ObservablePoint> _points = new List<ObservablePoint>();
>         private readonly Random _random = new Random();
>         private readonly DispatcherTimer _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         private int _index;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 初始化曲线：x 为采样序号，y 为温度值
>             Chart.Series = new ISeries[]
>             {
>                 new LineSeries<ObservablePoint>
>                 {
>                     Values = _points,
>                     Stroke = new SolidColorPaint(SKColors.LimeGreen, 2),
>                     Fill = null,
>                     GeometrySize = 4
>                 }
>             };
>
>             _timer.Tick += OnTimerTick;
>             _timer.Start();
>         }
>
>         private void OnTimerTick(object sender, EventArgs e)
>         {
>             // 模拟温度传感器采样，每 1 秒追加一个点
>             var temperature = 100 + _random.Next(-10, 10) * 0.5;
>             _points.Add(new ObservablePoint(_index++, Math.Round(temperature, 1)));
>             if (_points.Count > 60)
>             {
>                 _points.RemoveAt(0);   // 只保留最近 60 个点，形成滑动窗口
>             }
>
>             TempText.Text = temperature.ToString("F1") + " ℃";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 设备实时曲线监控（温度、压力、电流、转速）
> ✅ 历史数据回放与趋势分析（日期轴 + 多系列对比）
> ✅ 能耗统计、产量统计的柱状图/饼图看板
> ✅ 需要跨平台复用同一套图表代码的项目（WPF/Avalonia/MAUI）
> ❌ 只需静态打印图表、不带交互的报表（导出图片用 OxyPlot 更轻）
> ❌ 项目仍锁定旧版 LiveCharts.Wpf 且无迁移计划的存量代码

> [!pitfall] 常见踩坑
> 坑 1：**数据点多了后界面卡顿** → 现象：跑半小时后曲线刷新越来越慢、内存上涨 → 原因：集合无限增长 + 默认插值动画 → 解决：只保留最近 N 个点（滑动窗口），并设置 `AnimationsSpeed = TimeSpan.Zero` 关闭实时动画
>
> 坑 2：**在后台线程改 Values 崩溃或图表不更新** → 现象：通信线程收到数据直接 `Add` 到集合，程序偶发异常或曲线不动 → 原因：LiveCharts2 与 WPF 一样要求 UI 线程更新 → 解决：数据在后台线程解析后，用 `Dispatcher.Invoke` 切回 UI 线程再追加（见第 8 章异步）
>
> 坑 3：**工具提示/坐标显示为数字而非业务单位** → 现象：Y 轴显示 `100.0000001` 之类的长小数 → 原因：没配置 `Labeler` 格式化 → 解决：在 `Axis` 上设置 `Labeler = value => value.ToString("F1") + " ℃"`

> [!best] 最佳实践
> - 实时曲线固定滑动窗口长度（如 60~600 点），防止数据无限堆积
> - 实时刷新关闭动画（`AnimationsSpeed = TimeSpan.Zero`），历史回放再开动画
> - 用 `ObservablePoint` 直接修改 `Y` 值实现"定点更新"，比删掉重加更高效
> - 多通道曲线用不同 `Stroke` 颜色 + `LegendPosition` 图例，一眼区分通道
> - 大屏看板配合 `livecharts2` 的 `GeoMap` 做厂区地图数据叠加

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把滑动窗口从 60 改成 200 个点，观察曲线形态与流畅度
> **Lv.2 小试牛刀**：给示例再加一条"目标温度"水平线或第二条通道曲线，用不同颜色区分
> **Lv.3 融会贯通**：把温度数据源替换成真实通信层回调（Modbus 读寄存器），实现真实设备实时曲线
> **Lv.4 拆层挑战**：用 MVVM 把"采集器→缓冲队列→图表消费"拆成独立层，图表只绑定 `ObservableCollection`，实现数据与 UI 解耦

> [!related] 相关知识链接
> - ← 前置知识：`什么是-mvvm`（07，数据绑定基础）、第 8 章（异步与 UI 线程）
> - → 后续必学：[`oxyplot`](oxyplot)（轻量静态绘图的备选方案）
> - ⇄ 关联概念：[`handycontrol`](handycontrol)、[`materialdesigninxaml`](materialdesigninxaml)（界面美化搭配）
> - 📖 官方文档：https://lvcharts.com/ ；GitHub：https://github.com/beto-rodriguez/LiveCharts2
