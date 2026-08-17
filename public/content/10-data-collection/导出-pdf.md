---
title: 导出 PDF
section: 10-data-collection
parent: 10.5 数据导入导出
---

# 导出 PDF

> [!plain] 白话理解
> 把导出 PDF 比作**把材料打印装订成册**：Excel 像"电子表格原稿"（谁都能改），PDF 像"装订好的正式文件"（版式固定、不可随便改，谁打开都一样）。给客户、审计、车间归档的正式报表，就该是 PDF 的形态。
>
> 生成 PDF 有两条路：
> - **QuestPDF 这类库**：像"写文档的排版工具"——你用代码描述"第一页：标题+表格+页脚页码"，它帮你排好版生成 PDF 文件，完全不用装任何软件
> - **WPF 的 `PrintDialog`**：像"用打印机"——把你界面上的 `Grid`/`DataGrid` 直接"打印"出来，选"Microsoft Print to PDF"就得到一个 PDF
>
> 一句话：**导出 PDF = 用 QuestPDF 的 Fluent API 描述"标题+表格+页眉页脚"生成固定版式文件**，追求正式、不可篡改、跨设备一致显示的交付物。

> [!def] 官方定义
> - **PDF（Portable Document Format）**：Adobe 于 1993 年发布的**跨平台文档格式**，固定版式（所见即所得），开放标准（ISO 32000）。
> - **QuestPDF**：现代 .NET 开源库（NuGet `QuestPDF`），基于流式布局（Fluent API）与 SkiaSharp 渲染生成 PDF。核心类型：`QuestPDF.Fluent.Document`、`Page`、`Table`；**v2023.10+ 需设置 `QuestPDF.Settings.License = LicenseType.Community;`**（社区版免费，商用可选付费）。
> - **备选方案**：**PDFsharp**（开源，`PdfSharp`，面向对象绘制）、**PrintDialog**（`System.Windows.Controls.PrintDialog`，把 WPF 视觉树"打印"到 `Microsoft Print to PDF` 虚拟打印机）。
> - 📖 官方文档：[QuestPDF 官网](https://www.questpdf.com/)、[PDFsharp 文档](http://www.pdfsharp.net/)、[PrintDialog 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.printdialog)

> [!origin] 由来背景
> 1991 年，Adobe 创始人 John Warnock 提出"Camelot 项目"，目标是解决"不同电脑上文档排版不一致"的问题——1993 年 PDF 1.0 发布，1994 年免费发布 Reader，2008 年成为国际标准 ISO 32000。PDF 的"固定版式"特性使其天然适合正式报表、合同、归档。
> .NET 生态生成 PDF 的库几经更迭：PDFsharp（2004 年起，德国开源社区）、iTextSharp（因许可证收紧口碑受损）、**QuestPDF**（2018 年发布，以"用代码描述文档流"的现代 Fluent API 迅速流行）。对 WPF 上位机而言，QuestPDF 是目前"表格 + 页眉页脚 + 页码"报表生成最顺手的选择。

> [!essentials] 核心要点
> - **Community 许可必须先设**：`QuestPDF.Settings.License = LicenseType.Community;`——QuestPDF 新版本不设会在运行时抛 `LicenseException`
> - **流式布局三段式**：`Document.Create` → `Page`（页面尺寸 `PageSizes.A4`、边距 `Margin`）→ `Header()` 页眉 / `Content()` 内容 / `Footer()` 页脚
> - **表格用 `Table` + `ColumnsDefinition`**：`RelativeColumn(3)` 定义各列相对宽度，`Header()` 包表头行（自动跨页重复），数据行逐个 `Cell()` 写
> - **页脚页码一行代码**：`page.Footer().AlignCenter().Text(t => t.CurrentPageNumber());`
> - **替代方案按需选**：追求轻量单张报表用 PDFsharp；界面已有完美排版的视图，用 `PrintDialog` + `Visual` 直接打印更省事
> - **文件名与保存对话框**：与导出 Excel 一致，`SaveFileDialog` 过滤 `PDF 文件 (*.pdf)|*.pdf`

> [!example] 完整示例
> **PDF 导出演示：基于 QuestPDF 生成 A4 设备数据报表(表格+页眉页脚)：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="导出 PDF" Height="400" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <Button x:Name="GenBtn" Content="生成演示数据" Click="OnGenClick" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="ExportBtn" Content="导出 PDF..." Click="OnExportClick" Padding="10,6"
>                     Background="#238636" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="InfoText" Grid.Row="1" Margin="5" Foreground="#58A6FF"
>                    Text="QuestPDF 生成 A4 报表（表格+页眉页脚）"/>
>
>         <ListBox x:Name="DataList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package QuestPDF
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using Microsoft.Win32;
> using QuestPDF.Fluent;
> using QuestPDF.Helpers;
> using QuestPDF.Infrastructure;
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
>             for (int i = 0; i < 15; i++)
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
>                 Filter = "PDF 文件 (*.pdf)|*.pdf",
>                 FileName = $"设备报表_{DateTime.Now:yyyyMMdd}.pdf"
>             };
>             if (dlg.ShowDialog() != true) return;
>
>             QuestPDF.Settings.License = LicenseType.Community;   // 社区版免费许可
>
>             Document.Create(container =>
>             {
>                 container.Page(page =>
>                 {
>                     page.Size(PageSizes.A4);
>                     page.Margin(2, Unit.Centimetre);
>
>                     // 页眉：报表标题
>                     page.Header().Text("设备数据采集报表")
>                                  .FontSize(20).Bold();
>
>                     // 内容：三列表格
>                     page.Content().Table(table =>
>                     {
>                         table.ColumnsDefinition(c =>
>                         {
>                             c.RelativeColumn(3);   // 时间列较宽
>                             c.RelativeColumn(2);   // 设备列
>                             c.RelativeColumn(2);   // 温度列
>                         });
>
>                         // 表头行
>                         table.Header(h =>
>                         {
>                             h.Cell().Background(Colors.Grey.Lighten2).Text("时间").Bold();
>                             h.Cell().Background(Colors.Grey.Lighten2).Text("设备").Bold();
>                             h.Cell().Background(Colors.Grey.Lighten2).Text("温度(℃)").Bold();
>                         });
>
>                         // 数据行
>                         foreach (var d in _data)
>                         {
>                             table.Cell().Text(d.Time.ToString("yyyy-MM-dd HH:mm"));
>                             table.Cell().Text(d.Device);
>                             table.Cell().Text(d.Temp.ToString("F1"));
>                         }
>                     });
>
>                     // 页脚：页码
>                     page.Footer().AlignCenter().Text(t =>
>                     {
>                         t.CurrentPageNumber();
>                     });
>                 });
>             }).GeneratePdf(dlg.FileName);
>
>             InfoText.Text = $"已导出 → {dlg.FileName}";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **正式交付的报表**：给客户、审计、监管的月度/年度报告，PDF 固定版式不可篡改
> ✅ **跨平台查看**：车间电脑、手机、领导办公电脑都能打开且显示一致，无需装 Office
> ✅ **归档凭证**：报警记录、操作记录归档为 PDF，长期保留（配合 `存储策略与数据保留`）
> ✅ **界面"所见即所得"打印**：把 WPF 界面直接打印成 PDF（`PrintDialog` + Microsoft Print to PDF）
> ❌ **需要接收方二次编辑**：对方要改数据填字段，给 Excel 更合适（见 `导出-excelepplusclosedxml`）
> ❌ **海量数据（几十万行）报表**：PDF 表格排版吃力，先汇总成统计表再导出

