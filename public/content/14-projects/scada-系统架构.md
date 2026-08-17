---
title: SCADA 系统架构
section: 14-projects
parent: 14.7 项目七：SCADA 综合监控系统（高级）
---

# SCADA 系统架构

> [!plain] 白话理解
> SCADA 就是工厂的"中央指挥中心"：把分散在车间各处的 PLC、传感器、仪表的数据全部汇聚到一起，供大屏、报警、报表统一使用。它的核心不是某个界面，而是中间那层**实时数据库**——所有采集到的数据先按"点位"登记入库，画面、报警再去库里取。
> 一个点位就是一条数据记录：**点名**（`TEMP-1 反应釜温度`）、**当前值**（`75.2 ℃`）、**质量戳**（`Good`）。质量戳特别重要：它告诉画面"这条数据可信吗"——通信中断时质量戳变 `Bad`，画面就应该显示异常而不是继续用旧值。示例点"模拟点位刷新"，就是采集层往实时库写值的动作；`ObservableCollection` 让 DataGrid 自动跟着更新。理解了"点位 + 实时库"，就抓住了 SCADA 的牛鼻子。

> [!def] 官方定义
> **SCADA**（Supervisory Control and Data Acquisition，数据采集与监视控制）是对分布广泛的工业过程进行集中监视与控制的系统。经典架构为**四层**：
> - **监控层**（HMI）：组态画面、报警、报表；
> - **实时数据库层**（Real-time Database, RTDB）：以**点位**（Tag/TagPoint）为核心组织实时数据，点位模型含点名、值、**质量戳**（Quality）、时间戳；
> - **采集层**（Drivers）：OPC UA、Modbus 等通信驱动，负责与现场设备交互；
> - **现场层**（Field）：PLC、传感器、仪表、执行器。
> 质量戳沿用 OPC 规范概念（Good/Bad/Uncertain），是判断数据可用性的重要信息。参考 OPC 基金会 https://opcfoundation.org/

> [!origin] 由来背景
> SCADA 诞生于 1960-70 年代的公用事业领域：电力、水务、油气管道站点分散且无人值守，需要**遥测（Telemetry）与遥控**——现场用 RTU（远程终端单元）采集数据，经有线/无线信道送回调度中心。1970-80 年代随计算机化演进为集中式 SCADA，90 年代后融入 DCS（集散控制）思想与 OPC 标准，现代 SCADA 普遍基于以太网 + OPC UA 互联。
> "实时数据库"正是 SCADA 区别于普通上位机的关键：现场数千点数据必须极快写入、按点名查询，供画面/报警/报表并发读取，普通关系库扛不住这种高频读写。而"质量戳"源自 OPC 规范——通信中断、量程溢出时数据必须被标记，避免监控画面"骗人"。本篇示例用 DataGrid 展示了点位表的形态，把它换成真正的实时库（或高吞吐内存表）就是企业级 SCADA 的数据骨架。

> [!essentials] 核心要点
> - **四层职责**：监控层展示、实时库层存取、采集层通信、现场层设备，各层单向依赖、可独立替换
> - **点位模型**：`TagPoint`（点名/值/质量戳）是 SCADA 数据核心，一切画面、报警、报表都从点位取数
> - **质量戳语义**：通信中断/异常时质量戳为 `Bad`，监控画面据此显示异常，而非继续信任旧值
> - **实时库 vs 历史库**：实时库只存最新值（点位表），历史数据另存历史库（见「历史趋势与报表」），职责分离
> - **ObservableCollection**：采集层写点位 → UI 自动刷新，免手动刷新 DataGrid，与 MVVM 数据驱动一致

