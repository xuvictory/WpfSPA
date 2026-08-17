---
title: 数据类 NuGet 包
section: 16-resources
parent: 16.6 常用 NuGet 包清单
---

# 数据类 NuGet 包

> [!plain] 白话理解
> 上位机不只是"画界面 + 读 PLC"，还要把数据**存起来、传出去、导出来**：报警记录存本地、配置存 JSON、产量导出 Excel。**数据类 NuGet 包**就是干这些事的现成工具：存取数据库、序列化 JSON、读写 Excel，每个都装好即用，不用自己造轮子。

> [!def] 官方定义
> **数据类 NuGet 包**是 .NET 生态中处理**数据存取、序列化、文件交换**的第三方/官方库集合（可统一从 NuGet 官网 https://www.nuget.org/ 检索与安装）。常用清单：
> - **Dapper**（NuGet：`Dapper`）：轻量 ORM，`IDbConnection` 扩展方法直连 SQL 查询（见 `dapper` 篇）
> - **Microsoft.Data.Sqlite**（微软官方，NuGet：`Microsoft.Data.Sqlite`）：SQLite 的 ADO.NET 提供程序，单文件免部署本地库
> - **System.Text.Json**（微软官方内置）：高性能 JSON 序列化，配置/点位/上报数据结构化
> - **Newtonsoft.Json**（NuGet：`Newtonsoft.Json`）：老牌 JSON 库，兼容性与配置项更丰富
> - **NPOI**（NuGet：`NPOI`）：免 Office 的 Excel 读写库，用于报表导出
> - **Entity Framework Core**（微软官方，NuGet：`Microsoft.EntityFrameworkCore.Sqlite` 等）：完整 ORM，适合复杂领域模型
>
> 其中微软官方库（Microsoft.Data.Sqlite、System.Text.Json、EF Core）以官方文档为准（https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/ 、https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json/overview ），第三方库（Dapper、Newtonsoft.Json、NPOI）以各自官网为准。

> [!origin] 由来背景
> 数据访问是每个工程软件都绕不开的"公共基础设施"。早期 .NET 开发者靠 ADO.NET 手写连接与命令，代码冗长。2010 年代后社区与微软陆续推出"开箱即用"的数据包：**Dapper**（2011 年，Stack Overflow 团队）解决查询映射繁琐；**Microsoft.Data.Sqlite**（2018 年前后随 .NET Core 发布）解决跨平台轻量本地库；**System.Text.Json**（2019 年 .NET Core 3.0）以高性能序列化取代部分 Newtonsoft 场景。上位机行业顺势形成"**SQLite 存历史 + JSON 存配置 + Excel 出报表**"的标准数据组合。

> [!essentials] 核心要点
> - **历史数据**：`Microsoft.Data.Sqlite` + `Dapper`，单文件数据库，断电安全、免部署
> - **配置管理**：`System.Text.Json` 序列化/反序列化配置文件（如 `deviceConfig.json`），支持中文友好格式化
> - **报表导出**：`NPOI` 生成 `.xlsx`，无需安装 Office，代码可控样式
> - **数据上报**：`System.Text.Json` 序列化 + `mqttnet`/HTTP 发送，结构字段稳定
> - **复杂模型**：需要实体关系、自动迁移时选 EF Core（`Microsoft.EntityFrameworkCore.Sqlite`）
> - **选型原则**：能内置解决的不引第三方（如 JSON 优先 System.Text.Json），保持依赖精简

