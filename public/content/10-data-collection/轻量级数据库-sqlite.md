---
title: 轻量级数据库 SQLite
section: 10-data-collection
parent: 10.3 数据存储
---

# 轻量级数据库 SQLite

> [!plain] 白话理解
> "轻量级数据库 SQLite"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"轻量级数据库 SQLite"是一个重要的知识点。数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 轻量级数据库 SQLite是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 轻量级数据库 SQLite的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"轻量级数据库 SQLite"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> **Lv.3 融会贯通**：结合前面学过的知识，用"轻量级数据库 SQLite"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"轻量级数据库 SQLite"
> - → 后续必学：掌握"轻量级数据库 SQLite"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
