---
title: 导出 Excel（EPPlus、ClosedXML）
section: 10-data-collection
parent: 10.5 数据导入导出
---

# 导出 Excel（EPPlus、ClosedXML）

> [!plain] 白话理解
> 把导出 Excel 比作**把纸质台账誊写进 Excel 表格**：你的上位机里存着采集数据（内存/数据库），导出就是把它"誊"进一个 `.xlsx` 文件——第一行写表头（时间、设备、温度），下面一行行填数据，最后调一下列宽让表格好看，存盘收工。
>
> 为什么要用库而不是自己写？因为 `.xlsx` 文件表面是文件、内里其实是一个 **ZIP 压缩包 + 一堆 XML**（这就是 Office Open XML 格式），手写这套结构又繁琐又容易错。**ClosedXML 和 EPPlus 就是帮你把"建表、写单元格、调格式、存盘"包好的工具**——你要做的只是"给哪个单元格写什么值"。
>
> 一句话：**导出 Excel = 用 ClosedXML/EPPlus 把内存数据一行行写进 `.xlsx` 的单元格，再用 SaveFileDialog 让用户选个保存位置**。

> [!def] 官方定义
> - **ClosedXML**：开源（MIT）的 .NET 库（NuGet `ClosedXML`），**不是微软官方控件**。它以**友好对象模型**封装 Office Open XML（xlsx），核心类型：`ClosedXML.Excel.XLWorkbook`（工作簿）、`IXLWorksheet`（工作表）、`IXLCell`（单元格）。
> - **EPPlus**：老牌 .NET Excel 库（NuGet `EPPlus`，2019 年起 v5 改为 Polyform Noncommercial 许可，**商业使用需付费**）。提供高性能写入与样式、图表、公式支持。
> - 两者共同点：读写 `.xlsx`（Excel 2007+ 格式）、无需安装 Excel、跨平台（.NET Core/.NET 5+）。
> - 📖 官方文档：[ClosedXML GitHub](https://github.com/ClosedXML/ClosedXML)、[EPPlus 官网](https://epplussoftware.com/)

> [!origin] 由来背景
> Excel 的 `.xls` 二进制格式长期是微软私有秘密，第三方程序导出 Excel 只能依赖 COM 自动化（调用真实 Excel，慢且要求装 Office）。2006 年微软发布 **Office Open XML**（ECMA-376 标准）——xlsx 变为公开的 ZIP+XML 结构，于是社区诞生了一批"无需装 Excel 直接读写 xlsx"的库。
> **EPPlus** 2009 年发布，功能全、性能好，2019 年 v5 改商业许可引起一阵风波；**ClosedXML** 则以 MIT 免费许可成为替代首选，API 更贴近"所见即所得"。上位机领域，导出报表给车间管理/质检人员看 Excel 是刚需，这两款库是当前 WPF 上位机导出 Excel 的两大主力。

> [!essentials] 核心要点
> - **三步导出流程**：`new XLWorkbook()` → `wb.Worksheets.Add("表名")` 拿工作表 → 给单元格 `Cell(行,列).Value = 值` 赋值 → `wb.SaveAs(路径)` 存盘
> - **先让用户选保存路径**：`SaveFileDialog`（`Microsoft.Win32`）设 `Filter = "Excel 文件 (*.xlsx)|*.xlsx"`，用户取消时 `ShowDialog() != true` 直接 return
> - **表头与数据分开写**：第一行写列名（时间/设备/温度），第二行起循环写数据行——表格才有"表头语义"
> - **收尾调样式**：`ws.Columns().AdjustToContents()` 自适应列宽；需要时 `Style.Font.Bold` 表头加粗、`Style.Fill.BackgroundColor` 上色
> - **工作簿用完 `using` 释放**：`XLWorkbook` 占用文件句柄与内存，`using` 包裹确保 `SaveAs` 后释放
> - **注意 EPPlus 授权**：EPPlus 5.0+ 非商业用途免费、商用需授权；ClosedXML 一直 MIT——**商业上位机默认选 ClosedXML 更省心**

> [!example] 完整示例
> **Excel 导出演示：基于 ClosedXML 生成 .xlsx 报表(EPPlus 用法类似，均需 NuGet 安装)：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="导出 Excel" Height="400" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <Button x:Name="GenBtn" Content="生成 20 条演示数据" Click="OnGenClick" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="ExportBtn" Content="导出 Excel..." Click="OnExportClick" Padding="10,6"
>                     Background="#238636" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="InfoText" Grid.Row="1" Margin="5" Foreground="#58A6FF"
>                    Text="ClosedXML 库生成 .xlsx（EPPlus 用法类似）"/>
>
>         <ListBox x:Name="DataList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package ClosedXML
> // 若用 EPPlus：Install-Package EPPlus
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using ClosedXML.Excel;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private List<(DateTime Time, string Device, double Temp)> _data =
>             new List<(DateTime, string, double)>();
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnGenClick(object sender, RoutedEventArgs e)
>         {
>             _data.Clear();
>             var rnd = new Random();
>             for (int i = 0; i < 20; i++)
>                 _data.Add((DateTime.Now.AddMinutes(-i), "设备" + (i % 3 + 1), rnd.Next(20, 80)));
>             DataList.Items.Clear();
>             foreach (var d in _data)
>                 DataList.Items.Add($"{d.Time:HH:mm}  {d.Device}  {d.Temp}℃");
>             InfoText.Text = $"已生成 {_data.Count} 条记录";
>         }
>
>         private void OnExportClick(object sender, RoutedEventArgs e)
>         {
>             if (_data.Count == 0) { InfoText.Text = "请先生成数据"; return; }
>
>             var dlg = new SaveFileDialog
>             {
>                 Filter = "Excel 文件 (*.xlsx)|*.xlsx",
>                 FileName = $"报表_{DateTime.Now:yyyyMMdd}.xlsx"
>             };
>             if (dlg.ShowDialog() != true) return;
>
>             using (var wb = new XLWorkbook())                 // 创建工作簿
>             {
>                 var ws = wb.Worksheets.Add("采集数据");       // 工作表
>                 ws.Cell(1, 1).Value = "时间";                 // 表头
>                 ws.Cell(1, 2).Value = "设备";
>                 ws.Cell(1, 3).Value = "温度(℃)";
>
>                 int row = 2;
>                 foreach (var d in _data)                     // 数据行
>                 {
>                     ws.Cell(row, 1).Value = d.Time;
>                     ws.Cell(row, 2).Value = d.Device;
>                     ws.Cell(row, 3).Value = d.Temp;
>                     row++;
>                 }
>                 ws.Columns().AdjustToContents();             // 自适应列宽
>                 wb.SaveAs(dlg.FileName);
>             }
>             InfoText.Text = $"已导出 → {dlg.FileName}";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **报表导出给业务人员**：车间管理、质检、工艺人员拿到 Excel 直接筛选、透视、画图
> ✅ **历史数据导出分析**：采集数据导出给数据分析/质量问题追溯，Excel 是通用载体
> ✅ **交接班/日报台账**：每班导出当日生产记录，Excel 存档便于核对
> ❌ **海量数据导出（百万行级）**：Excel 单 sheet 上限 104 万行且性能差，应导出 CSV（见 `导出-csv`）或交给数据库
> ❌ **需要 VBA 宏/旧 .xls 格式**：xlsx 不支持宏（用 xlsm），老系统兼容需另想办法

> [!pitfall] 常见踩坑
> 坑 1：**EPPlus 5.0+ 未设授权直接抛异常** → 现象：`LicenseException: You must add the license...` → 原因：EPPlus 5 起要求显式设置许可 → 解决：商用买授权、非商用 `ExcelPackage.LicenseContext = LicenseContext.NonCommercial`；或干脆用 ClosedXML（MIT 免费无此问题）
>
> 坑 2：**日期写入后 Excel 显示一串数字（序列号）** → 现象：时间列显示 `45255.5` 而不是"2026-08-17 08:30" → 原因：Excel 内部日期就是序列号，需要单元格格式 → 解决：给时间列设格式 `ws.Cell(row,1).Style.DateFormat.Format = "yyyy-MM-dd HH:mm:ss"`，或写入已格式化的字符串
>
> 坑 3：**导出路径含非法字符/目录不存在** → 现象：`SaveAs` 抛 `DirectoryNotFoundException` → 原因：用户输入了 `\ / : * ?` 等非法字符或选了不存在的目录 → 解决：对文件名做 `Path.GetInvalidFileNameChars()` 清洗；`Directory.CreateDirectory(Path.GetDirectoryName(path))` 兜底
>
> 坑 4：**大数据量用逐单元格写入** → 现象：几万行导出要等几十秒、内存飙升 → 原因：每个 `Cell` 赋值都有对象开销 → 解决：大批量用 `ws.Cell(row,1).InsertData`/`LoadFromDataTable`（ClosedXML）或 EPPlus 的 `LoadFromCollection` 批量装载

> [!best] 最佳实践
> - **导出逻辑封装成服务**：`ExcelExportService.Export<T>(IEnumerable<T> rows, string path)`，统一管表头、格式、异常，UI 只调一行
> - **表头先加粗再写数据**：`ws.Range(1,1,1,3).Style.Font.Bold = true`，报表可读性立刻提升
> - **列宽统一 `AdjustToContents` 兜底**：不调整列宽导出后中文全挤在一起，`AdjustToContents()` 一行解决
> - **数据源优先取数据库**：导出前从 `轻量级数据库-sqlite`/关系库 `SELECT` 查好，别把采集内存列表直接导出（数据可能没落库不完整）
> - **文件名带时间戳**：`报表_{yyyyMMdd_HHmmss}.xlsx` 避免覆盖，配合 `存储策略与数据保留` 的归档思路

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例"生成数据 → 导出 Excel"，用 Excel 打开检查三列数据；把 `AdjustToContents` 那行注释掉再导一次，对比列宽差异
> **Lv.2 加属性**：加一个"设备"筛选 ComboBox（选择只导出某台设备的数据）；导出时把表头加粗、加"汇总行"（平均温度）
> **Lv.3 改造**：把数据源从内存列表换成 `轻量级数据库-sqlite`：从 `DeviceData` 表查询最近 1 小时数据再导出，实现"历史数据导出"完整链路
> **Lv.4 挑战**：生成"多 Sheet 报表"：Sheet1 明细、Sheet2 按设备分组统计（`GroupBy` 汇总）、Sheet3 报警记录，全部带样式与列宽自适应——一份可直接交付车间使用的 Excel 报表

> [!related] 相关知识链接
> - ← 前置知识：`本地文件存储jsonxmlcsv二进制`（文件 IO 与路径管理）、`轻量级数据库-sqlite`（导出数据源）
> - → 同类必读：`导出-csv`（轻量导出方案）、`导出-pdf`（不可编辑版式）、`报表生成`（报表的统计逻辑）
> - ⇄ 关联概念：`存储策略与数据保留`（导出的归档文件怎么管）、`数据转换与工程值计算`（导出的工程值字段）
> - 📖 官方文档：[ClosedXML GitHub](https://github.com/ClosedXML/ClosedXML)、[EPPlus 官网](https://epplussoftware.com/)、[Office Open XML（Wikipedia）](https://zh.wikipedia.org/wiki/Office_Open_XML)
