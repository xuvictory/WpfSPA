---
title: 本地文件存储（JSON、XML、CSV、二进制）
section: 10-data-collection
parent: 10.3 数据存储
---

# 本地文件存储（JSON、XML、CSV、二进制）

> [!plain] 白话理解
> 把数据落盘比作**收拾家里的物品**，四种格式就是四种收纳盒：
> - **JSON**：像**贴了标签的整理箱**——"设备名、温度、状态"一目了然，人看得懂、程序也好取用。适合配置文件和跨系统交换数据。
> - **XML**：像**带目录树的大档案柜**——层级关系严谨（`<设备><名称>…</名称></设备>`），老系统、OPC 配置、组态软件都喜欢用它，但写着啰嗦。
> - **CSV**：像**一行一行的记账本**——每行一条记录、逗号分列，Excel 直接打开就能看，适合表格型数据导出。
> - **二进制**：像**密封的冷冻箱**——体积小、存取最快，但人眼看不见里面是什么，只有程序知道"先读 4 字节长度、再读字符串"的规矩。
>
> 一句话：**没有"最好"的格式，只有"最合适"的场景——配置用 JSON、对接老系统用 XML、给人看用 CSV、高频海量数据用二进制**。

> [!def] 官方定义
> - **JSON（JavaScript Object Notation）**：轻量级数据交换格式，键值对结构。.NET 官方 API 为 `System.Text.Json`（`JsonSerializer.Serialize/Deserialize`），.NET Core 3.0+ 内置，性能优于旧版 `Newtonsoft.Json`。
> - **XML（Extensible Markup Language）**：可扩展标记语言，W3C 标准，树形层级结构。.NET API 为 `System.Xml.Linq`（`XDocument`/`XElement`）。
> - **CSV（Comma-Separated Values）**：逗号分隔的纯文本表格格式，无官方 .NET 内置库，需自行处理转义（或用开源库 `CsvHelper`）。
> - **二进制**：按字节序列存储，.NET API 为 `System.IO.BinaryWriter`/`BinaryReader`（配合 `FileStream`）。
> - 📖 官方文档：[System.Text.Json](https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json/overview)、[System.Xml.Linq](https://learn.microsoft.com/zh-cn/dotnet/api/system.xml.linq.xdocument)、[BinaryWriter 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.binarywriter)

> [!origin] 由来背景
> 文件存储的历史就是数据格式之争：**CSV** 源于 1970 年代早期数据库导出与表格软件（如 Lotus 1-2-3），简单到极致的纯文本表格。**XML** 由 W3C 于 1998 年定稿，为的是解决"数据带结构、跨系统交换"的问题，成为 SOA、配置文件、OPC UA 初期标准的宠儿，但冗长笨重。**JSON** 脱胎于 JavaScript 对象字面量，2006 年由 Douglas Crockford 推广为 RFC 4627 标准，以"少一半的字符、同样的信息量"迅速取代 XML 成为 Web 与物联网的默认格式。**二进制**则从未"流行"过——它一直默默存在于性能敏感的角落（高频采集、固件、图像）。上位机领域这四种格式各有阵营：组态软件配置爱用 XML，现代上位机配置爱用 JSON，报表导出爱用 CSV，实时采样落盘爱用二进制。

> [!essentials] 核心要点
> - **JSON 最常用于配置与交换**：`JsonSerializer.Serialize(obj, new JsonSerializerOptions { WriteIndented = true })` 输出可读的缩进格式，`Deserialize<T>` 读回
> - **XML 用 LINQ to XML**：`XDocument`/`XElement` 链式构造树，`XAttribute` 存属性，序列化 `.Save(path)`、加载 `XDocument.Load(path)`
> - **CSV 的坑在转义**：字段含逗号、引号、换行时必须加引号包裹并转义双引号，否则 Excel 打开错列（详见 `导出-csv`）
> - **二进制要"自描述"**：写入时先写版本号、魔数、每条记录长度前缀，读时按同样顺序读——顺序错一位，数据全乱
> - **路径不要裸写相对路径**：用 `AppDomain.CurrentDomain.BaseDirectory` + `System.IO.Path.Combine` 拼绝对路径
> - **写文件要防"写一半断电"**：先写临时文件再 `File.Replace` 原子替换，避免崩溃留下半个文件（见 `存储策略与数据保留`）

> [!example] 完整示例
> **本地文件存储演示：设备记录分别以 JSON / XML / CSV / 二进制四种格式落盘并回读：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="本地文件存储" Height="440" Width="560"
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
>             <Button x:Name="SaveJsonBtn" Content="保存 JSON" Click="OnSaveJson" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="SaveXmlBtn" Content="保存 XML" Click="OnSaveXml" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>             <Button x:Name="SaveCsvBtn" Content="保存 CSV" Click="OnSaveCsv" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>             <Button x:Name="SaveBinBtn" Content="保存二进制" Click="OnSaveBin" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>         </StackPanel>
>
>         <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="5">
>             <Button x:Name="LoadBtn" Content="加载全部文件" Click="OnLoadClick" Padding="10,6"
>                     Background="#238636" Foreground="White"/>
>             <TextBlock x:Name="PathText" VerticalAlignment="Center" Margin="10,0,0,0"
>                        Foreground="#8B949E" Text="保存目录：程序运行目录"/>
>         </StackPanel>
>
>         <ListBox x:Name="FileList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>
>         <TextBlock x:Name="StatText" Grid.Row="3" Margin="5" Foreground="#8B949E"
>                    Text="尚未保存任何数据"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.IO;
> using System.Linq;
> using System.Text.Json;
> using System.Windows;
> using System.Xml.Linq;
>
> namespace HmiDemo
> {
>     // 演示用设备记录模型
>     public class DeviceRecord
>     {
>         public string Name { get; set; }
>         public double Temp { get; set; }
>         public bool Running { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         private readonly List<DeviceRecord> _records = new List<DeviceRecord>
>         {
>             new DeviceRecord { Name = "水泵1", Temp = 45.6, Running = true },
>             new DeviceRecord { Name = "电机2", Temp = 62.1, Running = false },
>             new DeviceRecord { Name = "加热器3", Temp = 88.4, Running = true }
>         };
>
>         public MainWindow() => InitializeComponent();
>
>         // JSON：结构化、跨平台，适合配置与数据交换
>         private void OnSaveJson(object sender, RoutedEventArgs e)
>         {
>             File.WriteAllText("records.json",
>                 JsonSerializer.Serialize(_records, new JsonSerializerOptions { WriteIndented = true }));
>             FileList.Items.Insert(0, "已保存 records.json：");
>             FileList.Items.Add(File.ReadAllText("records.json"));
>         }
>
>         // XML：带层级结构，老系统与配置文件兼容性好
>         private void OnSaveXml(object sender, RoutedEventArgs e)
>         {
>             XDocument doc = new XDocument(new XElement("Records",
>                 _records.Select(r => new XElement("Device",
>                     new XAttribute("Name", r.Name),
>                     new XAttribute("Temp", r.Temp),
>                     new XAttribute("Running", r.Running)))));
>             doc.Save("records.xml");
>             FileList.Items.Insert(0, "已保存 records.xml：");
>             FileList.Items.Add(doc.ToString());
>         }
>
>         // CSV：表格型数据，可直接用 Excel 打开查看
>         private void OnSaveCsv(object sender, RoutedEventArgs e)
>         {
>             var lines = new List<string> { "Name,Temp,Running" };
>             lines.AddRange(_records.Select(r => $"{r.Name},{r.Temp},{r.Running}"));
>             File.WriteAllLines("records.csv", lines);
>             FileList.Items.Insert(0, "已保存 records.csv：");
>             FileList.Items.Add(string.Join(Environment.NewLine, lines));
>         }
>
>         // 二进制：体积小、读写快，适合高频采集数据的落盘
>         private void OnSaveBin(object sender, RoutedEventArgs e)
>         {
>             using (var fs = new FileStream("records.bin", FileMode.Create))
>             using (var bw = new BinaryWriter(fs))
>             {
>                 bw.Write(_records.Count);
>                 foreach (var r in _records)
>                 {
>                     bw.Write(r.Name);
>                     bw.Write(r.Temp);
>                     bw.Write(r.Running);
>                 }
>             }
>             FileList.Items.Insert(0, "已保存 records.bin（二进制，不可直接查看，读取速度快）");
>         }
>
>         // 加载：从二进制文件回读，验证数据完整性
>         private void OnLoadClick(object sender, RoutedEventArgs e)
>         {
>             if (!File.Exists("records.bin"))
>             {
>                 FileList.Items.Insert(0, "请先点击保存按钮再加载");
>                 return;
>             }
>             using (var fs = new FileStream("records.bin", FileMode.Open))
>             using (var br = new BinaryReader(fs))
>             {
>                 int count = br.ReadInt32();
>                 for (int i = 0; i < count; i++)
>                     FileList.Items.Insert(0,
>                         $"回读[{i}] {br.ReadString()} 温度={br.ReadDouble():F1} 运行={br.ReadBoolean()}");
>             }
>             StatText.Text = "已从二进制文件回读数据成功";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **JSON**：上位机配置文件（点位表、通信参数）、与 MES/Web 服务的数据交换
> ✅ **XML**：OPC 地址空间导出、组态工程文件、与老版工业软件交换配置
> ✅ **CSV**：导出"操作员能直接看"的报表数据、对接 ERP 数据导入
> ✅ **二进制**：高频采集数据的本地高速落盘（几十万点/秒时 JSON/XML 完全扛不住）
> ❌ **JSON/XML**：高频数据流（文本格式体积大、序列化慢），应交给二进制或时序库
> ❌ **二进制**：任何需要"人直接可读"的场景，没有文档则等于天书

> [!pitfall] 常见踩坑
> 坑 1：**相对路径 + 未判断目录存在** → 现象：文件不知道被写到了哪里，或 `DirectoryNotFoundException` → 原因：程序工作目录随启动方式变化（VS 里运行、双击 exe、计划任务启动都不一定相同）→ 解决：统一用 `Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data")` 并 `Directory.CreateDirectory` 兜底
>
> 坑 2：**CSV 字段含逗号/引号没转义** → 现象：Excel 打开数据错列、引号乱套 → 原因：CSV 规定含逗号、引号、换行的字段必须用双引号包裹且内部双引号翻倍 → 解决：用 `CsvHelper` 库，或写 `EscapeCsvField` 工具函数（详见 `导出-csv`）
>
> 坑 3：**二进制格式无版本控制** → 现象：程序升级后读老文件崩溃或数据错乱 → 原因：字段顺序/类型变了，老文件还是旧布局 → 解决：文件头写"魔数 + 版本号"（如 `"HMI1"` 4 字节），读到未知版本提示升级
>
> 坑 4：**直接覆盖写入，写一半断电** → 现象：文件损坏打不开，历史数据全丢 → 原因：`File.WriteAllText` 非原子操作 → 解决：先写 `.tmp` 再 `File.Replace(tmp, target, null)` 原子替换，配合 `数据校验crc校验和等` 做完整性校验

> [!best] 最佳实践
> - **小配置用 JSON，大历史用二进制/SQLite**：别让配置文件 JSON 去扛高频数据，选型看数据量级（见 `轻量级数据库-sqlite`）
> - **统一文件访问入口**：封装 `StorageService`（`SaveJson<T>`/`LoadJson<T>`/`SaveBinary<T>`），所有读写走它，日志与异常处理集中管理
> - **写文件先写临时文件再替换**：原子性换防崩溃损坏，成本极低、收益极大
> - **模型加版本号字段**：`public int Version { get; set; } = 1;`，升级时按版本迁移
> - **文件命名带时间戳**：历史数据按 `data_2026-08-17_08.json` 滚动，避免单文件无限增长（见 `存储策略与数据保留`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例分别点四个保存按钮，再用记事本打开四个文件对比它们的"长相"——直观感受四种格式的差异
> **Lv.2 加属性**：给 `DeviceRecord` 加一个 `DateTime UpdateTime` 字段，重跑保存，观察 JSON/XML/CSV/二进制四种格式对同一字段的表达差异
> **Lv.3 改造**：实现"配置持久化"：定义 `AppConfig`（采集周期、串口号、报警阈值），启动时 `LoadConfig()`、关闭时 `SaveConfig()`，用 JSON 落盘——这就是上位机的标准配置管理
> **Lv.4 挑战**：给二进制文件加"魔数+版本号"头（如先写 `"HMI"` 3 字节 + `ushort Version`），写入时同时计算 CRC32 存文件尾（见 `数据校验crc校验和等`），读取时校验版本与完整性——交付一个可放心用于生产的存储格式

> [!related] 相关知识链接
> - ← 前置知识：`数据转换与工程值计算`（落盘的是换算后的工程值）、`数据校验crc校验和等`（文件完整性校验）
> - → 后续必学：`轻量级数据库-sqlite`（数据多了从文件升级到数据库）、`存储策略与数据保留`（文件怎么滚动与淘汰）
> - ⇄ 关联概念：`导出-csv`（CSV 的进阶应用）、`报表生成`（从存储的数据出报表）
> - 📖 官方文档：[System.Text.Json 概述](https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json/overview)、[XDocument 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.xml.linq.xdocument)、[BinaryWriter 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.binarywriter)
