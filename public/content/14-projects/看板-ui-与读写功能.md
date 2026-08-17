---
title: 看板 UI 与读写功能
section: 14-projects
parent: 14.2 项目二：Modbus PLC 数据采集看板（进阶级）
---

# 看板 UI 与读写功能

> [!plain] 白话理解
> 看板 UI 就像车间墙上那块电子屏，但比显示屏更进一步：它不光是"给你看"，还要"帮你调"。上半部分是 4 张寄存器卡片（温度、压力、速度、产量），数据每 1 秒从 PLC 轮询回来自动刷新；下半部分是操作面板，操作工在输入框填个 25，点"写入 40001"，设定值就下发给 PLC——同时看板上那张卡片立刻回显新值。
> 这就是上位机看板的两个基本功：**读**（轮询展示）和**写**（控制下发）。示例里用 `UniformGrid` 均分 4 个卡片区域，每张卡片"标签 + 大字数值"一屏扫完；写入成功后状态栏变绿提示。理解了"卡片布局 + 定时刷新 + 写操作回显"，你就掌握了所有数据看板的核心套路。

> [!def] 官方定义
> **看板（Dashboard / HMI 画面）**是工业 HMI（Human-Machine Interface，人机界面）的核心概念：将设备运行数据以卡片、曲线、仪表等形式集中呈现，并支持操作员下发控制指令。HMI 设计遵循"信息分层、重点突出"原则——运行数据展示与操作交互按区域划分。
> **UniformGrid** 是 WPF 布局面板：按行列均分空间放置子元素（`Columns="4"` 即每行 4 列等宽），适合做等尺寸卡片网格。官方文档见 https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.uniformgrid

> [!origin] 由来背景
> 看板界面源自工业控制台的演进：早期 DCS/PLC 系统用大屏上绘制工艺流程图，操作员盯着模拟盘与指示灯；随着 PC 进入控制室，HMI 软件（WinCC、组态王、Citect）把画面搬上显示器，"数据卡片 + 实时刷新 + 参数下发"成为标配交互。其设计原则可追溯到"施耐德/霍尼韦尔的人机工程学规范"：关键数据一目了然、操作路径最短、反馈即时明确。
> WPF 实现看板非常顺手：`UniformGrid` 天然适配等宽卡片布局，`DispatcherTimer` 定时刷新，事件处理下发指令。本篇示例浓缩了"读展示 + 写控制"最小闭环，接下来「大屏可视化看板」「scada-系统架构」会在更大尺度上复用这套交互模式。

> [!essentials] 核心要点
> - **卡片布局**：`UniformGrid Columns="4"` 均分 4 路寄存器，每张卡片"标签 + 大字数值"一屏可扫
> - **定时轮询刷新**：`DispatcherTimer` 每秒更新 4 张卡片数值，并显示最近刷新时间戳
> - **写入下发**：输入框解析为 `ushort`（`ushort.TryParse` 防非法输入），写入后看板卡片即时回显
> - **状态反馈**：写入成功状态栏变绿、轮询刷新变灰，操作结果"看得见"，避免误以为按钮没生效
> - **读写分离**：读走轮询循环、写由用户动作触发，两者共用同一寄存器数组保持数据一致

