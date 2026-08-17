---
title: ListView 列表视图
section: 04-controls
parent: 4.4 选择类控件
---

# ListView 列表视图

> [!plain] 白话理解
> 设备台账、报警记录、产量报表——这些数据是"一行一条记录、每条多个字段"的表格形态。用 `ListBox` 一条条堆文字会很拥挤，用户更习惯"列头 + 多列"的表格。
> `ListView` 是 `ListBox` 的"多列版"：通过 `View` 属性切换呈现模式，最常用的是 `GridView`——用 `GridViewColumn` 定义列头与列宽，每列绑定一个字段。设备编号、名称、状态、投运时间一行排开，点列头还能自定义排序。简单说：ListBox 是"一列清单"，ListView 是"多列表格"。

> [!def] 官方定义
> ListView 是 WPF 中"多视图列表"控件，位于 `System.Windows.Controls` 命名空间，继承自 `ListBox`。核心是 `View` 属性（`ViewBase`）：设置为 `GridView` 后，通过 `GridViewColumn` 定义多列，每列用 `DisplayMemberBinding`（简单绑定）或 `CellTemplate`（自定义单元格外观）呈现。它继承 ListBox 的全部选择能力（`SelectedItem`、`SelectionMode`）与虚拟化滚动。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.listview

> [!origin] 由来背景
> WinForms 的 ListView 是"控件大杂烩"的典型：列头、图标、分组、检查框等功能互相耦合，数据绑定、列排序、行内控件都要手工配置，代码量与维护成本居高不下。WPF 将 ListView 重构为"基础选择列表 + 可插拔视图"：ListView 本身只管选中与滚动，具体长成什么样完全由 `View`（GridView 是内置实现）决定。这种组合模式让"同一个数据源，切换表格/图标/自定义视图"成为可能。上位机的设备台账、参数一览、历史报警，用 GridView 列定义 + 数据绑定即可构建出专业表格。

> [!essentials] 核心要点
> - **View + GridView 组合**：`ListView.View` 挂 `GridView` 才有表格效果
> - **GridViewColumn 定义列**：`Header` 列标题、`Width` 列宽、`DisplayMemberBinding` 绑字段
> - **CellTemplate 自定义单元格**：字段需要样式/控件时用 `DataTemplate` 替代简单绑定
> - **继承 ListBox 选择**：`SelectedItem` 拿到整行数据对象
> - **列头排序**：默认无排序，需在列头点击事件中自行实现
> - **虚拟化滚动**：大数据量（万级）依然流畅