> [!example] 完整示例
> **SCADA 系统架构演示：自上而下展示"监控层 → 实时库层 → 采集层 → 现场层"四层架构，并用实时数据库点位表展示"点名 + 当前值 + 质量戳"这一 SCADA 数据流核心：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SCADA 系统架构" Height="460" Width="580"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="SCADA 经典分层架构" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <!-- 层次示意 -->
>         <StackPanel Grid.Row="1">
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="0,2">
>                 <TextBlock Text="监控层：组态画面 / 报警 / 报表" Foreground="#58A6FF"/>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="0,2">
>                 <TextBlock Text="实时库层：点位表 + 数据刷新" Foreground="#8B949E"/>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="0,2">
>                 <TextBlock Text="采集层：OPC UA / Modbus 驱动" Foreground="#8B949E"/>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="0,2">
>                 <TextBlock Text="现场层：PLC / 传感器 / 仪表" Foreground="#8B949E"/>
>             </Border>
>         </StackPanel>
>         <!-- 实时库点位表 -->
>         <DataGrid Grid.Row="2" x:Name="TagGrid" AutoGenerateColumns="False" IsReadOnly="True"
>                   Background="#161B22" Foreground="#8B949E" BorderThickness="0" Margin="0,10"
>                   HeadersVisibility="Column" RowHeight="26">
>             <DataGrid.Columns>
>                 <DataGridTextColumn Header="点名" Binding="{Binding Tag}" Width="*"/>
>                 <DataGridTextColumn Header="当前值" Binding="{Binding Value}" Width="*"/>
>                 <DataGridTextColumn Header="质量戳" Binding="{Binding Quality}" Width="*"/>
>             </DataGrid.Columns>
>         </DataGrid>
>         <StackPanel Grid.Row="3" Orientation="Horizontal" Margin="0,6,0,0">
>             <Button Content="模拟点位刷新" Click="OnRefresh" Padding="8"
>                     Background="#21262D" Foreground="White"/>
>             <TextBlock x:Name="StatusText" Text="就绪" Foreground="#8B949E"
>                        VerticalAlignment="Center" Margin="12,0,0,0"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.ObjectModel;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 实时数据库点位：SCADA 的数据核心模型（点名 / 值 / 质量戳）
>     public class TagPoint
>     {
>         public string Tag { get; set; }
>         public string Value { get; set; }
>         public string Quality { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         private readonly Random _rand = new Random();
>         private readonly ObservableCollection<TagPoint> _tags = new ObservableCollection<TagPoint>();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 初始化点位表：实际项目由组态工具定义，采集层驱动写入
>             _tags.Add(new TagPoint { Tag = "TEMP-1 反应釜温度", Value = "75.2 ℃", Quality = "Good" });
>             _tags.Add(new TagPoint { Tag = "PRESS-2 管道压力", Value = "5.8 MPa", Quality = "Good" });
>             _tags.Add(new TagPoint { Tag = "FLOW-3 进料流量", Value = "120.5 m³/h", Quality = "Good" });
>             TagGrid.ItemsSource = _tags;
>         }
>
>         // 模拟采集层写入实时库：值变化 + 质量戳刷新（ObservableCollection 自动更新 UI）
>         private void OnRefresh(object sender, RoutedEventArgs e)
>         {
>             _tags[0].Value = $"{70 + _rand.NextDouble() * 10:F1} ℃";
>             _tags[1].Value = $"{5 + _rand.NextDouble() * 2:F1} MPa";
>             _tags[2].Value = $"{100 + _rand.NextDouble() * 40:F1} m³/h";
>             // 偶尔模拟坏质量（通信中断时质量戳应为 Bad）
>             _tags[1].Quality = _rand.Next(5) == 0 ? "Bad" : "Good";
>             StatusText.Text = $"实时库刷新 {DateTime.Now:HH:mm:ss}";
>             StatusText.Foreground = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>         }
>     }
> }
> ```
> 
> 

> [!scene] 适用场景
> ✅ 多车间/多产线集中监控：分散 PLC 点位汇聚到中控室，统一监控、报警、报表
> ✅ 能源/水务/楼宇等广域监控：站点分散、无人值守，SCADA 的遥测遥控模型天然适用
> ✅ 大型系统分模块建设：点位建模先行，画面、报警、报表各自消费点位，可并行开发
> ✅ 与 MES/ERP 对接：SCADA 实时数据 + 质量戳供上层系统做生产分析
> ❌ 单设备小上位机：几个点位直接「看板-ui-与读写功能」就够了，上 SCADA 架构是杀鸡用牛刀
> ❌ 无需长期监控与追溯的临时工具：实时库、历史库、报警引擎都是多余建设

> [!pitfall] 常见踩坑
> 坑 1：**把实时库当历史库用**（点位表越积越长、查询越来越慢）→ 实时库只存最新值，历史数据必须进独立历史库（见「历史趋势与报表」），两者读写模型完全不同
>
> 坑 2：**忽略质量戳，通信中断仍显示旧值** → 现场断线了监控画面却显示"正常"，操作工被误导 → 质量戳 `Bad` 时画面显示"通信中断"或置灰，值不可信就不展示
>
> 坑 3：**采集层直接改 UI**（驱动代码里操作控件）→ 层间耦合，换驱动要改界面 → 采集层只写实时库点位，界面绑定点位自动刷新（ObservableCollection/MVVM）
>
> 坑 4：**点位命名混乱**（`TEMP1`、`temp_1`、`温度1`混用）→ 点位表无法维护、历史查询对不上 → 点位命名规范（如 `设备_参数_编号`），组态时统一登记注册

> [!best] 最佳实践
> - 点位是 SCADA 的"唯一事实源"：点名、单位、量程、报警阈值都在组态时定义，画面/报警/报表统一引用
> - 质量戳贯穿始终：采集写入、实时库存储、画面显示、历史归档全程携带，任何一层都不丢
> - 采集层用驱动框架管理：Modbus 驱动、OPC UA 驱动各自独立实现，统一"写实时库"接口（见「modbus-通信层封装」「组态化设计与-opc-ua-对接」）
> - 实时库吞吐是性能关键：点位数多时用内存表/缓存（读写分离），不用每次查询都打数据库
> - 分层落地遵循「系统架构设计」的单向依赖，监控层只依赖实时库接口，不感知现场协议
> - 从"点位表 + 刷新"起步，逐步加报警引擎、历史库、组态化，避免一上来就重架构

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点"模拟点位刷新"看三行点位值变化、质量戳偶尔变 Bad、状态栏时间更新
> **Lv.2 小试牛刀**：新增两个点位（如 `LEVEL-4 储罐液位`、`SPEED-5 搅拌转速`）并参与随机刷新
> **Lv.3 融会贯通**：让质量戳为 Bad 的点位在 DataGrid 中红色高亮（用 DataTrigger 绑定 Quality），且 Bad 点位不参与刷新
> **Lv.4 挑战**：把"采集"抽成独立后台任务（`Task` + 取消令牌）周期写实时库，实时库改用线程安全内存表（`ConcurrentDictionary`）；再实现"历史归档"——把点位变化追加到 SQLite 供「历史趋势与报表」查询

> [!related] 相关知识链接
> - ← 前置知识：分层架构思想见「系统架构设计」「架构设计重要性与类型」（第 12 章）；采集驱动见「modbus-通信层封装」；数据展示见「大屏可视化看板」
> - → 后续必学：点位的画面如何组态生成，见「组态化设计与-opc-ua-对接」
> - ⇄ 关联概念：「报警规则引擎」「历史趋势与报表」「权限管理与审计」共同构成 SCADA 功能族；「检测逻辑与结果统计」等产线数据可作为 SCADA 点位来源
> - 📖 官方文档：https://opcfoundation.org/developer-tools/samples-and-tools-classic/
