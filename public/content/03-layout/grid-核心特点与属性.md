---
title: Grid 核心特点与属性
section: 03-layout
parent: 3.2 Grid 网格布局
---

# Grid 核心特点与属性

> [!plain] 白话理解
> Grid 是 WPF 布局界的"瑞士军刀"——你可以把它想象成一张**Excel 表格**。先画好行和列（RowDefinitions/ColumnDefinitions），然后把控件放进对应的单元格（Grid.Row="1" Grid.Column="2"），如果一个控件需要跨多个单元格，可以设 RowSpan/ColumnSpan。关键是：你可以给每行/每列设置不同的尺寸模式——有的固定宽度（放图标）、有的自适应内容（放标签）、有的按比例瓜分剩余空间（放主要内容）——三合一，无敌灵活。

> [!def] 官方定义
> Grid 是 WPF 中最强大、最常用的布局容器。它通过 `RowDefinitions`（行定义集合）和 `ColumnDefinitions`（列定义集合）将空间划分为一个二维的单元格网格。子控件通过附加属性 `Grid.Row`、`Grid.Column`、`Grid.RowSpan`、`Grid.ColumnSpan` 定位到指定单元格。每行/列的尺寸通过 `GridLength` 结构体定义，支持 Fixed（固定像素）、Auto（自适应内容）和 Star（比例分配）三种模式。此外还有 `ShowGridLines` 用于调试时显示网格线。

> [!origin] 由来背景
> WinForms 的 TableLayoutPanel 虽然也能做表格式布局，但行高列宽只有 Absolute 和 Percent 两种，无法根据内容自动调整（Auto 模式），更不支持灵活的 Star 比例。而且 TableLayoutPanel 的嵌套噩梦——表单稍微复杂一点就要套好几个表格。WPF 的 Grid 支持 Auto 列宽自动适应标签长度，Star 列宽让输入框优雅地瓜分剩余空间。更重要的是，Grid 的附加属性（Grid.Row/Column）让子控件可以"声明"自己属于哪个单元格，代码可读性远超 WinForms 的 `tableLayoutPanel.SetCellPosition(control, new TableLayoutPanelCellPosition(2,1))`。

> [!essentials] 核心要点
> - **RowDefinitions / ColumnDefinitions**：定义表格的行和列，每行/列用一个 `RowDefinition` / `ColumnDefinition` 描述尺寸模式
> - **Grid.Row / Grid.Column**：附加属性，零基索引；不写默认为 0；放错行列是新手最常见的布局 bug
> - **RowSpan / ColumnSpan**：跨行/跨列合并单元格；默认值为 1（占一格）；标题栏常用 `ColumnSpan="3"` 占据整行
> - **GridLength 三种模式**：`"100"`（固定像素）、`"Auto"`（内容自适应）、`"*"` / `"2*"`（比例分配）
> - **ShowGridLines**：`True` 时显示虚线网格线，仅用于开发调试，生产环境设为 False
> - **嵌套 Grid**：Grid 的行列可以再放 Grid，形成多层表格结构——但别嵌套太深，单层多行列优于多层嵌套
> - **附加属性 = "声明格子"**：`Grid.Row="1"` 的意思是"我属于第 1 行"，由子控件声明而非父容器指定

