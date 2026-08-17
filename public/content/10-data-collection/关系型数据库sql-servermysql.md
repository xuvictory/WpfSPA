---
title: 关系型数据库（SQL Server、MySQL）
section: 10-data-collection
parent: 10.3 数据存储
---

# 关系型数据库（SQL Server、MySQL）

> [!plain] 白话理解
> 把关系型数据库比作**厂区的数据中心机房**：SQLite 是你办公桌上一个自带档案的"手提箱"（单机自用），而 SQL Server / MySQL 是**一栋有专职管理员、全天供电、多部门共享的机房**——它不是程序的一部分，而是**独立的服务进程**，你的上位机通过**网络**连过去存取数据。
>
> 为什么"机房"比"手提箱"强？因为**共享与容量**：三台工控机的采集数据、MES 的工单数据、质检的数据全部进同一个库，用 SQL 的 `JOIN` 能把它们关联起来查；数据量到百 GB 它也扛得住，还有权限管理、备份恢复、集群容灾。代价是：**要装服务、要配账号、要运维**。
>
> 一句话：**SQLite 是"单机零维护"，关系型数据库是"企业级共享平台"——上位机数据要进企业 IT 系统（MES/报表中心）时，必须走这一步**。

> [!def] 官方定义
> - **关系型数据库（RDBMS）**：基于关系模型（1970 年 Edgar F. Codd 提出）的数据库管理系统，数据按"表（行×列）"组织，用**结构化查询语言 SQL** 操作，保证 **ACID**（原子性、一致性、隔离性、持久性）事务特性。
> - **SQL Server**：微软商业数据库，.NET 访问库 `Microsoft.Data.SqlClient`（`SqlConnection`/`SqlCommand`/`SqlDataReader`）。
> - **MySQL**：开源数据库（GPL/商业双许可），.NET 访问库 `MySql.Data`（Oracle 官方）或 `MySqlConnector`，API 与 ADO.NET 完全一致。
> - **ADO.NET 模型**：连接串 `Server=…;Database=…;User Id=…;Password=…` → `Open()` → `Command` → `ExecuteNonQuery`/`ExecuteReader`/`ExecuteScalar`。
> - 📖 官方文档：[Microsoft.Data.SqlClient](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.data.sqlclient)、[MySQL Connector/NET](https://dev.mysql.com/doc/connector-net/en/)

> [!origin] 由来背景
> 1970 年，IBM 研究员 Edgar F. Codd 发表关系模型论文，开创了"数据用二维表组织、用集合运算操作"的现代数据库理论；1974 年 IBM 实验室开发出 SQL 语言。1980 年代起商业化浪潮：Oracle（1979）、**SQL Server（1989，微软与 Sybase 合作开发）**、**MySQL（1995，Michael Widenius 创建，后被 Oracle 收购）**。
>
> 工业上位机早期多"自建文件数据"（见 `本地文件存储jsonxmlcsv二进制`），但随着产线信息化——MES 要实时订单，报表中心要汇总产量，多台工控机要共享配方——数据必须进入企业级数据库。SQL Server 因为与 Windows/.NET 同生态，成为**国内 WPF 上位机对接 MES 的首选**；MySQL 则靠开源免费在预算有限的项目中流行。两者共享 SQL 标准，上位机代码几乎可以无缝迁移。

> [!essentials] 核心要点
> - **连接串是第一步**：`Server=localhost;Database=HmiDb;User Id=sa;Password=…;TrustServerCertificate=True;`（SQL Server 默认 `sa` 账号），MySQL 为 `Server=…;Database=…;User=root;Password=…`
> - **连接生命周期管理**：连接很贵，用 `using` 及时释放回连接池；连接池默认开启，频繁开关也快，但**不释放**会池耗尽
> - **参数化查询是底线**：`cmd.Parameters.AddWithValue("@n", name)`——字符串拼接 SQL 等于把数据库交给注入攻击
> - **事务保证批量原子性**：多表同时更新必须 `SqlTransaction`（`BeginTransaction` → 提交/回滚），否则写一半失败数据就乱了
> - **查询性能靠索引**：`TimeStamp`、`DeviceId` 这类查询条件列建索引；大数据量别 `SELECT *` 全表扫
> - **与 SQLite 的差异**：独立服务进程 + 网络访问 + 多客户端并发 + 权限管理——能力更强，运维成本也更高

> [!example] 完整示例
> **关系型数据库演示：SQL Server 连接、建表、参数化插入、查询(MySQL 用法一致)：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SQL Server 演示" Height="460" Width="580"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Margin="5">
>             <TextBlock Text="连接字符串:" Foreground="#8B949E"/>
>             <TextBox x:Name="ConnBox" Height="26" Margin="0,4,0,0" Background="#0D1117"
>                      Foreground="#8B949E" BorderBrush="#21262D"
>                      Text="Server=localhost;Database=HmiDb;User Id=sa;Password=123456;TrustServerCertificate=True;"/>
>         </StackPanel>
>
>         <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="5">
>             <Button x:Name="ConnectBtn" Content="连接并建表" Click="OnConnectClick" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="InsertBtn" Content="插入一条数据" Click="OnInsertClick" Padding="10,6"
>                     Background="#238636" Foreground="White" Margin="8,0,0,0"/>
>             <Button x:Name="QueryBtn" Content="查询全部" Click="OnQueryClick" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="StatusText" Grid.Row="2" Margin="5" Foreground="#58A6FF" Text="未连接数据库"/>
>
>         <ListBox x:Name="DataList" Grid.Row="3" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> // NuGet 依赖：Install-Package Microsoft.Data.SqlClient
> // MySQL 换用 MySql.Data 包，连接串形如 Server=localhost;Database=HmiDb;User=root;Password=123456;
> using System;
> using System.Windows;
> using Microsoft.Data.SqlClient;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private string _conn;
>
>         public MainWindow() => InitializeComponent();
>
>         // 连接数据库并创建设备采集记录表
>         private void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             _conn = ConnBox.Text.Trim();
>             try
>             {
>                 using (var conn = new SqlConnection(_conn))
>                 {
>                     conn.Open();
>                     using (var cmd = new SqlCommand(
>                         @"IF OBJECT_ID('DeviceData') IS NULL
>                           CREATE TABLE DeviceData (
>                               Id INT IDENTITY PRIMARY KEY,
>                               DeviceName NVARCHAR(50),
>                               Temp FLOAT,
>                               TimeStamp DATETIME)",
>                         conn))
>                     {
>                         cmd.ExecuteNonQuery();
>                     }
>                 }
>                 StatusText.Text = "连接成功，DeviceData 表已就绪";
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>             }
>         }
>
>         // 插入：必须用参数化查询，防止 SQL 注入
>         private void OnInsertClick(object sender, RoutedEventArgs e)
>         {
>             if (_conn == null) { StatusText.Text = "请先连接数据库"; return; }
>             using (var conn = new SqlConnection(_conn))
>             {
>                 conn.Open();
>                 using (var cmd = new SqlCommand(
>                     "INSERT INTO DeviceData (DeviceName, Temp, TimeStamp) VALUES (@n, @t, @ts)", conn))
>                 {
>                     cmd.Parameters.AddWithValue("@n", "水泵1");
>                     cmd.Parameters.AddWithValue("@t", new Random().Next(30, 60));
>                     cmd.Parameters.AddWithValue("@ts", DateTime.Now);
>                     cmd.ExecuteNonQuery();
>                 }
>             }
>             StatusText.Text = "已插入 1 条记录";
>         }
>
>         // 查询：读取结果集并展示
>         private void OnQueryClick(object sender, RoutedEventArgs e)
>         {
>             if (_conn == null) { StatusText.Text = "请先连接数据库"; return; }
>             DataList.Items.Clear();
>             using (var conn = new SqlConnection(_conn))
>             {
>                 conn.Open();
>                 using (var cmd = new SqlCommand(
>                     "SELECT Id, DeviceName, Temp, TimeStamp FROM DeviceData", conn))
>                 using (var reader = cmd.ExecuteReader())
>                 {
>                     while (reader.Read())
>                         DataList.Items.Add($"#{reader["Id"]}  {reader["DeviceName"]}" +
>                                            $"  温度 {reader["Temp"]}℃  {reader["TimeStamp"]}");
>                 }
>             }
>             StatusText.Text = "查询完成";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **多客户端共享数据**：多台工控机、MES、报表系统同时读写同一份数据
> ✅ **产线信息化/数据上报**：上位机采集数据定期上报企业数据库，供 MES/ERP 使用
> ✅ **数据量大 + 需要复杂查询**：跨表 `JOIN`、聚合统计、权限隔离，服务型数据库的强项
> ✅ **企业 IT 已有数据库环境**：公司统一部署 SQL Server/MySQL，上位机直接接入
> ❌ **单机离线项目**：一台工控机自用，装服务型数据库纯属增加运维负担，SQLite 足够
> ❌ **现场无网络/无 DBA**：部署与排障成本高，不适合现场无人值守的工控环境

> [!pitfall] 常见踩坑
> 坑 1：**连接不上：防火墙/实例名/加密协议** → 现象：`无法连接到服务器`、超时 → 原因：SQL Server 默认 1433 端口被防火墙拦、`localhost` 与命名实例不匹配、新版强制加密 → 解决：确认连接串 `Server=localhost,1433`（或实例名）、`TrustServerCertificate=True`、检查防火墙 1433/3306 端口
>
> 坑 2：**SQL 注入（字符串拼接）** → 现象：数据被删、被改、被拖库 → 原因：用户输入直接拼进 SQL → 解决：一律参数化查询（示例代码 `@n`/`@t`），这是写入规范级的红线
>
> 坑 3：**连接不释放，连接池耗尽** → 现象：程序运行一会儿后所有数据库操作全部超时 → 原因：`SqlConnection` 未 `using`/`Dispose`，池默认 100 个连接被占光 → 解决：所有连接用 `using`，出错也自动释放
>
> 坑 4：**无索引的全表扫描** → 现象：数据 100 万条后，按时间查询从毫秒级退化成十几秒 → 原因：`WHERE TimeStamp BETWEEN …` 没有索引 → 解决：建 `CREATE INDEX idx_ts ON DeviceData(TimeStamp)`；查询只取需要的列

> [!best] 最佳实践
> - **连接串放配置文件**：服务器地址、账号密码不进代码，用 `App.config`/`appsettings.json` 管理，现场改配置即可
> - **高频批量插入用 `SqlBulkCopy`**：一次灌几万条比逐条 `INSERT` 快一个数量级；采集落库建议批量而非逐条
> - **数据库操作集中在 Repository 层**：`IDeviceDataRepository.InsertBatch(...)`，UI 不直接碰 SQL，便于替换实现（SQLite↔SQL Server 切换只改一层）
> - **写操作加超时与重试**：网络数据库偶发波动，`CommandTimeout` + 重试 3 次的策略比裸奔健壮
> - **同步上报用"本地缓存 + 定时同步"**：上位机先写 SQLite，后台定时把增量同步到服务器（见 `存储策略与数据保留`），断网不断采

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例（需本地装有 SQL Server，或把连接串改成远程测试库），走通"连接→插入→查询"三步
> **Lv.2 加属性**：加一个"按时间范围查询"功能：界面输入起止时间，SQL 用 `WHERE TimeStamp BETWEEN @from AND @to` 查询，体会带索引的查询
> **Lv.3 改造**：把插入逻辑升级为"事务批量插入 100 条"（`BeginTransaction` + `Commit`），并加 `try/catch` 失败回滚；用 `SqlBulkCopy` 再插 1 万条对比性能
> **Lv.4 挑战**：实现"本地缓存 + 同步"架构：采集数据写 SQLite（`轻量级数据库-sqlite` 的实现），后台定时任务把未同步数据推送到 SQL Server，同步成功后删除本地记录——这就是真实 MES 上报系统的雏形

> [!related] 相关知识链接
> - ← 前置知识：`轻量级数据库-sqlite`（先学会 ADO.NET 与 SQL，再升级到服务型）、`本地文件存储jsonxmlcsv二进制`
> - → 后续必学：`时序数据库简介`（纯高频时序数据可进一步优化选型）
> - ⇄ 关联概念：`存储策略与数据保留`（服务器端也要保留策略）、`报表生成`（MES 报表直接从库取数）
> - 📖 官方文档：[Microsoft.Data.SqlClient](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.data.sqlclient)、[SQL Server 文档](https://learn.microsoft.com/zh-cn/sql/)、[MySQL 文档](https://dev.mysql.com/doc/)
