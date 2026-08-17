---
title: 项目概述与需求分析
section: 14-projects
parent: 14.2 项目二：Modbus PLC 数据采集看板（进阶级）
---

# 项目概述与需求分析

> [!plain] 白话理解
> 车间里每台 PLC 都在实时运行，但操作工想看的不是寄存器里的原始数字，而是一块"看得懂的看板"：温度多少、压力多大、产量几条，一眼扫完；必要时还能把设定值下发回去。做这个项目就像给 PLC 装一块"远程电子屏 + 操作面板"。
> 但开工前先别急着连 PLC——甲方说的"做个看板"往往很模糊：看哪些参数？几台设备？要不要写控制？多久刷新一次？需求分析就是把这些话翻译成一条条可勾选的清单（"本期必须"与"二期再说"分开放），再按清单把系统切成三层：**通信层**（怎么和 PLC 说话）、**调度层**（几台设备按什么顺序轮询）、**UI 层**（看板怎么画、怎么写）。清单评审通过后再写代码，项目才不会边做边改。

> [!def] 官方定义
> 需求分析（Requirements Analysis）是**软件工程过程模型**中的一个阶段，指在软件开发早期对用户需求进行获取、建模、规格说明与验证，产出《需求规格说明书》。IEEE 软件工程知识体系（SWEBOK）将其划分为需求获取、需求分析、需求规格说明、需求验证四个子过程。详见 SWEBOK 及微软工程实践指南 https://learn.microsoft.com/zh-cn/dotnet/architecture/
> 本项目同时引入**分层架构**（Layered Architecture）：通信层（Modbus 驱动封装）→ 调度层（设备管理、轮询调度）→ 表示层（看板 UI），层间单向依赖、各层可独立替换测试。

> [!origin] 由来背景
> "需求分析"这一环节在 20 世纪 60-70 年代"软件危机"背景下确立：大型软件项目频繁超期失败，根因常是需求不明就仓促编码。1970 年 Winston Royce 提出瀑布模型，把需求分析固定为软件生命周期第一道关卡。
> 工业上位机尤甚：客户描述的是"压力别超过 80"而不是"读 Modbus 40001 寄存器"，把工艺语言翻译成可验收的功能清单正是需求分析的价值。Modbus 看板这类项目还多一层特殊性——通信协议（功能码、寄存器地址）与设备拓扑（几台 PLC、各自地址）必须在开工前定清，否则通信层设计无从下手。这也是本系列第二个实战项目，承接项目一的"需求分析 → 分层架构"方法论，落地到带通信协议的真实场景。

> [!essentials] 核心要点
> - **需求清单化**：把"监控哪几路寄存器、要不要写参数、刷新频率多少"逐条写成可勾选需求项，每条有明确验收标准
> - **范围控制**：区分"本期必须"（4 路寄存器采集、轮询刷新、参数下发）与"二期扩展"（历史趋势、权限管理），防止需求蔓延
> - **三层边界**：通信层（Modbus 协议封装）→ 调度层（设备管理、轮询调度）→ UI 层（看板卡片、写入面板），层间单向依赖
> - **通信前置设计**：项目二比项目一多一道工序——先定 Modbus 功能码与寄存器表（哪些寄存器读、哪些写），通信层才能设计
> - **可追溯**：每条需求都要能回答"做完没有"，评审时逐条勾选确认，避免口头需求事后扯皮