> [!example] 完整示例
> 用上位机场景——设备参数配置表单来展示 Grid 的核心用法：
>
> ```xml
> <!-- GridCoreDemo.xaml -->
> <Window x:Class="HmiDemo.GridCoreDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Grid 核心用法 - 设备参数配置" Height="520" Width="700"
>         Background="#0D1117">
>     <Grid Margin="16">
>         <Grid.RowDefinitions>
>             <!-- 标题行：Auto → 和文字一样高 -->
>             <RowDefinition Height="Auto"/>
>             <!-- 间距 -->
>             <RowDefinition Height="12"/>
>             <!-- 菜单栏：Auto → 按钮多高就多高 -->
>             <RowDefinition Height="Auto"/>
>             <!-- 间距 -->
>             <RowDefinition Height="12"/>
>             <!-- 主要内容区：* → 瓜分剩余高度 -->
>             <RowDefinition Height="*"/>
>             <!-- 间距 -->
>             <RowDefinition Height="12"/>
>             <!-- 底部按钮区：Auto -->
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>
>         <!-- ====== 标题（ColumnSpan 跨整行） ====== -->
>         <Border Grid.Row="0" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="◆" Foreground="#FF6B35" FontSize="16" VerticalAlignment="Center"/>
>                 <TextBlock Text="  设备参数配置" Foreground="#FF6B35" FontSize="18"
>                            FontWeight="Bold" VerticalAlignment="Center"/>
>             </StackPanel>
>         </Border>
>
>         <!-- ====== 工具栏菜单（RowSpan/ColumnSpan 演示） ====== -->
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="4" Padding="8,6">
>             <StackPanel Orientation="Horizontal">
>                 <Button Content="读取参数" Width="80" Height="28" Margin="0,0,8,0"
>                         Background="#3FB950" Foreground="White"/>
>                 <Button Content="写入参数" Width="80" Height="28" Margin="0,0,8,0"
>                         Background="#FF6B35" Foreground="White"/>
>                 <Button Content="恢复默认" Width="80" Height="28"
>                         Background="#21262D" Foreground="#C9D1D9"/>
>             </StackPanel>
>         </Border>
>
>         <!-- ====== 主要内容区（核心：Grid 表格布局） ====== -->
>         <!-- Row 4: 左侧表单 + 右侧备注 -->
>         <Grid Grid.Row="4">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="2*"/>   <!-- 左侧表单占 2 份 -->
>                 <ColumnDefinition Width="10"/>    <!-- 分隔间距 -->
>                 <ColumnDefinition Width="*"/>     <!-- 右侧备注占 1 份 -->
>             </Grid.ColumnDefinitions>
>
>             <!-- 左侧：参数表单 -->
>             <Border Grid.Column="0" Background="#161B22" CornerRadius="6" Padding="16">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="10"/>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="10"/>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="10"/>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <Grid.ColumnDefinitions>
>                         <ColumnDefinition Width="Auto"/>   <!-- 标签列：自适应文字 -->
>                         <ColumnDefinition Width="12"/>     <!-- 标签和输入框间距 -->
>                         <ColumnDefinition Width="*"/>      <!-- 输入框列：瓜分剩余 -->
>                     </Grid.ColumnDefinitions>
>
>                     <!-- 第1行：设备名称 -->
>                     <TextBlock Grid.Row="0" Grid.Column="0" Text="设备名称：" 
>                                Foreground="#8B949E" FontSize="13" VerticalAlignment="Center"/>
>                     <TextBox Grid.Row="0" Grid.Column="2" Text="CNC-001"
>                              Background="#21262D" Foreground="#C9D1D9" Height="30"
>                              BorderBrush="#30363D" BorderThickness="1"/>
>
>                     <!-- 第2行：IP 地址 -->
>                     <TextBlock Grid.Row="2" Grid.Column="0" Text="IP 地址：" 
>                                Foreground="#8B949E" FontSize="13" VerticalAlignment="Center"/>
>                     <TextBox Grid.Row="2" Grid.Column="2" Text="192.168.1.100"
>                              Background="#21262D" Foreground="#C9D1D9" Height="30"
>                              BorderBrush="#30363D" BorderThickness="1"/>
>
>                     <!-- 第3行：采样周期（带单位后缀，演示多个 Auto 组合） -->
>                     <TextBlock Grid.Row="4" Grid.Column="0" Text="采样周期：" 
>                                Foreground="#8B949E" FontSize="13" VerticalAlignment="Center"/>
>                     <Grid Grid.Row="4" Grid.Column="2">
>                         <Grid.ColumnDefinitions>
>                             <ColumnDefinition Width="*"/>
>                             <ColumnDefinition Width="6"/>
>                             <ColumnDefinition Width="Auto"/>
>                         </Grid.ColumnDefinitions>
>                         <TextBox Grid.Column="0" Text="100"
>                                  Background="#21262D" Foreground="#C9D1D9" Height="30"
>                                  BorderBrush="#30363D" BorderThickness="1"/>
>                         <TextBlock Grid.Column="2" Text="ms" Foreground="#8B949E"
>                                    FontSize="13" VerticalAlignment="Center"/>
>                     </Grid>
>
>                     <!-- 第4行：报警阈值（带单位后缀） -->
>                     <TextBlock Grid.Row="6" Grid.Column="0" Text="报警阈值：" 
>                                Foreground="#8B949E" FontSize="13" VerticalAlignment="Center"/>
>                     <Grid Grid.Row="6" Grid.Column="2">
>                         <Grid.ColumnDefinitions>
>                             <ColumnDefinition Width="*"/>
>                             <ColumnDefinition Width="6"/>
>                             <ColumnDefinition Width="Auto"/>
>                         </Grid.ColumnDefinitions>
>                         <TextBox Grid.Column="0" Text="85.0"
>                                  Background="#21262D" Foreground="#C9D1D9" Height="30"
>                                  BorderBrush="#30363D" BorderThickness="1"/>
>                         <TextBlock Grid.Column="2" Text="°C" Foreground="#8B949E"
>                                    FontSize="13" VerticalAlignment="Center"/>
>                     </Grid>
>
>                     <!-- 空行 -->
>                     <!-- 备注标签 -->
>                     <TextBlock Grid.Row="8" Grid.Column="0" Grid.ColumnSpan="3"
>                                Text="▶ 拖拽窗口观察表单的响应行为：标签列不变，输入框列随窗口伸缩"
>                                Foreground="#484F58" FontSize="11" Margin="0,8,0,0"/>
>                 </Grid>
>             </Border>
>
>             <!-- 右侧：备注/说明区 -->
>             <Border Grid.Column="2" Background="#161B22" CornerRadius="6" Padding="12">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Grid.Row="0" Text="参数说明" Foreground="#3FB950"
>                                FontSize="14" FontWeight="Bold" Margin="0,0,0,8"/>
>                     <TextBlock Grid.Row="1" Text="• 设备名称：支持字母、数字、下划线&#x0a;• IP地址：支持 IPv4 格式&#x0a;• 采样周期：100-5000ms&#x0a;• 报警阈值：0-100°C&#x0a;&#x0a;修改参数后请点击'写入参数'保存到设备。" 
>                                Foreground="#8B949E" FontSize="12" TextWrapping="Wrap"/>
>                 </Grid>
>             </Border>
>         </Grid>
>
>         <!-- ====== 底部按钮区 ====== -->
>         <StackPanel Grid.Row="6" Orientation="Horizontal" HorizontalAlignment="Right">
>             <Button Content="取消" Width="80" Height="32" Margin="0,0,8,0"
>                     Background="#21262D" Foreground="#C9D1D9"/>
>             <Button Content="保存配置" Width="100" Height="32"
>                     Background="#FF6B35" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // GridCoreDemo.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class GridCoreDemo : Window
> {
>     public GridCoreDemo()
>     {
>         InitializeComponent();
>     }
> }
> ```
>
> **Grid 常用属性速查表：**
> | 属性 | 作用 | 默认值 | 示例 |
> |------|------|--------|------|
> | `RowDefinitions` | 行定义集合 | — | `<RowDefinition Height="Auto"/>` |
> | `ColumnDefinitions` | 列定义集合 | — | `<ColumnDefinition Width="2*"/>` |
> | `Grid.Row` | 子控件所在行（附加属性） | 0 | `Grid.Row="1"` |
> | `Grid.Column` | 子控件所在列（附加属性） | 0 | `Grid.Column="2"` |
> | `Grid.RowSpan` | 跨行数 | 1 | `Grid.RowSpan="2"` |
> | `Grid.ColumnSpan` | 跨列数 | 1 | `Grid.ColumnSpan="3"` |
> | `ShowGridLines` | 显示调试网格线 | False | `ShowGridLines="True"` |

