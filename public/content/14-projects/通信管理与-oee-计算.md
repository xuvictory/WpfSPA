---
title: 通信管理与 OEE 计算
section: 14-projects
parent: 14.3 项目三：产线设备状态监控平台（进阶级）
---

# 通信管理与 OEE 计算

> [!plain] 白话理解
> 一台设备班次排了 8 小时，但实际只跑了 6.5 小时——中间停机、换型、故障占了 1.5 小时；就算在跑，速度也没跑到设计产能（理论 800 件只做了 620 件）；做出来的 620 件里还有 20 件次品。设备"看起来一直在动"，真实效率却远没有 100%。
> OEE（综合设备效率）就是把这三个"打折扣"合起来算一笔总账：可用率（时间有没有用满）× 性能率（速度有没有拉满）× 合格率（做出来的能不能用）= 综合效率。示例点一下"计算 OEE"，五组数据立刻变成三个百分比和一个综合分，再按世界级/良好/需改善给个颜色评级。管理者看一个数就知道产线健康状况，再往下钻才能定位是"停机太多"还是"速度不够"。

> [!def] 官方定义
> **OEE**（Overall Equipment Effectiveness，综合设备效率）是精益生产与 **TPM**（全员生产维护）体系的核心指标，由日本 JIPM 提出。定义为三大效率之积：
> - **可用率**（Availability）= 实际运行时间 / 计划运行时间（衡量停机损失）；
> - **性能率**（Performance）=（实际产量/实际运行时间）÷（理论产量/计划运行时间）（衡量速度损失，示例中修正为 `(output / run) / (theo / plan)`）；
> - **合格率**（Quality）= 合格品数量 / 总产量（衡量质量损失）；
> - **OEE = 可用率 × 性能率 × 合格率**。行业惯例：OEE ≥ 85% 为世界级，70%~85% 良好，<70% 需改善。

> [!origin] 由来背景
> OEE 诞生于日本 1970 年代的 TPM 运动：1971 年，日本设备维护协会（JIPM）的中岛清一（Seiichi Nakajima）在提出 TPM 理论时系统阐述了 OEE，其初衷是解决"设备看似忙碌但产出远低于理论"的管理盲区。他把设备的效率损失归纳为**六大损失**（故障停机、换型调整、空转/短暂停机、速度降低、不良/返修、启动损失），并归并为可用率、性能率、合格率三个维度。
> 1980-90 年代 OEE 随精益生产传播到欧美，并被半导体行业（SEMATECH）采纳为产能基准。今天几乎所有 MES/SCADA 系统都把 OEE 作为产线级 KPI。上位机作为数据采集终端，天然负责"数时间、数产量、数良品"——把设备状态机的时间累计与产量计数喂给 OEE 公式，就是本篇示例在真实项目中的完整形态。

> [!essentials] 核心要点
> - **三要素公式**：可用率 = 运行/计划；性能率 =（实际产量/运行）÷（理论产量/计划）；合格率 = 合格/实际产量
> - **性能率必须修正**：用"实际运行时间"口径修正理论产能，否则停机时间越长性能率越失真
> - **输入合法性校验**：五个输入全部 `TryParse` 且要求正数，非法输入提示"请输入合法的正数！"
> - **分级反馈**：OEE ≥ 85% 世界级（绿）、≥70% 良好（蓝）、<70% 需改善（红），色块直观
> - **防除零**：输入 `run/plan/theo/output` 均须大于 0，从源头杜绝除零异常

