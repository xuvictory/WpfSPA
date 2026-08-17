---
title: 轻量级数据库 SQLite
section: 10-data-collection
parent: 10.3 数据存储
---

# 轻量级数据库 SQLite

> [!plain] 白话理解
> 把 SQLite 比作**一个能装下整座档案室的"魔法手提箱"**：不用专门租一栋档案楼（不用安装数据库服务器），不用请管理员（零配置），整个数据库就是**一个普通文件**——拷贝文件就等于备份整个数据库，删文件就等于清空数据库。
>
> 想想用文件存储的痛点：JSON/CSV 存数据，想查"昨天下午 3 点到 4 点所有设备的平均温度"得把整个文件读进内存自己算。而 SQLite 是**真数据库**，会 SQL：`SELECT 设备, AVG(温度) FROM 历史 WHERE 时间 BETWEEN … GROUP BY 设备` 一句话就查出来，还有索引加速、事务保证、崩溃恢复。
>
> 一句话：**SQLite = "单文件 + 真 SQL + 零维护"的嵌入式数据库，是单机上位机本地历史数据存储的默认选择**；数据量小用它，数据量大、多客户端并发再升级到服务型数据库。

> [!def] 官方定义
> - **SQLite**：由 D. Richard Hipp 于 2000 年发起并持续维护的**嵌入式关系型数据库**，无独立服务进程、零配置、单文件存储，全部代码编译进应用进程内，公共领域授权（Public Domain），全球部署量最大（每台手机都内置）。
> - **.NET 访问库**：官方推荐 `Microsoft.Data.Sqlite`（微软维护，基于 SQLite 原生库的 ADO.NET 实现，API 与 `System.Data.SqlClient` 风格一致：`SqliteConnection`/`SqliteCommand`/`SqliteDataReader`）。
> - 特性：支持标准 SQL、事务（ACID）、WAL 模式（Write-Ahead Logging，写不阻塞读）、并发模型为**单写多读**（同一时刻最多一个写者）。
> - 📖 官方文档：[SQLite 官方网站](https://www.sqlite.org/)、[Microsoft.Data.Sqlite](https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/)

> [!origin] 由来背景
> 2000 年，嵌入式设备（PDA、早期手机）需要一个"无服务器、能塞进几十 KB 内存"的数据库。工程师 D. Richard Hipp 在海军项目中被现有嵌入式数据库的许可限制困扰，干脆自己写了一个——设计目标是简单到极致：**一个 C 文件、一个数据库文件、零配置、公共领域**。SQLite 因此迅速渗透：iOS/Android 内置、Firefox 书签、民航黑匣子数据记录都用它。
>
> 对上位机而言，SQLite 解决了"本地历史数据"的尴尬：早期上位机要么用文本文件（查不了 SQL），要么装 SQL Server（太重、还要运维）。SQLite 恰好是中间答案——**要 SQL 能力、又要零维护、还要单机离线**。如今几乎成了工控单机上位机"本地历史库"的事实标准。

> [!essentials] 核心要点
> - **连接串就是文件路径**：`Data Source=hmi.db`，文件不存在时首次 `Open()` 自动创建；`Database=""` 表示内存库
> - **三个对象循环使用**：`SqliteConnection`（连接）→ `CreateCommand`（命令）→ `ExecuteNonQuery`/`ExecuteReader`（执行），全部 `using` 包裹确保释放
> - **参数化查询防注入**：`cmd.CommandText = "INSERT INTO T VALUES ($name, $temp)"` + `cmd.Parameters.AddWithValue("$name", v)`，绝不用字符串拼接
> - **写要开事务**：高频批量插入（每秒几千条）逐条提交会慢几十倍，`BEGIN TRANSACTION` 包住一批再 `COMMIT`（`SqliteTransaction`）
> - **WAL 模式改善并发**：`PRAGMA journal_mode=WAL;` 让读写互不阻塞，多线程场景推荐开启
> - **数据库就是文件**：备份 = 拷贝 `.db` 文件（WAL 模式下要把 `.db-wal` 一起处理或先 `PRAGMA wal_checkpoint`）

> [!example] 完整示例
> **SQLite 演示：单文件数据库建表、插入、查询、删除(无需安装数据库服务)：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SQLite 演示" Height="440" Width="500"
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
>             <Button x:Name="CreateBtn" Content="创建数据库并建表" Click="OnCreateClick" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="InsertBtn" Content="插入数据" Click="OnInsertClick" Padding="10,6"
>                     Background="#238636" Foreground="White" Margin="8,0,0,0"/>
>             <Button x:Name="QueryBtn" Content="查询" Click="OnQueryClick" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="8,0,0,0"/>
>             <Button x:Name="DeleteBtn" Content="删除最后一条" Click="OnDeleteClick" Padding="10,6"
>                     Background="#DA3633" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="StatusText" Grid.Row="1" Margin="5" Foreground="#58A6FF" Text="未创建数据库"/>
>
>         <ListBox x:Name="DataList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>
>         <TextBlock x:Name="DbPathText" Grid.Row="3" Margin="5" Foreground="#8B949E" Text="数据库文件：--"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package Microsoft.Data.Sqlite
> using System;
> using System.Windows;
> using Microsoft.Data.Sqlite;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private const string DbFile = "hmi.db";   // 数据库就是一个文件
>         private string _connStr = $"Data Source={DbFile}";
>
>         public MainWindow() => InitializeComponent();
>
>         // 建库建表：文件不存在时自动创建
>         private void OnCreateClick(object sender, RoutedEventArgs e)
>         {
>             using (var conn = new SqliteConnection(_connStr))
>             {
>                 conn.Open();
>                 using (var cmd = conn.CreateCommand())
>                 {
>                     cmd.CommandText = @"CREATE TABLE IF NOT EXISTS DeviceData (
>                                             Id INTEGER PRIMARY KEY AUTOINCREMENT,
>                                             DeviceName TEXT,
>                                             Temp REAL,
>                                             TimeStamp TEXT)";
>                     cmd.ExecuteNonQuery();
>                 }
>             }
>             DbPathText.Text = "数据库文件：" + AppDomain.CurrentDomain.BaseDirectory + DbFile;
>             StatusText.Text = "数据库与 DeviceData 表已就绪";
>         }
>
>         private void OnInsertClick(object sender, RoutedEventArgs e)
>         {
>             using (var conn = new SqliteConnection(_connStr))
>             {
>                 conn.Open();
>                 using (var cmd = conn.CreateCommand())
>                 {
>                     // 参数化写入，防注入且能复用
>                     cmd.CommandText = "INSERT INTO DeviceData (DeviceName, Temp, TimeStamp) " +
>                                       "VALUES ($name, $temp, $ts)";
>                     cmd.Parameters.AddWithValue("$name", "电机" + new Random().Next(1, 5));
>                     cmd.Parameters.AddWithValue("$temp", new Random().Next(30, 70));
>                     cmd.Parameters.AddWithValue("$ts", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
>                     cmd.ExecuteNonQuery();
>                 }
>             }
>             StatusText.Text = "已插入 1 条记录";
>             OnQueryClick(sender, e);   // 插入后自动刷新列表
>         }
>
>         private void OnQueryClick(object sender, RoutedEventArgs e)
>         {
>             DataList.Items.Clear();
>             using (var conn = new SqliteConnection(_connStr))
>             {
>                 conn.Open();
>                 using (var cmd = conn.CreateCommand())
>                 {
>                     cmd.CommandText = "SELECT Id, DeviceName, Temp, TimeStamp FROM DeviceData ORDER BY Id";
>                     using (var reader = cmd.ExecuteReader())
>                         while (reader.Read())
>                             DataList.Items.Add($"#{reader["Id"]}  {reader["DeviceName"]}" +
>                                                $"  温度 {reader["Temp"]}℃  {reader["TimeStamp"]}");
>                 }
>             }
>             StatusText.Text = $"共 {DataList.Items.Count} 条记录";
>         }
>
>         private void OnDeleteClick(object sender, RoutedEventArgs e)
>         {
>             using (var conn = new SqliteConnection(_connStr))
>             {
>                 conn.Open();
>                 using (var cmd = conn.CreateCommand())
>                 {
>                     // 删除最新一条(按 Id 最大)
>                     cmd.CommandText = "DELETE FROM DeviceData WHERE Id = (SELECT MAX(Id) FROM DeviceData)";
>                     cmd.ExecuteNonQuery();
>                 }
>             }
>             StatusText.Text = "已删除最后一条";
>             OnQueryClick(sender, e);
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **单机上位机本地历史库**：一台工控机采集、存储、查询本机数据，零维护成本
> ✅ **无 DBA、无网络的现场环境**：装不了 SQL Server 的车间，SQLite 开箱即用
> ✅ **报警/事件记录**：少量但需要 SQL 查询能力的数据，比文件存储优雅
> ✅ **断网缓存**：采集数据先落 SQLite，网络恢复再同步到服务器（本地缓存模式）
> ❌ **多客户端并发写**：SQLite 单写者模型，多台工控机同时写一个库会 `SQLITE_BUSY`
> ❌ **海量数据（百GB 级）复杂分析**：性能与运维能力都不如服务型数据库（见 `关系型数据库sql-servermysql`）

> [!pitfall] 常见踩坑
> 坑 1：**连接没释放导致"database is locked"** → 现象：偶发 `SQLITE_BUSY` 异常，程序时好时坏 → 原因：某处连接/命令没 `using` 释放，锁没解除 → 解决：所有 `SqliteConnection`/`SqliteCommand`/`SqliteDataReader` 一律 `using`；加 `DefaultTimeout=5` 防死锁
>
> 坑 2：**多线程同时写库** → 现象：频繁 `database is locked`，插入大量失败 → 原因：SQLite 同一时刻只允许一个写者 → 解决：所有写操作收敛到一个写入队列/单线程串行执行；开启 WAL（`PRAGMA journal_mode=WAL`）缓解读写竞争
>
> 坑 3：**逐条插入不提交事务** → 现象：插 1 万条数据要几分钟 → 原因：每条都隐含一次磁盘 fsync → 解决：`SqliteTransaction` 包住整批，1 万条可以秒级完成
>
> 坑 4：**数据库文件在写保护目录** → 现象：`unable to open database file` → 原因：程序装在 `Program Files` 等受保护目录 → 解决：数据库放到 `AppData` 或程序专用数据目录，用 `Environment.SpecialFolder.ApplicationData` 拼路径

> [!best] 最佳实践
> - **连接串常开 WAL + busy_timeout**：`Data Source=hmi.db;Mode=ReadWrite;` 首次连接后执行 `PRAGMA journal_mode=WAL;` 和 `PRAGMA busy_timeout=5000;`
> - **高频写统一走"写入服务"**：采集线程只把数据丢进队列，一个后台写线程串行批量提交（见 `采集线程模型设计`），天然规避锁问题
> - **表设计带索引**：按 `TimeStamp` 建索引（历史数据查询基本都按时间），`CREATE INDEX IF NOT EXISTS idx_ts ON DeviceData(TimeStamp)`
> - **定期备份与 VACUUM**：文件库删除数据后文件不会自动变小，定期 `VACUUM` 回收空间；备份直接拷文件（先 `PRAGMA wal_checkpoint(TRUNCATE)`）
> - **数据模型与采集流水线对齐**：存储的字段就是 `采集系统总体设计` 里统一点位模型（设备+点位+值+时间戳）的落库版

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例建库、插入、查询、删除走一遍，然后用资源管理器找到 `hmi.db` 文件——确认整个数据库真的就是一个文件
> **Lv.2 加属性**：加一个"批量插入 1000 条"按钮：对比"不用事务逐条插入"与"事务包裹后插入"的耗时差异（秒级 vs 毫秒级）
> **Lv.3 改造**：写一个 `HistoryDb` 服务类：`Init()`（建表+索引+WAL）、`BatchInsert(List<PointData>)`（事务批量）、`Query(DateTime from, DateTime to)`，把 `采集系统总体设计` 的模拟采集数据接进来落库
> **Lv.4 挑战**：结合 `存储策略与数据保留`：在 SQLite 上实现"按时间保留策略"——`DELETE FROM DeviceData WHERE TimeStamp < datetime('now', '-7 day')` 每周清理，再做一个"启动时自动清理旧数据"的定时任务

> [!related] 相关知识链接
> - ← 前置知识：`本地文件存储jsonxmlcsv二进制`（为什么需要从文件升级到数据库）、`数据校验crc校验和等`（落库数据完整性）
> - → 后续必学：`关系型数据库sql-servermysql`（多客户端共享时升级为服务型数据库）、`时序数据库简介`（海量高频数据选型）
> - ⇄ 关联概念：`存储策略与数据保留`（库内数据怎么滚动清理）、`实时曲线oxyplot`（从历史库查数据画曲线）
> - 📖 官方文档：[SQLite 官方网站](https://www.sqlite.org/)、[Microsoft.Data.Sqlite](https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite/)、[SQLite WAL 模式](https://www.sqlite.org/wal.html)