> [!pitfall] 常见踩坑
> 坑 1：**没设 Community 许可就运行** → 现象：导出时抛 `LicenseException` 且提示语很长 → 原因：QuestPDF 新版要求显式声明许可模式 → 解决：在任何 `Document.Create` 前加 `QuestPDF.Settings.License = LicenseType.Community;`（示例已写）
>
> 坑 2：**表格单元格顺序/数量与列定义不一致** → 现象：数据错位、排版错乱 → 原因：`Table` 是"流式单元格"，写的 Cell 必须按列顺序（先整行写完再下一行）→ 解决：先写 `Header` 全部单元格，再逐数据行按列顺序写；列数必须等于 `ColumnsDefinition` 定义的列数
>
> 坑 3：**中文在 PDF 里变方块/乱码** → 现象：导出的 PDF 中文全是"□□□" → 原因：PDF 需要嵌入支持中文的字体，某些环境默认字体不含中文字形 → 解决：QuestPDF 设置 `.FontFamily("Microsoft YaHei")` 或用 `.TextStyle(x => x.FontFamily(...))` 显式指定中文字体
>
> 坑 4：**在 UI 线程同步生成大报表** → 现象：点导出后界面假死几秒到几十秒 → 原因：`GeneratePdf` 是 CPU 密集操作 → 解决：放到 `Task.Run` 生成，完成后 `Dispatcher.Invoke` 提示完成（见 `采集线程模型设计` 的线程纪律）

> [!best] 最佳实践
> - **报表模板函数化**：把 `CreateReport(IEnumerable<T> data, string title)` 抽成独立方法，日报/月报/报警报共用一个模板
> - **中文显式指定字体**：报表开头统一 `.TextStyle(x => x.FontFamily("Microsoft YaHei"))`，避免默认字体中文问题
> - **数据先统计后渲染**：PDF 报表放"汇总数据"（平均值、越限次数）而非全部原始明细，页面可控、信息密度高（见 `报表生成`）
> - **异步生成 + 完成提示**：`await Task.Run(() => doc.GeneratePdf(path))`，界面保持响应，完成后 `MessageBox`/状态栏提示
> - **与 Excel 导出互补**：明细数据用 Excel/CSV（可筛选），正式报表用 PDF（固定版式）——按接收方需求选型

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例生成 15 条数据并导出 PDF，用 PDF 阅读器打开检查页眉/表格/页码；把 `RelativeColumn(3)` 改成 `(1)`，对比列宽变化
> **Lv.2 加属性**：在页眉下方加一行"生成时间：{DateTime.Now}"副标题；把数据行按设备分组，每组前加一行"分组标题"单元格
> **Lv.3 改造**：数据源换成 `轻量级数据库-sqlite` 的查询结果，实现"历史数据 → PDF 报表"；再用 `Task.Run` 异步生成避免卡界面
> **Lv.4 挑战**：生成"多页正式报表"：第一页为汇总统计（总产量、平均温度、越限次数），后续页为明细表格；再把 `实时曲线livecharts2` 截图成 PNG 嵌入报表页——一份接近交付级的月度报告

> [!related] 相关知识链接
> - ← 前置知识：`导出-excelepplusclosedxml`（同为导出，先理解数据源与保存对话框）、`报表生成`（报表统计逻辑）
> - → 输出对比：`导出-csv`（轻量、可编辑的导出方案）
> - ⇄ 关联概念：`轻量级数据库-sqlite`（PDF 报表的数据源）、`存储策略与数据保留`（PDF 归档的保留期）、`实时曲线livecharts2`（图表嵌入 PDF）
> - 📖 官方文档：[QuestPDF 官网](https://www.questpdf.com/)、[PDFsharp 文档](http://www.pdfsharp.net/)、[PrintDialog 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.printdialog)