> [!example] 完整示例
> **Modbus 数据采集看板需求清单与架构示意演示：左侧展示功能需求清单（CheckBox 勾选评审确认），右侧用分层卡块示意"通信层 → 调度层 → UI 层"三层架构，按钮切换需求分析与编码实施模式：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="项目概述 - Modbus 看板需求分析与架构示意" Height="420" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="Modbus 数据采集看板 · 需求分析与架构示意" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Grid Grid.Row="1">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="10"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <!-- 左：功能需求清单（需求评审时勾选确认） -->
>             <Border Grid.Column="0" Background="#161B22" CornerRadius="6" Padding="10">
>                 <StackPanel>
>                     <TextBlock Text="功能需求清单" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                     <CheckBox Content="4 路寄存器实时采集" IsChecked="True" Foreground="#8B949E" Margin="0,3"/>
>                     <CheckBox Content="多设备轮询调度" IsChecked="True" Foreground="#8B949E" Margin="0,3"/>
>                     <CheckBox Content="看板卡片实时刷新" IsChecked="True" Foreground="#8B949E" Margin="0,3"/>
>                     <CheckBox Content="参数写入下发" IsChecked="True" Foreground="#8B949E" Margin="0,3"/>
>                     <CheckBox Content="历史趋势回放" IsChecked="False" Foreground="#8B949E" Margin="0,3"/>
>                     <CheckBox Content="用户权限管理" IsChecked="False" Foreground="#8B949E" Margin="0,3"/>
>                 </StackPanel>
>             </Border>
>             <!-- 右：三层架构示意 -->
>             <Border Grid.Column="2" Background="#161B22" CornerRadius="6" Padding="10">
>                 <StackPanel>
>                     <TextBlock Text="系统架构（分层设计）" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                     <Border Background="#21262D" CornerRadius="4" Padding="8" Margin="0,3">
>                         <TextBlock Text="UI 层：看板卡片 / 写入面板 / 状态栏" Foreground="#8B949E"/>
>                     </Border>
>                     <Border Background="#21262D" CornerRadius="4" Padding="8" Margin="0,3">
>                         <TextBlock Text="调度层：设备管理 / 轮询调度 / 超时判定" Foreground="#8B949E"/>
>                     </Border>
>                     <Border Background="#21262D" CornerRadius="4" Padding="8" Margin="0,3">
>                         <TextBlock Text="通信层：Modbus 协议封装 / 寄存器读写" Foreground="#8B949E"/>
>                     </Border>
>                 </StackPanel>
>             </Border>
>         </Grid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button x:Name="ModeBtn" Content="切换为运行模式" Click="OnToggleMode"
>                     Padding="10" Background="#21262D" Foreground="White"/>
>             <TextBlock x:Name="ModeText" Text="当前：需求分析模式" Foreground="#8B949E"
>                        VerticalAlignment="Center" Margin="12,0,0,0"/>
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
>         private bool _isRunning;
>
>         public MainWindow() => InitializeComponent();
>
>         // 需求分析阶段确定开发范围，编码实施阶段进入开发流程
>         private void OnToggleMode(object sender, RoutedEventArgs e)
>         {
>             _isRunning = !_isRunning;
>             ModeBtn.Content = _isRunning ? "切换为需求分析模式" : "切换为编码实施模式";
>             ModeText.Text = _isRunning ? "当前：编码实施模式" : "当前：需求分析模式";
>             ModeText.Foreground = _isRunning ? Brushes.LimeGreen : Brushes.Orange;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 项目立项：Modbus PLC 看板开工前用需求清单确定范围，避免"边做边想"
> ✅ 需求评审会：与设备/工艺工程师逐条勾选确认，把"压力别超 80"固化成可验收条目（寄存器地址 + 报警阈值）
> ✅ 通信方案确定：需求阶段同步敲定 Modbus 功能码、寄存器表、设备地址，为通信层设计铺路
> ✅ 多设备项目排期：按清单估算工时、排优先级，P0 功能优先交付
> ❌ 功能完全固定的内部小工具：需求无变更可能时，直接编码更高效
> ❌ 探索性技术验证（Demo/PoC）：先写最小原型验证 Modbus 通信可行性，再回头补需求文档

> [!pitfall] 常见踩坑
> 坑 1：**需求不量化就开发**（只写"做个看板"）→ 开发完才发现刷新率、寄存器地址、写控制范围全没定义，反复返工 → 每条需求写清验收标准（如"4 路寄存器 1s 轮询刷新、40001 可写、超时标离线"）
>
> 坑 2：**协议与需求搅在一起**（上来就讨论用 TCP 还是串口）→ 需求会与技术选型互相绑架 → 需求阶段只回答"做什么"，选型留到设计阶段；但寄存器表必须在需求阶段定清
>
> 坑 3：**范围无限蔓延**（甲方"顺便加个报表"）→ 项目越做越大 → 用 CheckBox 清单和"二期扩展"标签显式确认，新增需求走变更流程
>
> 坑 4：**忽略设备拓扑**（只写"连 PLC"不写几台、各在哪）→ 调度层无从设计 → 需求清单里明确设备数量、型号、寄存器范围，调度设计才有输入

> [!best] 最佳实践
> - 需求清单用 CheckBox 逐条勾选评审，勾选结果就是双方确认的交付范围，防止事后扯皮
> - 需求分优先级：P0 必须（采集、轮询、看板、写入）→ P1 应该（离线告警）→ P2 可选（历史趋势、权限），先做 P0
> - 一条需求对应一个验收标准，写明输入、输出、边界值（如"写入 40001 成功后看板卡片 1s 内回显"）
> - 从需求分析就开始画分层图：每条需求落到通信层/调度层/UI 层哪一层，为后续架构铺路
> - 寄存器表单独成文：地址、功能码、读写属性、数据类型一表打尽，它是通信层的"接口契约"
> - 保留需求变更记录：清单版本化，改了哪条、为什么改，都要可追溯

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，勾选/取消 CheckBox 清单、点击按钮切换"需求分析/编码实施"模式，观察状态文字与颜色变化
> **Lv.2 小试牛刀**：给功能需求清单加一条"设备离线告警"，勾选为必须项，并说明它应落在哪一层、验收标准是什么
> **Lv.3 融会贯通**：为本项目起草寄存器表：列出 4 路参数的寄存器地址、功能码（读保持寄存器 03H/写单寄存器 06H）、读写属性与数据类型，整理成表格
> **Lv.4 挑战**：把"轮询周期可配置"拆成完整需求（验收标准：周期 0.5-5s 可设、生效时间 <1s），并画出对应的三层架构示意，验证清单能直接指导编码实施

> [!related] 相关知识链接
> - ← 前置知识：需求分析与分层架构方法论见 14.1「项目概述与需求分析」；需求分析面向的架构理念见第 12 章「三层架构表示层业务层数据层」
> - → 后续必学：需求与寄存器表定稿后进入通信设计，「modbus-通信层封装」开始封装 Modbus 协议的读写实现
> - ⇄ 关联概念：同项目「设备管理与采集调度」是调度层落地；「看板-ui-与读写功能」是 UI 层落地；「scada-系统架构」展示大型综合监控系统的架构全貌
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/architecture/
