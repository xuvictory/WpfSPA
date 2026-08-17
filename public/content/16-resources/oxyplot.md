---
title: OxyPlot
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# OxyPlot

> [!plain] 白话理解
> 如果说 LiveCharts2 是"动感十足的实时曲线仪表盘"，那么 **OxyPlot** 就是"严谨务实的数据绘图仪"——它轻量、稳定、功能扎实，画静态趋势图、极坐标图、等高线、光谱图都很在行。上位机里"打印报表、画历史趋势、分析振动频谱"这类**不追求炫酷、追求准确**的场景，用它正合适，体积小、依赖少。

> [!def] 官方定义
> **OxyPlot** 是一个**社区开源**的 .NET 跨平台绘图库（GitHub：https://github.com/oxyplot/oxyplot ，NuGet：`OxyPlot.Wpf`），采用 MIT 许可证，支持 WPF、WinForms、Avalonia、GTK、UWP 及 Xamarin 等平台。它**不是微软官方库**，而是独立社区项目，以稳定、轻量、文档齐全著称。核心模型在 `OxyPlot` 程序集（`PlotModel`、`LineSeries`、`Axis`），平台程序集（如 `OxyPlot.Wpf`）只负责渲染，这种"模型与渲染分离"的设计让同一份绘图代码可在多个平台复用。微软官方 WPF 本身没有内置图表控件，需要自行选择第三方库或使用 `https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/graphics-multimedia/` 提供的画布级 API 手绘，而 OxyPlot 这类库则把常见图表类型封装好。

> [!origin] 由来背景
> OxyPlot 起源于 2010 年前后挪威的一个科研/工程领域需求，作者 Ole Oymoen 起初在博客分享一个精简的绘图控件，后来逐步演进为跨平台开源库。项目在 2015 年正式迁入 oxyplot 组织并持续维护至今，是 .NET 生态里存活时间长、API 稳定的老牌绘图库。上位机与仪器仪表行业常用它做**频谱分析、振动曲线、趋势报表**等对渲染性能与坐标精度要求高的场景。

> [!essentials] 核心要点
> - **模型驱动**：一切围绕 `PlotModel`：加 `LineSeries`、配 `LinearAxis`/`DateTimeAxis` 轴，最后赋给 `PlotView.Model`
> - **平台解耦**：`OxyPlot` 核心程序集与 `OxyPlot.Wpf` 渲染程序集分离，纯模型代码可在多平台复用
> - **坐标轴**：`LinearAxis`（数值轴）、`DateTimeAxis`（时间轴，`StringFormat = "HH:mm:ss"` 格式化）、`LogarithmicAxis`（对数轴，适合频谱）
> - **交互**：`PlotView` 默认支持滚轮缩放、右键平移、鼠标悬停数据点，无需额外配置
> - **导出图片**：`PlotModel` 可通过 `PngExporter`/`SvgExporter` 导出 PNG/SVG，适合做报表
> - **性能**：数据点可只绘制可见区域（`MinimumSegmentLength`），大点数曲线也流畅

> [!example] 完整示例
> **OxyPlot 绘制温度-压力历史趋势图：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:oxy="http://oxyplot.org/wpf"
>         Title="OxyPlot 趋势图" Height="420" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="温度 - 压力历史趋势（OxyPlot）" Foreground="#58A6FF"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <oxy:PlotView x:Name="Plot" Grid.Row="1"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using OxyPlot;
> using OxyPlot.Axes;
> using OxyPlot.Series;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 OxyPlot.Wpf 包（Install-Package OxyPlot.Wpf）
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 造一份模拟历史数据：温度 100±10℃，压力 0.6±0.1 MPa
>             var temperature = new LineSeries { Title = "温度(℃)", Color = OxyColors.LimeGreen };
>             var pressure = new LineSeries { Title = "压力(MPa)", Color = OxyColors.Orange };
>             var random = new Random();
>             for (int i = 0; i < 120; i++)
>             {
>                 double t = DateTime.Today.AddMinutes(i * 5).ToOADate();
>                 temperature.Points.Add(new DataPoint(t, 100 + random.NextDouble() * 20));
>                 pressure.Points.Add(new DataPoint(t, 0.6 + random.NextDouble() * 0.2));
>             }
>
>             var model = new PlotModel { Title = "设备运行趋势" };
>             model.Axes.Add(new DateTimeAxis
>             {
>                 Position = AxisPosition.Bottom,
>                 StringFormat = "HH:mm"
>             });
>             model.Axes.Add(new LinearAxis { Position = AxisPosition.Left });
>             model.Series.Add(temperature);
>             model.Series.Add(pressure);
>             Plot.Model = model;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 历史趋势回放与报表图表（导出 PNG/SVG）
> ✅ 频谱分析、振动曲线（对数轴、极坐标）
> ✅ 温度-压力等多通道静态数据对比
> ✅ 需要把同一绘图模型移植到 Avalonia/WinForms 的跨平台项目
> ❌ 需要高帧率实时滚动曲线（LiveCharts2 更合适）
> ❌ 需要触摸大屏上极复杂交互交互图表（可考虑商业控件）

> [!pitfall] 常见踩坑
> 坑 1：**日期轴显示乱码/时间格式不对** → 现象：X 轴显示 `43789.5` 之类的浮点数 → 原因：`DataPoint.X` 用了 OADate 数值，但轴没设置 `DateTimeAxis` → 解决：轴改为 `DateTimeAxis` 并设 `StringFormat`，数据点 X 值用 `ToOADate()`
>
> 坑 2：**实时追加数据卡顿** → 现象：每秒追加几百点后缩放拖动明显掉帧 → 原因：点集无限增长 + 每次都全量重绘 → 解决：只保留滑动窗口数据点，并设置 `LineSeries.TrackerFormatString` 精简提示；极端情况关闭 `PlotView` 的同步刷新节流重绘
>
> 坑 3：**导出图片中文乱码** → 现象：`PngExporter` 导出后中文标题是方块 → 原因：PNG 导出默认字体不含中文字形 → 解决：`PngExporter` 输出前在 `TextMeasurer` 或 `PlotModel` 上指定支持中文的字体（如 `Microsoft YaHei`）

> [!best] 最佳实践
> - 固定滑动窗口 + 只添加可见范围内的数据点，保证大点数性能
> - 用 `DateTimeAxis` 管理时间轴，避免手写 OADate 转换出错
> - 报表场景优先导出 SVG（矢量、无限放大不失真），再按需转 PNG
> - 多系列配色固定成规范（温度绿、压力橙、转速蓝），跨页面一致
> - 模型与渲染分离：把 `PlotModel` 构建逻辑放独立类，便于单元测试与跨平台复用

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把压力曲线改成蓝色并隐藏图例
> **Lv.2 小试牛刀**：为图表增加 Y 轴副轴（`Secondary`），把压力和温度分轴显示
> **Lv.3 融会贯通**：把数据源换成真实采集（每 5 分钟一个历史点），并加"导出 PNG"按钮
> **Lv.4 拆层挑战**：把 `PlotModel` 构建封装成 `TrendChartBuilder`，支持温度/压力/流量三种图表类型，并用单元测试验证轴配置正确

> [!related] 相关知识链接
> - ← 前置知识：`什么是-mvvm`（07，数据绑定）、第 12 章（依赖注入/架构分层）
> - ⇄ 关联概念：[`livecharts2`](livecharts2)（实时曲线选型对比）、[`日志与工具类-nuget-包`](日志与工具类-nuget-包)
> - 📖 官方文档：https://oxyplot.readthedocs.io/ ；GitHub：https://github.com/oxyplot/oxyplot