> [!scene] 适用场景
> ✅ **表单布局**：标签-输入框对（Auto + *），Grid 是表单的天生选择
> ✅ **上位机主界面**：多区域仪表盘（顶栏/侧栏/内容区/底栏），一个外层 Grid 解决
> ✅ **数据表格头**：列宽精确控制（序号固定、名称 Auto、内容 Star），比 DataGrid Header 更灵活
> ✅ **设置面板**：多行多列参数配置，标签自动对齐、输入框自适应拉伸
> ❌ **简单垂直/水平堆叠**：3 个按钮竖着排用 StackPanel 更简洁，不需要 Grid
> ❌ **需要自动换行的列表**：WrapPanel 更合适

> [!pitfall] 常见踩坑
> 坑 1：**附加属性写错行/列索引** → `Grid.Row` 和 `Grid.Column` 默认都是 0。如果你只写了 `Grid.Row="1"` 没写 `Grid.Column`，控件会出现在第 1 行第 0 列（不是第 1 行整个跨行）。另一个常见错误是忘记 Grid 索引从 0 开始——"第一行"是 `Grid.Row="0"`。
>
> 坑 2：**忘记 RowSpan/ColumnSpan 导致布局错乱** → 标题栏要跨整行却没有写 `ColumnSpan`，结果标题只占第一格，后面全是空的。不管有几列，跨行/跨列必须显式声明。
>
> 坑 3：**Star 行的内容为空时高度为 0** → 如果 Star 行里没放任何内容，它的高度会被压缩到 0。这常发生在用 `*` 做间距行的时候——应该用固定像素做间距行。