> [!example] 完整示例
> **设备台账演示：GridView 多列定义、列头点击排序、SelectedItem 取行：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备台账 - ListView" Height="480" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="10">
>         <StackPanel DockPanel.Dock="Bottom" Orientation="Horizontal" Margin="0,8,0,0">
>             <Button Content="查看选中设备" Click="OnShow" Padding="8,4"/>
>         </StackPanel>
>         <ListView x:Name="lvDevices" Background="#161B22" BorderBrush="#2A4A6C"
>                   BorderThickness="1">
>             <ListView.View>
>                 <GridView>
>                     <!-- 各列 Header 可点击：后台实现按列排序 -->
>                     <GridViewColumn Header="设备编号" Width="120"
>                                     DisplayMemberBinding="{Binding Id}"/>
>                     <GridViewColumn Header="设备名称" Width="180"
>                                     DisplayMemberBinding="{Binding Name}"/>
>                     <GridViewColumn Header="状态" Width="100">
>                         <GridViewColumn.CellTemplate>
>                             <DataTemplate>
>                                 <TextBlock Text="{Binding Status}" Foreground="#3FB950"/>
>                             </DataTemplate>
>                         </GridViewColumn.CellTemplate>
>                     </GridViewColumn>
>                     <GridViewColumn Header="投运时间" Width="140"
>                                     DisplayMemberBinding="{Binding StartDate}"/>
>                 </GridView>
>             </ListView.View>
>         </ListView>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Collections.Generic;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             lvDevices.ItemsSource = new List<Device>
>             {
>                 new Device { Id = "DEV-001", Name = "主电机", Status = "运行中", StartDate = "2024-03-12" },
>                 new Device { Id = "DEV-002", Name = "冷却泵", Status = "运行中", StartDate = "2024-06-01" },
>                 new Device { Id = "DEV-003", Name = "输送带", Status = "停机", StartDate = "2023-11-20" }
>             };
>         }
>
>         private void OnShow(object sender, RoutedEventArgs e)
>         {
>             if (lvDevices.SelectedItem is Device d)
>             {
>                 MessageBox.Show($"设备 {d.Name}（{d.Id}），状态：{d.Status}", "设备信息");
>             }
>         }
>     }
>
>     public class Device
>     {
>         public string Id { get; set; }
>         public string Name { get; set; }
>         public string Status { get; set; }
>         public string StartDate { get; set; }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备台账：设备编号、名称、状态、投运时间等多字段一览
> ✅ 报警记录表格：时间、级别、来源、内容多列展示，便于筛选排序
> ✅ 产量/报表数据：每行一条记录、每列一个字段的表格形态
> ✅ 历史数据查询：多字段展示 + 选中行查看详情
> ❌ 单字段清单且无表格需求（用「listbox-列表框」更简单）
> ❌ 需要单元格合并/复杂表格计算（考虑 DataGrid）

> [!pitfall] 常见踩坑
> 坑 1：**忘记设 `View=GridView`** → ListView 显示成一列普通列表。原因：ListView 默认没有多列视图。解决：`<ListView.View><GridView>...</GridView></ListView.View>`
>
> 坑 2：**列宽固定导致内容截断** → 长文本显示"…"或挤掉。原因：列宽 `Width` 未合理设置。解决：设置 `Width` 与 `DisplayMemberBinding` 同时启用列宽拖动（GridView 默认支持拖拽）
>
> 坑 3：**单元格需要状态着色却用 DisplayMemberBinding** → 颜色不生效。原因：简单绑定只显示文本。解决：用 `CellTemplate` + `DataTemplate`（放 TextBlock 并绑 `Foreground`）
>
> 坑 4：**点击列头想排序却发现没有排序功能** → 点了没反应。原因：GridView 默认不提供排序。解决：自行监听列头点击（`GridViewColumnHeader.Click`）实现排序比较器

> [!best] 最佳实践
> - 纯文本列用 `DisplayMemberBinding`，需要样式/控件用 `CellTemplate`，按需选择
> - 列宽用 `Width="*"`（按比例）或固定值 + 允许拖动，兼顾自适应与操作习惯
> - 状态列用 `CellTemplate` 绑 `Foreground`（运行绿/报警红），信息一眼可辨
> - `SelectedItem` 拿整行数据对象，双击行查看详情是标准交互
> - 大数据量保持虚拟化，别在 CellTemplate 里放重量级控件

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"运行时间"列头手动调整列宽，观察显示效果
> **Lv.2 小试牛刀**：给"状态"列改用 `CellTemplate`：运行绿色、报警红色、离线灰色
> **Lv.3 融会贯通**：实现列头排序：监听 `GridViewColumnHeader.Click`，点击"温度"列按温度升/降序排列
> **Lv.4 挑战**：实现"主从联动"：上方 ListView 选设备行，下方详情面板自动显示该设备的全部参数（利用 `SelectedItem` 绑定）

> [!related] 相关知识链接
> - ← 前置知识：「listbox-列表框」是它的父类，理解选择模型；「itemscontrol-条目控件」数据+模板基础
> - → 后续必学：「datagrid-数据表格」需要单元格编辑/合并时的更重方案
> - ⇄ 关联概念：「scrollbar-滚动条」虚拟化滚动；「groupbox-分组框」把表格包进带标题的面板
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.listview
