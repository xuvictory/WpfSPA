---
title: 开源 SCADA 项目
section: 16-resources
parent: 16.2 上位机相关开源项目
---

# 开源 SCADA 项目

> [!plain] 白话理解
> 单台设备用上位机管就够了，但一个车间几十台设备、几百个点位，还要求"实时监控 + 报警 + 历史曲线 + 报表"，就得靠 **SCADA**（数据采集与监控系统）这种"工业界的大管家"了。**开源 SCADA 项目**就是把这套系统开源出来：它替你接好设备、存好数据、画好趋势，你只需要配置点位和画面。相当于买了一套"精装房"，改改布局就能住。

> [!def] 官方定义
> **SCADA**（Supervisory Control And Data Acquisition，数据采集与监控系统）是工业自动化领域的通用概念，指对现场设备进行**数据采集、实时监控、报警管理、历史存储与趋势分析**的软件系统。**开源 SCADA 项目**是社区实现的这类系统，常见代表：
> - **Rapid SCADA**（GitHub：https://github.com/RapidScada/scada ，官网：https://rapidscada.net/ ）：免费的工业自动化平台，提供数据采集（通信驱动）、实时监控、历史趋势、Web 发布与报表，基于 .NET
> - **Scada-LTS**（https://github.com/SCADA-LTS/Scada-LTS ）：Java 实现的现代化开源 SCADA，带 Web 界面
> - **FUXA**（https://github.com/frangoteam/FUXA ）：Node.js 实现、基于 Web 的 SCADA，支持设备接入与仪表盘设计
>
> 注意：SCADA 不是微软官方的 WPF 概念，微软在工业领域提供的是 Azure IoT 等云平台（https://learn.microsoft.com/zh-cn/azure/iot-central/overview-iot-central ），本地/私有化 SCADA 则多由第三方开源或商业厂商提供。

> [!origin] 由来背景
> SCADA 概念起源于 20 世纪 60-70 年代的电力/管网调度系统，当时是专用硬件 + 大屏监控。进入互联网时代后，SCADA 软件化、标准化，**Rapid SCADA** 等开源项目应运而生——它最初由俄罗斯开发者（OpenSCADA 生态的一部分思想）发起，面向中小型工控现场提供"免费、可私有化部署"的采集监控方案。开源 SCADA 让小型工厂也能用上过去只有大型 DCS/SCADA 厂商才提供的监控能力。对上位机开发者而言，它们是**研究"采集-存储-展示"分层架构**的绝佳参考。

> [!essentials] 核心要点
> - **架构分层**：SCADA 通常分"通信驱动（采集）→ 实时库（点位缓存）→ 服务端（报警/历史）→ 客户端（画面/趋势）"
> - **点位（Tag/Point）**：每个采集值是一个点位，配置"地址、类型、缩放、上下限、报警规则"
> - **实时监控画面**：工艺流程图（管网、设备图元）绑定点位，颜色/状态随数据变化
> - **历史存储与趋势**：点位数据定时入库，支持回放曲线与报表导出
> - **报警管理**：越限/变化报警 → 弹窗、声音、事件记录、确认机制
> - **Web/多端发布**：现代开源 SCADA 普遍支持 Web 端浏览，现场大屏、办公室电脑都能看