> [!best] 最佳实践
> - 使用 `Auto` 作为内容行（标题、按钮）的高度，`*` 作为数据区的高度，让数据区占尽剩余空间
> - 表单类布局统一采用 `Auto + *` 列宽模式：第一列 Auto（标签），第二列 *（输入框），通过 `Margin` 控制行间距
> - 复杂界面优先考虑**一个外层 Grid 解决所有区域划分**，而不是三层 StackPanel 嵌套
> - `ShowGridLines="True"` 是调试利器，开发时打开可以看到每个单元格的边界，上线后记得关掉
> - 行和列定义写在 Grid 的最顶部，形成"目录"——维护者一眼看清整个页面结构

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的设备参数配置窗口，将 `ShowGridLines` 设为 `True` 观察网格线，确认每个控件所在的格子是否正确
> **Lv.2 小试牛刀**：给左侧表单再增加两行："通讯协议"下拉框和"是否启用"复选框，保持 Auto + * 的列宽模式
> **Lv.3 融会贯通**：设计一个 4 路温湿度监控界面：2×2 的网格，每个格子里放一个独立的小面板（温度 + 湿度 + 状态灯），用嵌套 Grid 实现每个小面板的内部布局

> [!related] 相关知识链接
> - ← 前置知识：尺寸单位说明（GridLength 的 Fixed/Auto/Star 详解）
> - ← 前置知识：常用布局属性（Margin/Padding/Alignment 在 Grid 中的行为）
> - → 后续必学：尺寸模式详解（Fixed/Auto/Star 深入对比）
> - → 后续必学：GridSplitter 可拖拽分隔条
> - → 后续必学：Grid 用法示例与最佳实践
> - ⇄ 关联概念：GridLength、RowDefinition、ColumnDefinition、附加属性（Attached Property）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.grid