> [!example] 完整示例
> **Modbus 数据看板演示：每 1 秒轮询模拟 PLC 的 4 路寄存器并在看板卡片上实时刷新，点击"写入 40001"将设定值下发给 PLC，体现看板 UI 的"读展示 + 写控制"一体化设计：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus 数据看板" Height="420" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="PLC 数据看板（实时刷新 + 读写）" Foreground="#58A6FF"
>                    FontSize="14" FontWeight="Bold" Margin="0,0,0,10"/>
>         <!-- 4 路寄存器卡片 -->
>         <UniformGrid Grid.Row="1" Columns="4">
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40001 温度" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg1Text" Text="0" Foreground="#58A6FF" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40002 压力" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg2Text" Text="0" Foreground="#238636" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40003 速度" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg3Text" Text="0" Foreground="#58A6FF" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" CornerRadius="6" Padding="8" Margin="2">
>                 <StackPanel>
>                     <TextBlock Text="40004 产量" Foreground="#8B949E" FontSize="11" HorizontalAlignment="Center"/>
>                     <TextBlock x:Name="Reg4Text" Text="0" Foreground="#238636" FontSize="22"
>                                FontWeight="Bold" HorizontalAlignment="Center"/>
>                 </StackPanel>
>             </Border>
>         </UniformGrid>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="10" Margin="0,10">
>             <StackPanel>
>                 <TextBlock Text="写入寄存器（设置温度目标值）" Foreground="#58A6FF"
>                            FontWeight="Bold" Margin="0,0,0,6"/>
>                 <StackPanel Orientation="Horizontal">
>                     <TextBox x:Name="WriteBox" Text="25" Width="80" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4"/>
>                     <Button Content="写入 40001" Click="OnWrite" Margin="8,0,0,0" Padding="8"
>                             Background="#21262D" Foreground="White"/>
>                     <TextBlock x:Name="StatusText" Text="就绪" Foreground="#8B949E"
>                                VerticalAlignment="Center" Margin="12,0,0,0"/>
>                 </StackPanel>
>             </StackPanel>
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
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private readonly Random _rand = new Random();
>         private readonly ushort[] _regs = new ushort[4];
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Interval = TimeSpan.FromSeconds(1);
>             _timer.Tick += OnPoll;
>             _timer.Start();
>         }
>
>         // 周期性轮询刷新看板（实际项目：ModbusClient.ReadHoldingRegisters）
>         private void OnPoll(object sender, EventArgs e)
>         {
>             for (int i = 0; i < _regs.Length; i++)
>                 _regs[i] = (ushort)(100 + _rand.Next(900));
>             Reg1Text.Text = _regs[0].ToString();
>             Reg2Text.Text = _regs[1].ToString();
>             Reg3Text.Text = _regs[2].ToString();
>             Reg4Text.Text = _regs[3].ToString();
>             StatusText.Text = $"最近刷新 {DateTime.Now:HH:mm:ss}";
>             StatusText.Foreground = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>         }
>
>         // 写入功能：把输入框设定值下发给 40001，并回显到看板
>         private void OnWrite(object sender, RoutedEventArgs e)
>         {
>             if (!ushort.TryParse(WriteBox.Text, out ushort value)) return;
>             _regs[0] = value;
>             Reg1Text.Text = value.ToString();
>             StatusText.Text = $"已写入 40001 = {value}";
>             StatusText.Foreground = Brushes.LimeGreen;
>         }
>     }
> }
> ```
> 
> 

> [!scene] 适用场景
> ✅ 设备运行看板：温度、压力、产量等关键量的卡片化实时展示，操作工一眼掌握设备状态
> ✅ 参数下发界面：设定目标值（温度设定、速度设定），写寄存器并回显确认，是"读 + 写"一体的典型
> ✅ 中控室多屏布局：每块屏一组看板卡片，UniformGrid/Grid 布局天然适配
> ✅ 交接班与巡检辅助：看板 + 刷新时间戳让现场人员快速判断"数据是不是还在更新"
> ❌ 纯监控无交互的画面（只读不写）：看板卡片可用，但"写"面板应去掉，避免误触风险
> ❌ 需要频繁操作大量参数的界面（一次改几十个参数）：卡片式不适合，应改用表格/表单页

> [!pitfall] 常见踩坑
> 坑 1：**输入值不校验直接写** → 操作工输入"abc"或超范围值，写操作异常或数据出错 → 写前 `ushort.TryParse` 校验，失败时状态栏提示"输入无效"，不执行写
>
> 坑 2：**写操作没有回显与确认** → 点了按钮界面毫无变化，操作工怀疑"到底写了没有" → 写入成功后立即回显看板数值 + 状态栏绿色提示"已写入 40001 = 25"
>
> 坑 3：**轮询与写入互相覆盖** → 操作工刚写好设定值，下一秒轮询又把旧值刷回来看板 → 写入时同步更新内存寄存器数组（`_regs[0] = value`），保证轮询数据与写入一致
>
> 坑 4：**卡片数值变化没有视觉提示** → 所有卡片静悄悄变数字，异常时无法吸引注意 → 数值超限/变化大时切换颜色（绿→橙红），与「报警功能与历史数据」联动

> [!best] 最佳实践
> - 卡片标题用寄存器号 + 中文名（40001 温度），现场人员与电气工程师都能对号入座
> - 关键操作（写寄存器）加二次确认：重要设备参数下发前弹确认框或要求输入密码
> - 布局用 UniformGrid 保证等宽卡片，需要不同尺寸时改用 Grid + 跨行跨列
> - 刷新时间戳固定在界面角落，"数据停止更新"本身就是重要告警信号
> - 看板数据源与「modbus-通信层封装」对接：轮询回调更新 VM 属性，UI 自动刷新，避免在事件里直接改控件

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察 4 张卡片每秒刷新、输入框写值后点"写入 40001"看卡片回显与绿色状态提示
> **Lv.2 小试牛刀**：把布局改为 2 行 2 列（`UniformGrid Columns="2"` + `Rows="2"`），并给每张卡片增加单位文本（℃/MPa/r/min/件）
> **Lv.3 融会贯通**：为 40002 压力卡增加"超上限变色"逻辑（如 >800 变橙红），与「报警功能与历史数据」的边沿触发思路结合
> **Lv.4 挑战**：把示例改造为 MVVM：ViewModel 暴露 `ObservableCollection<RegisterCard>`（含 Name/Value/Unit/Alarm），卡片用 `ItemsControl` 模板化渲染，轮询线程更新 VM 自动刷新 UI

> [!related] 相关知识链接
> - ← 前置知识：布局与卡片见第 3 章「uniformgrid-均匀布局」「grid-核心特点与属性」；通信能力来自「modbus-通信层封装」；数据调度见「设备管理与采集调度」
> - → 后续必学：更大规模看板与 OEE 指标结合，见 14.3「大屏可视化看板」「通信管理与-oee-计算」
> - ⇄ 关联概念：同章「实时曲线与仪表盘」把卡片升级为曲线/仪表；14.7「组态化设计与-opc-ua-对接」展示看板组态的工程化思路
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.uniformgrid
