---
title: Grid 用法示例与最佳实践
section: 03-layout
parent: 3.2 Grid 网格布局
---

# Grid 用法示例与最佳实践

> [!plain] 白话理解
> 前面学完了 Grid 的行列定义、三种尺寸模式、GridSplitter 拖拽条——现在该把它们**组合起来**了。真实的上位机界面从来不是"一个 Grid 加几行几列"这么简单，而是多层 Grid 嵌套、表单布局、弹性面板的组合拳。这一篇就是 Grid 的"期末大作业"——用三个真实的上位机场景，把前面学到的知识串在一起。

> [!def] 官方定义
> Grid 在实际项目中的最佳实践包括：用外层 Grid 划分功能区域（导航区、内容区、状态区），用内层 Grid 实现各区域内部的精细化布局（表单、数据表、卡片网格）。应采用自上而下的设计顺序：先确定功能分区 → 选定布局容器 → 定义行列尺寸模式 → 放入控件。对于性能敏感的场景，应尽量避免过深的布局嵌套（不超过 4 层 Panel）。

> [!origin] 由来背景
> 在 WinForms 中，复杂界面的布局通常靠 TableLayoutPanel + Panel + 一大堆`Anchor.Dock`属性拼凑而成。由于没有 Star 比例和 Min/Max 约束，同一个界面在 1366×768 笔记本和 1920×1080 台式机上展示效果完全不同。WPF Grid 的嵌套能力 + Star 比例 + Min/Max 约束，让"一套 XAML 适配所有分辨率"从不可能变成常规操作。这在上位机领域尤其重要——工控屏、PC 屏、大屏拼接的分辨率千差万别。

> [!essentials] 核心要点
> - **外层 Grid 管分区，内层 Grid 管细节**：两层分工明确，不要一个 Grid 同时管 20 列 30 行
> - **表单布局标准模式**：`Auto + *` 列（标签 + 输入框）+ `Auto` 行间距（`RowDefinition Height="8"` 做间隔行）
> - **嵌套 Grid 替代多层 StackPanel**：`Grid > Grid` 的性能 > `Grid > StackPanel > StackPanel > Grid`
> - **MinWidth/MinHeight 做防护**：所有可缩放区域都要设最小值，防止用户缩到不可用状态
> - **数据表头和数据行用相同的 ColumnDefinitions**：共用宽度定义，保证表头和内容对齐

