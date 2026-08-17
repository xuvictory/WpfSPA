---
title: 导出 PDF
section: 10-data-collection
parent: 10.5 数据导入导出
---

# 导出 PDF

> [!plain] 白话理解
> "导出 PDF"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"导出 PDF"是一个重要的知识点。数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 导出 PDF是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 导出 PDF的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"导出 PDF"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**概念理解不清就上手** → 建议先把本章节的前置知识点学完，理解基础原理后再动手写代码
> 
> 坑 2：**忽略了官方文档** → Microsoft Docs 上有最权威的说明和最完整的示例代码，遇到问题先查文档
>
> 坑 3：**代码写的太"一次性"** → 养成写可复用代码的习惯，以后项目中会反复用到这些知识

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"导出 PDF"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"导出 PDF"
> - → 后续必学：掌握"导出 PDF"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
