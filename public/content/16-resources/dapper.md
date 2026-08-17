---
title: Dapper
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# Dapper

> [!plain] 白话理解
> 上位机软件一般要存"历史报警、产量统计、设备台账"这类数据，用 Excel 文件管理很快就乱。**Dapper** 是 .NET 里最轻量的"数据库帮手"：你写一行 SQL，它帮你把结果变成 C# 对象，几行代码就能完成增删改查。相比 EF Core 这种"全家桶"ORM，Dapper 不替你管实体关系，**SQL 写什么就执行什么**，上手快、性能好，特别适合"SQL 熟练 + 想要轻量"的上位机团队。

> [!def] 官方定义
> **Dapper** 是一个**社区开源**的轻量级 ORM（对象关系映射）库（GitHub：https://github.com/DapperLib/Dapper ，NuGet：`Dapper`），由 Stack Overflow 团队成员 Sam Saffron 与 Marc Gravell 于 2011 年开源，本质是一组 `IDbConnection` 的**扩展方法**（`Query<T>`、`Execute`、`QueryFirst<T>` 等）。它**不是微软官方库**，与微软官方的 Entity Framework Core（https://learn.microsoft.com/zh-cn/ef/core/ ）相比：Dapper 不做实体追踪与自动建库，强调"贴近 SQL、无黑盒、性能高"；EF Core 提供完整的数据层抽象。两者都可配合微软官方 ADO.NET 提供程序（如 `Microsoft.Data.Sqlite`，https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/ ）使用。

> [!origin] 由来背景
> Dapper 诞生于 Stack Overflow 网站的运维实践：2008 年 Stack Overflow 上线后流量巨大，团队发现传统 ORM 的性能开销成为瓶颈，于是 **Sam Saffron** 写了这套"又快又薄"的数据访问库，让站内查询性能大幅提升。**2011 年**项目开源，很快成为 .NET 生态使用最广泛的轻量 ORM 之一（NuGet 下载量数十亿）。它的哲学是"SQL 就是最好的 DSL"——开发者的 SQL 功底越扎实，用 Dapper 越顺手。上位机项目常用它 + SQLite 存报警记录、工艺参数、产量统计等本地数据。

> [!essentials] 核心要点
> - **查询映射**：`conn.Query<T>("SELECT * FROM Devices WHERE Id = @Id", new { Id = 1 })` 返回 `IEnumerable<T>`
> - **执行**：`conn.Execute("INSERT INTO Devices(Name) VALUES(@Name)", new { Name = "1 号泵" })`
> - **参数化**：用 `@Param` 占位符 + 匿名对象传参，天然防 SQL 注入
> - **动态对象**：`Query("SELECT ...")` 不指定泛型时返回 `dynamic`，适合快速取数绑定 DataGrid
> - **批量**：`Execute` 支持传入对象集合，一条语句批量插入
> - **事务**：`conn.Open()` 后 `using var tx = conn.BeginTransaction()`，配合 `TransactionScope` 保证一致性

> [!example] 完整示例
> **Dapper 轻量 ORM：SQLite 设备列表查询演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Dapper 演示" Height="420" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Dapper 轻量 ORM 查询" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Button Content="加载设备列表" Click="OnLoadClick" Margin="0,0,0,8" Padding="8"
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
>         public MainWindow() => InitializeComponent();
>
>         private void OnLoadClick(object sender, RoutedEventArgs e)
>         {
>             using var conn = new SqliteConnection("Data Source=hmi_devices.db");
>             conn.Open();
>             conn.Execute(
>                 "CREATE TABLE IF NOT EXISTS Devices(Id INTEGER PRIMARY KEY, Name TEXT, Running INTEGER)");
>             conn.Execute(
>                 "INSERT OR IGNORE INTO Devices(Id, Name, Running) VALUES(1, '1 号泵', 1), " +
>                 "(2, '2 号泵', 0), (3, '空压机', 1)");
>
>             // Dapper 把 SELECT 结果映射为动态对象列表，直接绑定到 DataGrid
>             var devices = conn.Query(
>                 "SELECT Id, Name, CASE Running WHEN 1 THEN '运行' ELSE '停止' END AS State " +
>                 "FROM Devices ORDER BY Id").ToList();
>
>             Grid.ItemsSource = devices;
>             StatusText.Text = "已加载 " + devices.Count + " 台设备";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 上位机本地存储：报警记录、产量统计、工艺参数（SQLite）
> ✅ 团队 SQL 熟练、想要完全掌控查询语句的项目
> ✅ 查询性能敏感、数据量较大的历史数据检索
> ✅ 与 EF Core 混用：简单查询用 Dapper，复杂领域模型用 EF
> ❌ 需要自动建库、实体迁移、复杂关系跟踪的项目（EF Core 更省事）
> ❌ 完全不想写 SQL 的低代码团队

> [!pitfall] 常见踩坑
> 坑 1：**`@参数` 写错导致查询异常** → 现象：`no such column` 或参数不匹配 → 原因：SQL 占位符与匿名对象属性名不一致（如 SQL 写 `@Name`，对象写 `new { name = ... }`） → 解决：占位符名称与匿名对象属性名严格一致（大小写敏感看提供程序）
>
> 坑 2：**列名与属性名映射不上** → 现象：查询返回对象属性全为默认值 → 原因：SQL 列名 `Running` 与 C# 属性名不一致，或表名/列名带下划线 → 解决：SQL 中用 `AS` 起别名（如 `CASE Running WHEN 1 THEN '运行' END AS State`），或在实体上配置映射
>
> 坑 3：**忘记 `Open()` 就执行** → 现象：偶发 `InvalidOperationException: Connection must be valid and open` → 原因：Dapper 需要已打开的连接 → 解决：`using var conn = new SqliteConnection(...); conn.Open();` 后再调用扩展方法（每次打开开销小，不必长驻连接）

> [!best] 最佳实践
> - 查询一律参数化（`@Param` + 匿名对象），杜绝字符串拼接 SQL
> - 数据访问封装成 `Repository` 类，SQL 集中在仓储层，便于审查与复用
> - 实体类用简单 POCO，列名映射用 SQL 别名解决，避免过度配置
> - 历史数据表建好索引（按时间、设备号），配合 Dapper 查询才快
> - 上位机本地库优先 SQLite（`Microsoft.Data.Sqlite`），单文件、免部署、断电安全

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，给 Devices 表加一个 `Temperature` 列并查询显示
> **Lv.2 小试牛刀**：用 `Execute` 实现"新增一条设备记录"并刷新列表
> **Lv.3 融会贯通**：把设备报警记录到 SQLite（`INSERT`），再用 Dapper 按时间范围查询历史报警
> **Lv.4 拆层挑战**：搭建 `DeviceRepository`（增删改查 + 事务），接入 `serilog` 记录 SQL 慢查询，并写单元测试验证仓储方法

> [!related] 相关知识链接
> - ← 前置知识：第 12 章（架构分层）、`什么是-mvvm`（07）
> - → 后续必学：[`数据类-nuget-包`](数据类-nuget-包)（SQLite/JSON 等配套包）
> - ⇄ 关联概念：`serilog`（数据访问日志）、[`日志与工具类-nuget-包`](日志与工具类-nuget-包)
> - 📖 官方文档：https://github.com/DapperLib/Dapper ；SQLite 提供程序：https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/