> [!example] 完整示例
> **OEE 指标计算演示：输入计划运行时间、实际运行时间、理论产量、实际产量、合格产量，点击计算得到可用率、性能率、合格率与综合 OEE，并按色块显示评级：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="通信管理与 OEE 计算" Height="480" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="OEE 综合设备效率计算" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Grid.Row="1" Margin="0,0,0,10">
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="计划运行时间 (h)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="PlanBox" Grid.Column="1" Text="8" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="实际运行时间 (h)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="RunBox" Grid.Column="1" Text="6.5" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="理论产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="TheoBox" Grid.Column="1" Text="800" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="实际产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="OutBox" Grid.Column="1" Text="620" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>             <Grid Margin="0,6,0,0">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="130"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <TextBlock Text="合格产量 (件)" Foreground="#8B949E" VerticalAlignment="Center"/>
>                 <TextBox x:Name="GoodBox" Grid.Column="1" Text="600" Background="#161B22"
>                          Foreground="#58A6FF" Padding="4"/>
>             </Grid>
>         </StackPanel>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="计算结果" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                 <TextBlock x:Name="ResultText" Text="点击下方按钮计算…" Foreground="#8B949E"
>                            FontFamily="Consolas" TextWrapping="Wrap"/>
>                 <Border x:Name="OeeBadge" Background="#21262D" CornerRadius="4" Padding="8,4"
>                         Margin="0,10,0,0" HorizontalAlignment="Left">
>                     <TextBlock x:Name="OeeLevelText" Text="--" Foreground="#8B949E"/>
>                 </Border>
>             </StackPanel>
>         </Border>
>         <Button Grid.Row="3" Content="计算 OEE" Click="OnCalc" Margin="0,12,0,0" Padding="10"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnCalc(object sender, RoutedEventArgs e)
>         {
>             // 输入合法性校验
>             if (!double.TryParse(PlanBox.Text, out double plan) || plan <= 0 ||
>                 !double.TryParse(RunBox.Text, out double run) || run <= 0 ||
>                 !double.TryParse(TheoBox.Text, out double theo) || theo <= 0 ||
>                 !double.TryParse(OutBox.Text, out double output) || output <= 0 ||
>                 !double.TryParse(GoodBox.Text, out double good) || good <= 0)
>             {
>                 ResultText.Text = "请输入合法的正数！";
>                 return;
>             }
>
>             // OEE 三要素：可用率 × 性能率 × 合格率
>             double availability = run / plan;                                  // 可用率
>             double performance = (output / run) / (theo / plan);               // 性能率
>             double quality = good / output;                                    // 合格率
>             double oee = availability * performance * quality;                 // 综合 OEE
>
>             ResultText.Text =
>                 $"可用率 = {availability:P1}\n" +
>                 $"性能率 = {performance:P1}\n" +
>                 $"合格率 = {quality:P1}\n" +
>                 $"OEE   = {oee:P1}";
>
>             // 国际惯例分级：>85% 世界级，70~85% 良好，<70% 需改善
>             if (oee >= 0.85) SetOeeLevel("世界级", Color.FromRgb(0x23, 0x86, 0x36));
>             else if (oee >= 0.70) SetOeeLevel("良好", Color.FromRgb(0x58, 0xA6, 0xFF));
>             else SetOeeLevel("需改善", Color.FromRgb(0xDA, 0x36, 0x33));
>         }
>
>         private void SetOeeLevel(string text, Color color)
>         {
>             OeeLevelText.Text = text;
>             OeeBadge.Background = new SolidColorBrush(color);
>             OeeLevelText.Foreground = Brushes.White;
>         }
>     }
> }
> ```
> 
> 

> [!scene] 适用场景
> ✅ 产线效率评估：用 OEE 量化设备真实利用率，发现"看着忙、产出低"的设备
> ✅ 精益生产改善：定位效率损失来自停机（可用率低）、速度（性能率低）还是质量（合格率低）
> ✅ 生产日报/周报：把 OEE 与三要素输出到报表，管理层一页看懂产线健康度
> ✅ 多设备对标：同型号设备间 OEE 对比，倒推最优操作与维护实践
> ❌ 单机单参数演示程序：没有产量与时间统计来源时，算 OEE 无实际意义
> ❌ 只看总 OEE 不拆三要素的简单看板：会掩盖"哪个环节拖后腿"，应同时展示三要素

> [!pitfall] 常见踩坑
> 坑 1：**性能率公式忘了修正**（直接用 实际产量/理论产量）→ 停机时间越长性能率越低，与可用率重复扣分，OEE 失真 → 性能率必须用运行时间口径修正：`(实际产量/运行时间) / (理论产量/计划时间)`
>
> 坑 2：**输入非法导致除零/负数** → 用户输入 0 或负数，计算崩溃或出现负数百分比 → 计算前全部 `TryParse` + `> 0` 校验，非法输入直接提示并 return
>
> 坑 3：**数据口径不统一**（计划时间 8h 用小时、实际产量用分钟粒度）→ 单位混用导致结果离谱 → 明确统一单位（小时/件），从数据源到计算全程一致
>
> 坑 4：**只看综合 OEE 忽略三要素** → 总分数很难看却不知从何下手改善 → 界面同时展示三要素与分级，分析先看"哪个率最低"

> [!best] 最佳实践
> - OEE 计算写成纯函数（输入时间/产量，输出三要素+OEE），独立于 UI 便于单元测试与复用
> - 时间与产量数据尽量自动采集：运行时间来自「设备状态机设计」的计时累计，产量/合格数来自 PLC 计数器，避免人工填报
> - 分级阈值与文案集中为常量/配置，不同工厂可按 SMT（电子）或机加行业基准调整
> - 三要素与总 OEE 同屏展示，缺一不可；OEE 变化趋势入历史库（见「历史趋势与报表」）支持环比分析
> - 演示程序标注口径（如"理论产能按满产 100 件/h"），避免现场误解数据

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，用默认数据（8h/6.5h/800/620/600）计算 OEE，观察三要素与色块分级
> **Lv.2 小试牛刀**：把五输入改成四个输入（增加"停机时间"，计划运行时间=自动计算），并校验停机时间 ≤ 计划时间
> **Lv.3 融会贯通**：为 OEE 增加"六大损失"归因：按停机/速度/质量三类分别高亮最低项，并给出改善建议文案
> **Lv.4 挑战**：把 OEE 计算接入「设备状态机设计」：状态机记录每日运行/停机时长，产量由采集计数自动累计，实现"点开界面即出今日 OEE"，数据全程自动、可入库查询

> [!related] 相关知识链接
> - ← 前置知识：运行/停机时间来自设备状态，见「设备状态机设计」；设备数据采集见「设备管理与采集调度」「modbus-通信层封装」
> - → 后续必学：OEE 等 KPI 如何搬上大屏，见「大屏可视化看板」
> - ⇄ 关联概念：14.7「历史趋势与报表」把 OEE 存库做趋势分析；「scada-系统架构」把 OEE 作为全局监控指标之一；精益/TPM 背景见第 12 章「solid-设计原则」无关，理论出处为 JIPM/TPM
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.double.tryparse
