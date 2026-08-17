---
title: 导出 CSV
section: 10-data-collection
parent: 10.5 数据导入导出
---

# 导出 CSV

> [!plain] 白话理解
> 把导出 CSV 比作**把台账抄成一行行的"记账本"**：每条记录占一行，字段用逗号分隔，第一行是表头（时间,设备,温度）。这个"记账本"是最朴素的数据格式——**记事本能打开、Excel 能打开、任何编程语言都能读**，是人类数据交换的"普通话"。
>
> 相比 Excel 导出，CSV 有几个天生的好处：**生成快**（就是拼字符串写文件，不解析任何复杂结构）、**体积小**、**格式开放**。但也有一个著名的大坑：**中文乱码**——Excel 默认按 ANSI 打开 CSV，UTF-8 编码的中文会变乱码，解决方法是保存时加 BOM 头（示例代码 `new UTF8Encoding(true)` 就是这个）。
>
> 一句话：**导出 CSV = 把数据拼成"逗号分隔的文本行"，用带 BOM 的 UTF-8 存盘，让 Excel 打开中文不乱码**——大量数据导出时的首选轻量方案。

> [!def] 官方定义
> - **CSV（Comma-Separated Values，逗号分隔值）**：以纯文本存储表格数据的文件格式，每行一条记录，字段用分隔符（通常逗号）隔开，规范见 **RFC 4180**（2005 年正式化）。
> - **转义规则**：字段含逗号、双引号或换行时，整个字段用双引号包裹，字段内的双引号翻倍（`"` → `""`）——不遵守则 Excel 打开会错列。
> - **编码要求**：**UTF-8 with BOM**（`new UTF8Encoding(true)`）是 Excel 打开中文不乱码的关键；.NET 的 `File.WriteAllText` 默认 UTF-8 无 BOM，需显式传编码参数。
> - **可选库**：`CsvHelper`（开源、处理转义/流式读取的标准库）；手写 `StringBuilder` 拼接在数据量不大时完全够用。
> - 📖 官方文档：[RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)、[UTF8Encoding 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.text.utf8encoding)、[CsvHelper](https://joshclose.github.io/CsvHelper/)

> [!origin] 由来背景
> CSV 是"计算机最早的数据格式"之一：**1970 年代** IBM 大型机与打孔卡时代就有"逗号分隔记录"的概念，早期表格软件（如 1979 年的 VisiCalc、1983 年的 Lotus 1-2-3）用它做数据导入导出。因为太简单、太通用，它从未被取代，只是**规则一直没有统一**（分隔符有的用逗号、有的用分号，引号转义各家不同），直到 2005 年 **RFC 4180** 才给出权威定义。
> 对上位机而言，CSV 是"导出给 ERP 系统导入"、"导出给数据分析师"、"归档海量原始数据"时最高性价比的方案——比 xlsx 快、比 JSON 通用、比二进制可读。它与 Excel 导出互补：**要格式用 xlsx，要快和通用用 CSV**。

> [!essentials] 核心要点
> - **三步导出**：`StringBuilder` 拼表头与数据行 → `SaveFileDialog` 选路径 → `File.WriteAllText(path, text, new UTF8Encoding(true))`（**BOM 必须**）
> - **BOM 是中文不乱码的关键**：`new UTF8Encoding(true)` 会在文件头写 `EF BB BF`，Excel 识别为 UTF-8；无 BOM 时 Excel 按 ANSI 读，中文全乱
> - **转义三规则**：字段含逗号 → 用引号包住；字段含引号 → 引号翻倍（`"`→`""`）；字段含换行 → 也需引号包裹（否则记录被拆行）
> - **表头先行**：第一行写列名（时间,设备,温度），接收方才能识别字段含义
> - **大数据量用 `StreamWriter` 逐行写**：几万行别全拼进 `StringBuilder`（内存暴涨），用 `StreamWriter` + `WriteLine` 边写边刷
> - **长数字加引号防科学计数法**：设备号/条形码这类长数字（如 `622100123456`）不加引号，Excel 会显示成 `6.221E+11`

> [!example] 完整示例
> **CSV 导出演示：采集记录生成后通过保存对话框导出为 UTF-8 CSV(Excel 可直接打开)：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="导出 CSV" Height="440" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <Button x:Name="GenBtn" Content="生成演示数据" Click="OnGenClick" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="ExportBtn" Content="导出 CSV..." Click="OnExportClick" Padding="10,6"
>                     Background="#238636" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="InfoText" Grid.Row="1" Margin="5" Foreground="#58A6FF"
>                    Text="采集 10 条记录，导出为 UTF-8 编码 CSV"/>
>
>         <ListBox x:Name="DataList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>
>         <TextBlock x:Name="StatusText" Grid.Row="3" Margin="5" Foreground="#8B949E" Text="未导出"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.IO;
> using System.Text;
> using System.Windows;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 内存中的采集记录
>         private List<(DateTime Time, string Device, double Temp)> _data =
>             new List<(DateTime, string, double)>();
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnGenClick(object sender, RoutedEventArgs e)
>         {
>             _data.Clear();
>             var rnd = new Random();
>             for (int i = 0; i < 10; i++)
>                 _data.Add((DateTime.Now.AddSeconds(-i * 5), "设备" + (i % 3 + 1), rnd.Next(20, 80)));
>             DataList.Items.Clear();
>             foreach (var d in _data)
>                 DataList.Items.Add($"{d.Time:HH:mm:ss}  {d.Device}  {d.Temp}℃");
>             InfoText.Text = $"已生成 {_data.Count} 条记录";
>         }
>
>         private void OnExportClick(object sender, RoutedEventArgs e)
>         {
>             if (_data.Count == 0) { StatusText.Text = "请先生成数据"; return; }
>
>             var dlg = new SaveFileDialog
>             {
>                 Filter = "CSV 文件 (*.csv)|*.csv",
>                 FileName = $"数据导出_{DateTime.Now:yyyyMMdd_HHmmss}.csv"
>             };
>             if (dlg.ShowDialog() != true) return;
>
>             var sb = new StringBuilder();
>             sb.AppendLine("时间,设备,温度");                    // 表头
>             foreach (var d in _data)
>                 sb.AppendLine($"{d.Time:yyyy-MM-dd HH:mm:ss},{d.Device},{d.Temp:F1}");
>
>             // 带 BOM 的 UTF-8：Excel 打开中文不乱码
>             File.WriteAllText(dlg.FileName, sb.ToString(), new UTF8Encoding(true));
>             StatusText.Text = $"已导出 {_data.Count} 条 → {dlg.FileName}";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **海量数据导出**：几万到几十万条数据导出，CSV 生成速度远超 xlsx，Excel 打开也流畅
> ✅ **对接 ERP/其他系统**：绝大多数系统都支持 CSV 导入，CSV 是系统间交换的"通用语言"
> ✅ **数据分析师/质检人员导出**：需要原始明细在 Excel 里透视、筛选、画图，CSV 足够且免费开放
> ✅ **原始数据归档**：`存储策略与数据保留` 里 TTL 删除前的归档导出，CSV 体积小、可长期保存
> ❌ **需要格式/样式**：合并单元格、颜色、多 Sheet——CSV 只有纯文本，用 `导出-excelepplusclosedxml`
> ❌ **需要防篡改的正式交付**：CSV 是纯文本谁都能改，正式凭证用 `导出-pdf`

> [!pitfall] 常见踩坑
> 坑 1：**没写 BOM，Excel 打开中文乱码** → 现象：中文全是"锟斤拷"或"��" → 原因：`File.WriteAllText(path, text)` 默认 UTF-8 无 BOM，Excel 按 ANSI 解读 → 解决：`File.WriteAllText(path, text, new UTF8Encoding(true))`（示例正是这样），这是 CSV 导出第一坑
>
> 坑 2：**字段含逗号/引号没转义** → 现象：Excel 打开数据错列、引号乱套 → 原因：设备名或备注里有逗号（如"电机,1号"），被当成分隔符 → 解决：实现 `EscapeCsvField`——含逗号/引号/换行时用引号包裹、内部引号翻倍
>
> 坑 3：**全部数据拼进一个 `StringBuilder`** → 现象：导出 50 万条时内存飙到几百 MB、卡死 → 原因：字符串拼接 + 内存存全量 → 解决：用 `StreamWriter(path, false, encoding)` 逐行 `WriteLine`，边写边落盘
>
> 坑 4：**长数字被 Excel 显示成科学计数法** → 现象：设备号 `622100123456` 变成 `6.22E+11`，尾数变 000 → 原因：Excel 对长数字默认数值格式 → 解决：给长数字字段前后加引号（`"622100123456"`），Excel 会按文本处理

> [!best] 最佳实践
> - **统一封装 `CsvExporter`**：`Export<T>(IEnumerable<T> rows, string path, string[] headers)`，内置 BOM、转义、流式写入，全项目复用
> - **转义函数写进工具类**：`EscapeCsvField(string)` 三规则（逗号/引号/换行）一处实现，避免每个导出点各写一遍
> - **文件名带时间戳**：`数据导出_{yyyyMMdd_HHmmss}.csv` 防覆盖（示例已用），配合归档习惯
> - **大数据量一律 `StreamWriter`**：1 万条以下用 `StringBuilder` 无所谓，以上用流式，养成习惯不踩内存坑
> - **导出前先 `count == 0` 校验**：空数据弹提示而不是导出一个只有表头的空文件（示例 `if (_data.Count == 0) return;`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例导出 CSV，分别用记事本和 Excel 打开，确认中文不乱码；把 `new UTF8Encoding(true)` 改成 `Encoding.UTF8` 再导出，观察 Excel 里中文的变化——亲手验证 BOM 的作用
> **Lv.2 加属性**：给数据加"备注"列（内容故意含逗号，如 `"正常,待观察"`），先不转义导出看 Excel 错列，再写 `EscapeCsvField` 修复——把转义坑踩一遍
> **Lv.3 改造**：数据源换成 `轻量级数据库-sqlite`：从 `DeviceData` 查询全部记录，用 `StreamWriter` 流式导出 1 万行（生成 1 万条测试数据），观察导出速度与内存占用
> **Lv.4 挑战**：实现"增量导出"：导出时对比上次导出的最后一条时间戳，只导出新增数据（用 `存储策略与数据保留` 的归档思路），并给文件加"时间范围"前缀（`2026-08-01_2026-08-07.csv`）

> [!related] 相关知识链接
> - ← 前置知识：`本地文件存储jsonxmlcsv二进制`（CSV 属于文本文件存储）、`存储策略与数据保留`（归档导出需求来源）
> - → 输出对比：`导出-excelepplusclosedxml`（要样式用 Excel）、`导出-pdf`（要正式版式用 PDF）
> - ⇄ 关联概念：`报表生成`（CSV 是报表的一种输出形式）、`数据校验crc校验和等`（导出文件可加校验和）
> - 📖 官方文档：[RFC 4180（CSV 规范）](https://www.rfc-editor.org/rfc/rfc4180)、[UTF8Encoding 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.text.utf8encoding)、[CsvHelper 文档](https://joshclose.github.io/CsvHelper/)