> [!example] 完整示例
> 三个真实的工业上位机场景，一次性覆盖 Grid 的所有高阶用法：
>
> ```xml
> <!-- GridBestPracticeDemo.xaml -->
> <Window x:Class="HmiDemo.GridBestPracticeDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Grid 最佳实践 - 上位机综合面板" Height="620" Width="960"
>         Background="#0D1117" MinWidth="800" MinHeight="500">
>
>     <!-- ====== 层级1：外层 Grid 划分五大功能区 ====== -->
>     <Grid Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>   <!-- 顶栏 -->
>             <RowDefinition Height="8"/>
>             <RowDefinition Height="3*"/>     <!-- 主内容区（占3份） -->
>             <RowDefinition Height="8"/>
>             <RowDefinition Height="2*"/>     <!-- 底部面板（占2份） -->
>             <RowDefinition Height="8"/>
>             <RowDefinition Height="Auto"/>   <!-- 底栏状态 -->
>         </Grid.RowDefinitions>
>
>         <!-- ====== 顶栏：设备信息和快捷操作 ====== -->
>         <Border Grid.Row="0" Background="#161B22" CornerRadius="6" Padding="10,8">
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="*"/>
>                     <ColumnDefinition Width="Auto"/>
>                 </Grid.ColumnDefinitions>
>                 <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
>                     <TextBlock Text="◆" Foreground="#FF6B35" FontSize="16" VerticalAlignment="Center"/>
>                     <TextBlock Text="  生产线监控系统 v3.2" Foreground="#FF6B35"
>                                FontSize="16" FontWeight="Bold" VerticalAlignment="Center"/>
>                     <TextBlock Text="  |  " Foreground="#30363D" FontSize="14" VerticalAlignment="Center"/>
>                     <TextBlock Text="当前班组：甲班" Foreground="#8B949E" FontSize="13"
>                                VerticalAlignment="Center"/>
>                 </StackPanel>
>                 <StackPanel Grid.Column="2" Orientation="Horizontal" VerticalAlignment="Center">
>                     <Button Content="导出报表" Width="80" Height="28" Margin="0,0,6,0"
>                             Background="#21262D" Foreground="#C9D1D9"/>
>                     <Button Content="系统设置" Width="80" Height="28" Margin="0,0,6,0"
>                             Background="#21262D" Foreground="#C9D1D9"/>
>                     <Button Content="紧急停止" Width="80" Height="28"
>                             Background="#DA3633" Foreground="White" FontWeight="Bold"/>
>                 </StackPanel>
>             </Grid>
>         </Border>
>
>         <!-- ====== 主内容区：水平三栏（两个 GridSplitter） ====== -->
>         <Grid Grid.Row="2">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="1.5*" MinWidth="180"/>
>                 <ColumnDefinition Width="5"/>
>                 <ColumnDefinition Width="3*" MinWidth="300"/>
>                 <ColumnDefinition Width="5"/>
>                 <ColumnDefinition Width="1.5*" MinWidth="160"/>
>             </Grid.ColumnDefinitions>
>
>             <!-- 左栏：报警列表 -->
>             <Border Grid.Column="0" Background="#161B22" CornerRadius="4" Padding="10">
>                 <DockPanel>
>                     <TextBlock DockPanel.Dock="Top" Text="⚠ 实时报警" Foreground="#FF6B35"
>                                FontSize="13" FontWeight="Bold" Margin="0,0,0,8"/>
>
>                     <!-- 嵌套 Grid：报警项的表格布局 -->
>                     <ScrollViewer VerticalScrollBarVisibility="Auto">
>                         <ItemsControl>
>                             <Border Background="#FF6B3522" CornerRadius="3" Padding="6" Margin="0,0,0,4"
>                                     BorderBrush="#FF6B3544" BorderThickness="1">
>                                 <Grid>
>                                     <Grid.ColumnDefinitions>
>                                         <ColumnDefinition Width="Auto"/>
>                                         <ColumnDefinition Width="*"/>
>                                     </Grid.ColumnDefinitions>
>                                     <Grid.RowDefinitions>
>                                         <RowDefinition Height="Auto"/>
>                                         <RowDefinition Height="Auto"/>
>                                     </Grid.RowDefinitions>
>                                     <TextBlock Grid.Row="0" Grid.Column="0" Text="🔴" FontSize="11"/>
>                                     <TextBlock Grid.Row="0" Grid.Column="1" Text=" 主轴温度过高" 
>                                                Foreground="#FF6B35" FontSize="12"/>
>                                     <TextBlock Grid.Row="1" Grid.Column="1" Text="CNC-001 | 14:30:15"
>                                                Foreground="#8B949E" FontSize="10" Margin="0,2,0,0"/>
>                                 </Grid>
>                             </Border>
>                             <Border Background="#D2992222" CornerRadius="3" Padding="6" Margin="0,0,0,4"
>                                     BorderBrush="#D2992244" BorderThickness="1">
>                                 <Grid>
>                                     <Grid.ColumnDefinitions>
>                                         <ColumnDefinition Width="Auto"/>
>                                         <ColumnDefinition Width="*"/>
>                                     </Grid.ColumnDefinitions>
>                                     <TextBlock Grid.Column="0" Text="🟡" FontSize="11"/>
>                                     <TextBlock Grid.Column="1" Text=" 冷却液压力偏低" 
>                                                Foreground="#D29922" FontSize="12"/>
>                                 </Grid>
>                             </Border>
>                             <Border Background="#3FB95022" CornerRadius="3" Padding="6" Margin="0,0,0,4">
>                                 <Grid>
>                                     <Grid.ColumnDefinitions>
>                                         <ColumnDefinition Width="Auto"/>
>                                         <ColumnDefinition Width="*"/>
>                                     </Grid.ColumnDefinitions>
>                                     <TextBlock Grid.Column="0" Text="🟢" FontSize="11"/>
>                                     <TextBlock Grid.Column="1" Text=" PLC-002: 通讯恢复" 
>                                                Foreground="#3FB950" FontSize="12"/>
>                                 </Grid>
>                             </Border>
>                         </ItemsControl>
>                     </ScrollViewer>
>                 </DockPanel>
>             </Border>
>
>             <GridSplitter Grid.Column="1" Width="5" Background="#30363D"
>                           HorizontalAlignment="Stretch" VerticalAlignment="Stretch"/>
>
>             <!-- 中间栏：产线总览（嵌套 Grid 卡片布局） -->
>             <Border Grid.Column="2" Background="#161B22" CornerRadius="4" Padding="10">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Text="📊 产线总览" Foreground="#3FB950" FontSize="13"
>                                FontWeight="Bold" Margin="0,0,0,8"/>
>
>                     <!-- 嵌套 UniformGrid：2×2 工位卡片 -->
>                     <UniformGrid Grid.Row="1" Columns="2" Rows="2">
>                         <!-- 工位1 -->
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="0,0,4,4">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="*"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Grid.Row="0" Text="工位 01 - CNC加工" Foreground="#C9D1D9"
>                                            FontSize="13" FontWeight="Bold"/>
>                                 <Border Grid.Row="0" Grid.Column="1" Background="#3FB95033"
>                                         CornerRadius="3" Padding="6,2">
>                                     <TextBlock Text="运行中" Foreground="#3FB950" FontSize="10"/>
>                                 </Border>
>                                 <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Margin="0,6,0,0">
>                                     <TextBlock Text="生产件数：1,280" Foreground="#8B949E" FontSize="11"/>
>                                     <TextBlock Text="合格率：99.7%" Foreground="#3FB950" FontSize="11"/>
>                                 </StackPanel>
>                             </Grid>
>                         </Border>
>
>                         <!-- 工位2 -->
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="4,0,0,4">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="*"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Grid.Row="0" Text="工位 02 - 组装" Foreground="#C9D1D9"
>                                            FontSize="13" FontWeight="Bold"/>
>                                 <Border Grid.Row="0" Grid.Column="1" Background="#3FB95033"
>                                         CornerRadius="3" Padding="6,2">
>                                     <TextBlock Text="运行中" Foreground="#3FB950" FontSize="10"/>
>                                 </Border>
>                                 <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Margin="0,6,0,0">
>                                     <TextBlock Text="生产件数：1,152" Foreground="#8B949E" FontSize="11"/>
>                                     <TextBlock Text="合格率：98.9%" Foreground="#3FB950" FontSize="11"/>
>                                 </StackPanel>
>                             </Grid>
>                         </Border>
>
>                         <!-- 工位3 -->
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="0,4,4,0">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="*"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Grid.Row="0" Text="工位 03 - 检测" Foreground="#C9D1D9"
>                                            FontSize="13" FontWeight="Bold"/>
>                                 <Border Grid.Row="0" Grid.Column="1" Background="#FF6B3533"
>                                         CornerRadius="3" Padding="6,2">
>                                     <TextBlock Text="待料" Foreground="#FF6B35" FontSize="10"/>
>                                 </Border>
>                                 <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Margin="0,6,0,0">
>                                     <TextBlock Text="生产件数：1,230" Foreground="#8B949E" FontSize="11"/>
>                                     <TextBlock Text="合格率：99.2%" Foreground="#3FB950" FontSize="11"/>
>                                 </StackPanel>
>                             </Grid>
>                         </Border>
>
>                         <!-- 工位4 -->
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="4,4,0,0">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="*"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Grid.Row="0" Text="工位 04 - 包装" Foreground="#C9D1D9"
>                                            FontSize="13" FontWeight="Bold"/>
>                                 <Border Grid.Row="0" Grid.Column="1" Background="#8B949E33"
>                                         CornerRadius="3" Padding="6,2">
>                                     <TextBlock Text="离线" Foreground="#8B949E" FontSize="10"/>
>                                 </Border>
>                                 <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Margin="0,6,0,0">
>                                     <TextBlock Text="生产件数：--" Foreground="#484F58" FontSize="11"/>
>                                     <TextBlock Text="合格率：--" Foreground="#484F58" FontSize="11"/>
>                                 </StackPanel>
>                             </Grid>
>                         </Border>
>                     </UniformGrid>
>                 </Grid>
>             </Border>
>
>             <GridSplitter Grid.Column="3" Width="5" Background="#30363D"
>                           HorizontalAlignment="Stretch" VerticalAlignment="Stretch"/>
>
>             <!-- 右栏：产量统计 -->
>             <Border Grid.Column="4" Background="#161B22" CornerRadius="4" Padding="10">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Text="📈 产量统计" Foreground="#58A6FF" FontSize="13"
>                                FontWeight="Bold" Margin="0,0,0,8"/>
>                     <StackPanel Grid.Row="1">
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="0,0,0,6">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Text="今日产量" Foreground="#8B949E" FontSize="11"/>
>                                 <TextBlock Grid.Column="1" Text="3,662" Foreground="#3FB950"
>                                            FontSize="22" FontWeight="Bold"/>
>                                 <TextBlock Grid.Row="1" Grid.ColumnSpan="2" 
>                                            Text="目标 5,000 · 达成 73.2%"
>                                            Foreground="#8B949E" FontSize="10" Margin="0,4,0,0"/>
>                             </Grid>
>                         </Border>
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" Margin="0,0,0,6">
>                             <Grid>
>                                 <Grid.RowDefinitions>
>                                     <RowDefinition Height="Auto"/>
>                                     <RowDefinition Height="Auto"/>
>                                 </Grid.RowDefinitions>
>                                 <Grid.ColumnDefinitions>
>                                     <ColumnDefinition Width="*"/>
>                                     <ColumnDefinition Width="Auto"/>
>                                 </Grid.ColumnDefinitions>
>                                 <TextBlock Text="良品率" Foreground="#8B949E" FontSize="11"/>
>                                 <TextBlock Grid.Column="1" Text="99.4%" Foreground="#3FB950"
>                                            FontSize="22" FontWeight="Bold"/>
>                                 <TextBlock Grid.Row="1" Grid.ColumnSpan="2"
>                                            Text="目标 ≥ 98% · 达标 ✅"
>                                            Foreground="#3FB950" FontSize="10" Margin="0,4,0,0"/>
>                             </Grid>
>                         </Border>
>                     </StackPanel>
>                 </Grid>
>             </Border>
>         </Grid>
>
>         <!-- ====== 底栏：统计摘要 + 快捷指标 ====== -->
>         <Border Grid.Row="4" Background="#161B22" CornerRadius="4" Padding="12">
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="*"/>
>                     <ColumnDefinition Width="Auto"/>
>                 </Grid.ColumnDefinitions>
>                 <StackPanel Orientation="Horizontal" Margin="0,0,24,0">
>                     <TextBlock Text="运行设备" Foreground="#8B949E" FontSize="11"/>
>                     <TextBlock Text="  6/8" Foreground="#3FB950" FontSize="13" FontWeight="Bold"
>                                Margin="4,0,0,0"/>
>                 </StackPanel>
>                 <StackPanel Grid.Column="1" Orientation="Horizontal" Margin="0,0,24,0">
>                     <TextBlock Text="报警数量" Foreground="#8B949E" FontSize="11"/>
>                     <TextBlock Text="  2" Foreground="#FF6B35" FontSize="13" FontWeight="Bold"
>                                Margin="4,0,0,0"/>
>                 </StackPanel>
>                 <StackPanel Grid.Column="2" Orientation="Horizontal" Margin="0,0,24,0">
>                     <TextBlock Text="OEE" Foreground="#8B949E" FontSize="11"/>
>                     <TextBlock Text="  87.5%" Foreground="#58A6FF" FontSize="13" FontWeight="Bold"
>                                Margin="4,0,0,0"/>
>                 </StackPanel>
>                 <StackPanel Grid.Column="3" Orientation="Horizontal" Margin="0,0,24,0">
>                     <TextBlock Text="MTBF" Foreground="#8B949E" FontSize="11"/>
>                     <TextBlock Text="  124h" Foreground="#C9D1D9" FontSize="13" FontWeight="Bold"
>                                Margin="4,0,0,0"/>
>                 </StackPanel>
>                 <StackPanel Grid.Column="5" Orientation="Horizontal">
>                     <TextBlock Text="最后刷新：" Foreground="#484F58" FontSize="11"/>
>                     <TextBlock x:Name="TxtRefresh" Text="14:35:42" Foreground="#484F58" FontSize="11"/>
>                     <TextBlock Text="  刷新间隔 1s" Foreground="#484F58" FontSize="11"/>
>                 </StackPanel>
>             </Grid>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // GridBestPracticeDemo.xaml.cs
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo;
>
> public partial class GridBestPracticeDemo : Window
> {
>     public GridBestPracticeDemo()
>     {
>         InitializeComponent();
>
>         // 模拟定时刷新
>         var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         timer.Tick += (s, e) =>
>         {
>             TxtRefresh.Text = DateTime.Now.ToString("HH:mm:ss");
>         };
>         timer.Start();
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **上位机主界面**：顶栏 + 三栏内容区 + 底栏，5 个功能分区各司其职
> ✅ **多工位监控面板**：UniformGrid 做卡片式工位概览，每个卡片用嵌套 Grid 做内部布局
> ✅ **表单密集型配置页**：`Auto + *` 标签-输入框对 + `Auto` 间隔行，标准化的参数配置布局
> ✅ **仪表盘 Dashboard**：KPI 卡片网格（WrapPanel/UniformGrid）+ 详细模块（Grid + GridSplitter）
> ❌ **内容不确定的列表**：数据项数目不固定 → ListBox/ItemsControl + ItemTemplate，别手写死 Grid

> [!pitfall] 常见踩坑
> 坑 1：**深层嵌套导致性能问题** → 经典错误链：`Grid → StackPanel → Border → Grid → StackPanel → Border → ...`。每层 Panel 都触发独立的 Measure/Arrange，6 层以上布局计算量指数增长。用嵌套 Grid 替代 StackPanel 嵌套，控制在 4 层 Panel 以内。
>
> 坑 2：**表头和数据行用不同的 ColumnDefinitions** → 表头 5 列和数据行 5 列分别定义了完全不同的列宽，结果表头和内容完全对不齐。提取公共的 `Grid.ColumnDefinitions` 或确保两边完全一致。
>
> 坑 3：**GridSplitter 放置后忘记设 MinWidth** → 用户把侧边栏拖到 0px 宽度，导致面板完全消失且拖不回来。所有可拖动面板必须设 `MinWidth` 作为"安全线"。

> [!best] 最佳实践
> - **顶层 Grid 做分区，内层 Grid 做细节**——不要把 20 行 20 列塞进一个 Grid
> - **Form 表单统一模式**：`Auto` 标签列 + `*` 输入框列 + `8px` 行间距，实现所有表单对齐统一
> - **所有可缩放面板都加 MinWidth/MinHeight**——这是"最后一层防线"
> - **ColumnDefinitions 和 RowDefinitions 写在最顶端**——像目录一样，让维护者 5 秒内看懂结构
> - **DataGrid 优先用于数据表格，Grid 用于布局表格**——不要用 Grid 模拟 DataGrid
> - **使用工具**：Visual Studio 的设计器可以可视化调整行列，但不是必需——手写 XAML 通常更快更精确

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的完整示例，标记出所有 Grid 的嵌套层级（顶栏 Grid → 三栏 Grid → 报警项 Grid → 工位卡片 Grid），理解每一层的职责
> **Lv.2 小试牛刀**：在产线总览中增加第 5 个工位卡片——把 2×2 的 UniformGrid 改为 3×2，新增"工位 05 - 热处理"卡片
> **Lv.3 融会贯通**：从零设计一个"设备配置管理"界面：左侧设备列表(DockPanel) → 右侧 Grid 表单(5行标签+输入框) → 底部按钮栏，要求支持 GridSplitter 拖拽调整左侧宽度

> [!related] 相关知识链接
> - ← 前置知识：Grid 核心特点与属性、尺寸模式详解、GridSplitter 可拖拽分隔条
> - → 后续必学：StackPanel 堆叠布局（vs Grid 的场景选择）
> - → 后续必学：布局容器选择指南（全量容器对比和选择策略）
> - ⇄ 关联概念：嵌套 Panel 性能、UniformGrid、DataGrid vs Grid
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/grid