> [!example] 完整示例
> **SCADA 设备监控主画面：状态指示灯与实时数据刷新演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SCADA 监控主画面" Height="460" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="车间设备 SCADA 监控" Foreground="#58A6FF" FontSize="18"
>                    FontWeight="Bold" Margin="0,0,0,12"/>
>         <UniformGrid Grid.Row="1" Columns="3" Margin="0,0,0,12">
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="1 号泵" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="Pump1Dot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="Pump1Text" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="Pump1Speed" Text="0 RPM" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="2 号泵" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="Pump2Dot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="Pump2Text" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="Pump2Speed" Text="0 RPM" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="空压机" Foreground="#8B949E" FontSize="13"/>
>                     <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>                         <Ellipse x:Name="CompDot" Width="12" Height="12" Fill="#DA3633" Margin="0,0,6,0"/>
>                         <TextBlock x:Name="CompText" Text="停止" Foreground="#8B949E"/>
>                     </StackPanel>
>                     <TextBlock x:Name="CompPress" Text="0.00 MPa" Foreground="White" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>         </UniformGrid>
>         <Border Grid.Row="2" Background="#161B22" Padding="10" CornerRadius="6">
>             <DockPanel>
>                 <Button Content="启动 / 停止巡检" Click="OnToggleClick" DockPanel.Dock="Top"
>                         Padding="8" Background="#21262D" Foreground="White" Margin="0,0,0,8"/>
>                 <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"/>
>             </DockPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Shapes;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 定时器模拟 PLC / 采集站推送的实时数据
>         private readonly DispatcherTimer _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         private readonly Random _random = new Random();
>         private bool _running;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Tick += OnTimerTick;
>         }
>
>         private void OnToggleClick(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             _timer.IsEnabled = _running;
>             LogText.Text = _running ? "开始采集，实时刷新设备状态 ..." : "已停止采集";
>         }
>
>         private void OnTimerTick(object sender, EventArgs e)
>         {
>             // 模拟 1 号泵运行、2 号泵待机、空压机压力波动
>             UpdateDevice(Pump1Dot, Pump1Text, Pump1Speed, true, _random.Next(1200, 1500) + " RPM");
>             UpdateDevice(Pump2Dot, Pump2Text, Pump2Speed, false, "0 RPM");
>
>             var pressure = _random.Next(30, 80) / 10.0;
>             CompPress.Text = pressure.ToString("F2") + " MPa";
>             CompDot.Fill = pressure > 0.5 ? Brushes.LimeGreen : Brushes.OrangeRed;
>             CompText.Text = pressure > 0.5 ? "运行" : "低压";
>         }
>
>         private void UpdateDevice(Ellipse dot, TextBlock state, TextBlock speed, bool running, string speedText)
>         {
>             // 统一的设备状态刷新逻辑：运行=绿色，停止=红色
>             dot.Fill = running ? Brushes.LimeGreen : Brushes.OrangeRed;
>             state.Text = running ? "运行" : "停止";
>             state.Foreground = running ? Brushes.LimeGreen : Brushes.Gray;
>             speed.Text = speedText;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 车间级多设备集中监控（几十上百个点位）
> ✅ 需要历史趋势、报警记录、报表的正式交付项目
> ✅ 研究"采集→存储→展示"分层架构的参考源码
> ✅ 需要 Web 大屏多端查看的产线场景（选 Web 类开源 SCADA）
> ❌ 单台设备、几个点位的简单上位机（SCADA 平台反而笨重）
> ❌ 对私有协议深度定制、需完全掌控采集逻辑的项目（自研更合适）

> [!pitfall] 常见踩坑
> 坑 1：**选型不当导致二次开发困难** → 现象：拿 Web SCADA 改本地需求，处处受限 → 原因：没分清技术栈与场景（Web vs 桌面、采集能力、协议支持） → 解决：先列需求清单（设备协议、点数、历史周期、部署环境），再对比 Rapid SCADA/Scada-LTS/FUXA 等再定
>
> 坑 2：**历史库膨胀拖慢系统** → 现象：跑半年后查询历史曲线很慢 → 原因：历史表无分区/无归档策略 → 解决：按天/按月分表，定时归档压缩，查询加时间索引
>
> 坑 3：**设备掉线后点位数据"冻结"** → 现象：PLC 断电后画面还显示旧值 → 原因：没做"数据质量/时间戳"标记 → 解决：点位带时间戳与质量位，超时标记为"失效"，画面显示灰态而非旧值

> [!best] 最佳实践
> - 先评估"开源免费 + 二次开发成本"是否小于"自研成本"，再决定选型
> - 点位设计先行：地址、类型、缩放、报警阈值集中配置，避免散落代码
> - 采集层与展示层分离：采集入库服务独立进程，画面崩溃不影响采集
> - 历史数据定期归档与清理，设定保留策略（如生产数据留 3 年、原始数据留 30 天）
> - 用 `mqttnet` 做采集层与上层消息总线，配合开源 SCADA 或自研监控端

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把巡检间隔改成 500ms，观察刷新频率变化
> **Lv.2 小试牛刀**：给示例加一个"低压报警"状态，压力低于 0.3 MPa 时报警闪烁
> **Lv.3 融会贯通**：用 `dapper` 把每次巡检的点位值写入 SQLite，实现历史数据落库
> **Lv.4 拆层挑战**：参考开源 SCADA 分层，把示例拆成"采集服务（定时轮询 + 日志）+ 实时缓存 + WPF 监控端（绑定刷新）"，并用 `mqttnet` 在两层之间传数据

> [!related] 相关知识链接
> - ← 前置知识：[`开源-plc-通信库`](开源-plc-通信库)（采集层）、[`mqttnet`](mqttnet)（消息总线）
> - → 后续必学：[`工控看板模板项目`](工控看板模板项目)（展示层参考）
> - ⇄ 关联概念：[`dapper`](dapper)（历史数据存储）、`上位机日志场景`（12）
> - 📖 官方文档：Rapid SCADA https://rapidscada.net/ ；FUXA https://github.com/frangoteam/FUXA