> [!example] 完整示例
> **数据访问类库：Dapper + SQLite 查询历史报警记录演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="数据访问演示" Height="440" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Dapper + SQLite 历史数据查询" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Button Content="初始化数据库并查询" Click="OnQueryClick" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <DataGrid x:Name="Grid" Height="240" AutoGenerateColumns="True"
>                   Background="#161B22" Foreground="#8B949E" BorderBrush="#21262D"
>                   RowBackground="#161B22" AlternatingRowBackground="#0D1117"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Linq;
> using System.Windows;
> using Dapper;
> using Microsoft.Data.Sqlite;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 Dapper 与 Microsoft.Data.Sqlite 包
>         private const string DbPath = "hmi_data.db";
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnQueryClick(object sender, RoutedEventArgs e)
>         {
>             using var conn = new SqliteConnection($"Data Source={DbPath}");
>             conn.Open();
>
>             // 建表并插入两条模拟报警记录
>             conn.Execute(
>                 "CREATE TABLE IF NOT EXISTS Alarms(Id INTEGER PRIMARY KEY, Time TEXT, Message TEXT)");
>             conn.Execute(
>                 "INSERT INTO Alarms(Time, Message) VALUES('2026-08-17 09:10:12', '1 号泵过流报警'), " +
>                 "('2026-08-17 09:11:05', '空压机压力低')");
>
>             // Dapper 把查询结果直接映射为对象集合，绑定到表格
>             Grid.ItemsSource = conn.Query(
>                 "SELECT Id, Time, Message FROM Alarms ORDER BY Id DESC").ToList();
>             StatusText.Text = "查询完成，共 " + Grid.Items.Count + " 条记录";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 报警/产量/历史数据本地存储（SQLite）
> ✅ 设备配置、点位表、配方参数用 JSON 管理
> ✅ 报表/台账导出 Excel（NPOI）
> ✅ 需要结构化数据上报云端（JSON + MQTT/HTTP）
> ❌ 超大规模并发数据库（选专业数据库服务器，SQLite 单机够用）
> ❌ 仅内存使用无需持久化的场景（直接用集合/缓存即可）

> [!pitfall] 常见踩坑
> 坑 1：**SQLite 文件被占用写不进去** → 现象：程序崩溃或重启后 `database is locked` → 原因：多个连接同时写/长事务未释放 → 解决：连接即用即开（`using`），写操作短事务；串行化访问本地库
>
> 坑 2：**JSON 字段改名导致旧配置读不出** → 现象：升级后 `JsonSerializer.Deserialize` 返回默认值 → 原因：配置类属性改名与旧文件不一致 → 解决：用 `[JsonPropertyName]` 保持稳定字段名，或提供默认值/迁移逻辑
>
> 坑 3：**NPOI 导出一堆空样式** → 现象：Excel 生成慢、文件大 → 原因：逐单元格 set 样式重复创建 → 解决：复用 `CellStyle` 对象（一个样式对象多处赋值），避免循环内 new

> [!best] 最佳实践
> - 数据访问集中到仓储层（Repository），SQL/序列化不散落界面代码
> - SQLite 连接即用即开，事务短小；历史表按时间建索引
> - JSON 配置字段名保持稳定，兼容旧版本升级
> - 报表导出统一工具类封装（表头样式、单元格格式一次配好）
> - 与 `serilog` 配合记录数据层异常（SQL 报错、JSON 解析失败），现场好排查

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，给 Alarms 表加一个 Level 列并查询显示
> **Lv.2 小试牛刀**：用 `System.Text.Json` 把设备配置保存/读取为 JSON 文件
> **Lv.3 融会贯通**：把历史报警导出成 Excel（NPOI），导出后可正常打开
> **Lv.4 拆层挑战**：搭建 `AlarmRepository`（Dapper 查询 + SQLite 存储 + NPOI 导出），接入 `serilog` 并写单元测试

> [!related] 相关知识链接
> - ← 前置知识：[`dapper`](dapper)（轻量 ORM）、第 12 章（架构分层）
> - → 后续必学：[`日志与工具类-nuget-包`](日志与工具类-nuget-包)（配套工具）
> - ⇄ 关联概念：[`ui-类-nuget-包`](ui-类-nuget-包)、[`mvvm-与通信类-nuget-包`](mvvm-与通信类-nuget-包)
> - 📖 官方文档：SQLite https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/ ；JSON https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json/overview
